package com.hypaintelligence.hypaintelligence.storage

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import com.hypaintelligence.hypaintelligence.KeyboardLanguageCatalog
import com.hypaintelligence.hypaintelligence.KeyboardTool
import org.json.JSONObject

object HypaKeyboardStore {
  const val PREFS_NAME: String = "hypa_keyboard_store"
  const val KEY_SETTINGS_JSON: String = "settings_json"
  const val KEY_ASK_PENDING: String = "ask_hypa_pending_request"
  private const val KEY_PAYMENT_LINK = "askPaymentLink"
  private const val KEY_PAYMENT_LINK_TAKEN = "ask_payment_link_taken"
  private const val PAYMENT_LINK_TTL_MS = 10 * 60_000L

  fun prefs(context: Context): SharedPreferences =
    context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun defaultSettingsJson(): String =
    JSONObject()
      .put("languageId", "en")
      .put("name", "")
      .put("token", "")
      .put("translationProvider", KeyboardLanguageCatalog.defaultProviderName)
      .put("translationModel", KeyboardLanguageCatalog.defaultTranslationModelName)
      .put("dictionaryProvider", KeyboardLanguageCatalog.defaultProviderName)
      .put("dictionaryModel", KeyboardLanguageCatalog.defaultDictionaryModelName)
      .put("ttsProvider", KeyboardLanguageCatalog.defaultProviderName)
      .put("ttsModel", KeyboardLanguageCatalog.defaultTtsModelName)
      .put("sttProvider", KeyboardLanguageCatalog.defaultProviderName)
      .put("sttModel", KeyboardLanguageCatalog.defaultSttModelName)
      .put("assistantProvider", "meta")
      .put("assistantModel", "muse-spark-1.3")
      .put("voice", KeyboardLanguageCatalog.defaultVoice)
      .put("ttsLanguage", "en")
      .put("dictionaryLanguage", "English")
      .put("translateSourceLanguage", KeyboardLanguageCatalog.autoDetect.name)
      .put("translateTargetLanguage", "Yoruba")
      .put("longPressDurationMs", 500)
      .put("toolOrder", JSONArray(KeyboardTool.entries.map { it.name }))
      .put(
        "usageStats",
        JSONObject()
          .put("wordsSaved", 0)
          .put("wordsTyped", 0)
          .put("streakDays", 0)
          .put("lastActiveDate", ""),
      )
      .put("appearance", "system")
      .put(
        "themeDark",
        JSONObject()
          .put("surface", "#1A1A1A")
          .put("toolbar", "#515151")
          .put("key", "#515151")
          .put("keyPressed", "#444444")
          .put("label", "#FFFFFF")
          .put("accent", "#515151")
          .put("pill", "#FFFFFF")
          .put("pillLabel", "#111111"),
      )
      .put(
        "themeLight",
        JSONObject()
          .put("surface", "#D1D5DB")
          .put("toolbar", "#FFFFFF")
          .put("key", "#FFFFFF")
          .put("keyPressed", "#E5E7EB")
          .put("label", "#111111")
          .put("accent", "#6B7280")
          .put("pill", "#111111")
          .put("pillLabel", "#FFFFFF"),
      )
      .put("soundEnabled", true)
      .put("predictiveBarEnabled", true)
      .put("autocorrectEnabled", true)
      .put("hapticsEnabled", true)
      .put("vibrationStrength", 100)
      .put("fontSize", 15)
      .put("keyboardHeight", 260)
      .toString()

  fun getSettingsJson(context: Context): String {
    val raw = prefs(context).getString(KEY_SETTINGS_JSON, null)
    return if (raw.isNullOrBlank()) {
      defaultSettingsJson()
    } else {
      raw
    }
  }

  fun setSettingsJson(context: Context, json: String) {
    prefs(context).edit().putString(KEY_SETTINGS_JSON, json).apply()
  }

  fun askPending(context: Context): String =
    prefs(context).getString(KEY_ASK_PENDING, "").orEmpty()

  fun setAskPending(context: Context, requestId: String) {
    prefs(context).edit().putString(KEY_ASK_PENDING, requestId).apply()
  }

  /** Hands Ask Hypa audio to the app, which shares it from `hypaintelligence://share-audio`. */
  fun setAskShareAudio(context: Context, audio: String) {
    val settings = runCatching { JSONObject(getSettingsJson(context)) }.getOrElse { JSONObject() }
    settings.put("askShareAudio", audio)
    setSettingsJson(context, settings.toString())
  }

  /**
   * The message the app's "Share payment link" handed over, once and while fresh, so the
   * keyboard can type it into the chat the merchant returns to.
   */
  fun takePaymentLink(context: Context): String? {
    val link = runCatching { JSONObject(getSettingsJson(context)).optJSONObject(KEY_PAYMENT_LINK) }.getOrNull() ?: return null
    val at = link.optLong("at")
    val message = link.optString("message").trim()
    val prefs = prefs(context)
    if (message.isEmpty() || at == prefs.getLong(KEY_PAYMENT_LINK_TAKEN, 0L)) return null
    if (System.currentTimeMillis() - at > PAYMENT_LINK_TTL_MS) return null
    prefs.edit().putLong(KEY_PAYMENT_LINK_TAKEN, at).apply()
    return message
  }

  /** The server answered with another model (e.g. a provider ran out of credit): the app's picker follows. */
  fun setAssistantModel(context: Context, provider: String, model: String) {
    val settings = runCatching { JSONObject(getSettingsJson(context)) }.getOrElse { JSONObject() }
    settings.put("assistantProvider", provider)
    settings.put("assistantModel", model)
    setSettingsJson(context, settings.toString())
  }

  fun appendAskHypaEvent(context: Context, name: String, props: JSONObject) {
    val settings = runCatching { JSONObject(getSettingsJson(context)) }.getOrElse { JSONObject() }
    val events = settings.optJSONArray("askHypaEvents") ?: JSONArray()
    events.put(JSONObject().put("name", name).put("props", props).put("at", System.currentTimeMillis()))
    while (events.length() > 40) events.remove(0)
    settings.put("askHypaEvents", events)
    setSettingsJson(context, settings.toString())
  }
}
