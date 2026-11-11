package com.hypaintelligence.hypaintelligence.ime

import android.content.BroadcastReceiver
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.res.Configuration
import android.graphics.Color
import android.inputmethodservice.InputMethodService
import android.os.Build
import android.os.SystemClock
import android.text.InputType
import android.view.View
import android.view.WindowInsetsController
import android.view.inputmethod.EditorInfo
import java.util.concurrent.Executors
import kotlin.math.abs
import com.hypaintelligence.hypaintelligence.HypaKeyboardPanelView
import com.hypaintelligence.hypaintelligence.concurrent.KeyboardThreads
import com.hypaintelligence.hypaintelligence.emoji.EmojiCompatBootstrap
import com.hypaintelligence.hypaintelligence.input.insertsNewline
import com.hypaintelligence.hypaintelligence.neural.DeviceCapability
import com.hypaintelligence.hypaintelligence.neural.DeviceTier
import com.hypaintelligence.hypaintelligence.neural.TinyKeysService
import com.hypaintelligence.hypaintelligence.storage.HypaKeyboardClipStore

/** How long Ask text is kept across a screen off or a rotation. */
private const val ASK_DRAFT_KEEP_MS = 10 * 60 * 1000L

/** A screen off counts for the saved text only if it happened this close to the save. */
private const val SCREEN_OFF_LINK_MS = 3_000L

class HypaKeyboardInputMethodService : InputMethodService() {
  private var panel: HypaKeyboardPanelView? = null
  private var clipboard: ClipboardManager? = null
  private var appliedNavigationBarColor: Int? = null
  private lateinit var tinyKeys: TinyKeysService
  private val modelThread = Executors.newSingleThreadExecutor(KeyboardThreads.compute("hypa-model-load"))
  private val onClipChanged =
    ClipboardManager.OnPrimaryClipChangedListener { HypaKeyboardClipStore.captureCurrentClip(this) }

  // Ask text typed before the keyboard was torn down by a screen off or a rotation. Android
  // builds a fresh input view on rotation, so the text has to outlive the view.
  private var askDraft: String? = null
  private var askDraftAtMs = 0L
  private var screenOffAtMs = 0L
  private var lastFieldKey: String? = null
  private val screenOffReceiver =
    object : BroadcastReceiver() {
      override fun onReceive(context: Context?, intent: Intent?) {
        screenOffAtMs = SystemClock.elapsedRealtime()
      }
    }

  override fun onCreate() {
    super.onCreate()
    EmojiCompatBootstrap.initialize(this)
    tinyKeys = TinyKeysService(this)
    clipboard =
      (getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager)?.also {
        it.addPrimaryClipChangedListener(onClipChanged)
      }
    val screenOff = IntentFilter(Intent.ACTION_SCREEN_OFF)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      registerReceiver(screenOffReceiver, screenOff, Context.RECEIVER_NOT_EXPORTED)
    } else {
      registerReceiver(screenOffReceiver, screenOff)
    }
  }

  override fun onCreateInputView(): View {
    val p =
      HypaKeyboardPanelView(
        this,
        inputSupplier = { currentInputConnection },
        onSearch = { performSearchAction() },
        onSurfaceColor = ::applyNavigationBarColor,
        tinyKeys = tinyKeys,
      )
    panel = p
    p.bindEditorInfo(currentInputEditorInfo)
    p.bindSelection(-1, -1)
    return p
  }

  override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
    super.onStartInputView(info, restarting)
    // Ask comes back only after a screen off or a rotation, in the same field, soon after.
    val fieldKey = info?.let { "${it.packageName}:${it.fieldId}" }
    val afterScreenOff = abs(askDraftAtMs - screenOffAtMs) <= SCREEN_OFF_LINK_MS
    val draft =
      askDraft?.takeIf {
        (restarting || afterScreenOff) &&
          fieldKey != null &&
          fieldKey == lastFieldKey &&
          SystemClock.elapsedRealtime() - askDraftAtMs <= ASK_DRAFT_KEEP_MS &&
          !isPasswordField(info)
      }
    askDraft = null
    lastFieldKey = fieldKey
    HypaKeyboardClipStore.captureCurrentClip(this)
    panel?.refreshSettings()
    panel?.bindEditorInfo(info)
    panel?.resetSessionState(preserveActiveMode = restarting)
    draft?.let { panel?.restoreAskDraft(it) }
    panel?.bindSelection(info?.initialSelStart ?: -1, info?.initialSelEnd ?: -1)
    panel?.insertSharedPaymentLink()
  }

  override fun onFinishInputView(finishingInput: Boolean) {
    saveAskDraft()
    super.onFinishInputView(finishingInput)
  }

  // Only a draft is saved, never a null: after a rotation the panel is a fresh view with no Ask
  // state, and a later finish or hide callback must not overwrite the text saved from the old one.
  private fun saveAskDraft() {
    if (isPasswordField(currentInputEditorInfo)) return
    panel?.askDraft()?.let {
      askDraft = it
      askDraftAtMs = SystemClock.elapsedRealtime()
    }
  }

  private fun isPasswordField(info: EditorInfo?): Boolean {
    val type = info?.inputType ?: return false
    val variation = type and InputType.TYPE_MASK_VARIATION
    return when (type and InputType.TYPE_MASK_CLASS) {
      InputType.TYPE_CLASS_TEXT ->
        variation == InputType.TYPE_TEXT_VARIATION_PASSWORD ||
          variation == InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD ||
          variation == InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
      InputType.TYPE_CLASS_NUMBER -> variation == InputType.TYPE_NUMBER_VARIATION_PASSWORD
      else -> false
    }
  }

  override fun onWindowShown() {
    super.onWindowShown()
    if (panel?.usesModel == true && DeviceCapability.tier(this) != DeviceTier.LOW) modelThread.execute { tinyKeys.load() }
  }

  override fun onWindowHidden() {
    super.onWindowHidden()
    saveAskDraft()
    tinyKeys.cancel()
    modelThread.execute { tinyKeys.unload() }
  }

  override fun onTrimMemory(level: Int) {
    super.onTrimMemory(level)
    if (level >= TRIM_MEMORY_RUNNING_LOW) modelThread.execute { tinyKeys.unload() }
  }

  override fun onUpdateSelection(
    oldSelStart: Int,
    oldSelEnd: Int,
    newSelStart: Int,
    newSelEnd: Int,
    candidatesStart: Int,
    candidatesEnd: Int,
  ) {
    super.onUpdateSelection(oldSelStart, oldSelEnd, newSelStart, newSelEnd, candidatesStart, candidatesEnd)
    panel?.bindSelection(newSelStart, newSelEnd)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    // The base class rebuilds the input view here, which drops the Ask text with it.
    saveAskDraft()
    super.onConfigurationChanged(newConfig)
    panel?.onDeviceAppearanceChanged()
  }

  override fun onDestroy() {
    runCatching { unregisterReceiver(screenOffReceiver) }
    clipboard?.removePrimaryClipChangedListener(onClipChanged)
    panel?.shutdownPrediction()
    modelThread.execute { tinyKeys.unload() }
    modelThread.shutdown()
    super.onDestroy()
  }

  private fun applyNavigationBarColor(surface: Int) {
    if (surface == appliedNavigationBarColor) return
    val window = window?.window ?: return
    appliedNavigationBarColor = surface

    @Suppress("DEPRECATION")
    window.navigationBarColor = surface
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      window.isNavigationBarContrastEnforced = false
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      val luminance =
        0.299f * Color.red(surface) + 0.587f * Color.green(surface) + 0.114f * Color.blue(surface)
      window.insetsController?.setSystemBarsAppearance(
        if (luminance > 140f) WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS else 0,
        WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
      )
    }
  }

  private fun performSearchAction() {
    val ic = currentInputConnection ?: return
    val info = currentInputEditorInfo ?: return
    if (insertsNewline(info)) {
      ic.commitText("\n", 1)
      return
    }

    val action = info.imeOptions and EditorInfo.IME_MASK_ACTION
    val customAction = info.actionId.takeIf { it != 0 && !info.actionLabel.isNullOrBlank() }
    val did =
      if (customAction != null) {
        ic.performEditorAction(customAction)
      } else when (action) {
        EditorInfo.IME_ACTION_SEARCH,
        EditorInfo.IME_ACTION_GO,
        EditorInfo.IME_ACTION_SEND,
        EditorInfo.IME_ACTION_DONE,
        EditorInfo.IME_ACTION_NEXT,
        EditorInfo.IME_ACTION_PREVIOUS,
        -> ic.performEditorAction(action)
        else -> ic.performEditorAction(EditorInfo.IME_ACTION_DONE)
      }
    if (!did) {
      ic.commitText("\n", 1)
    }
  }
}
