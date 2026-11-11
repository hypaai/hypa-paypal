package com.hypaintelligence.hypaintelligence.input

import android.text.InputType
import android.view.KeyEvent
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Which fields get key events and which characters have a keycode: the two decisions that route a
 * digit away from commitText on a masked amount field, where committing text drops it.
 */
class KeyboardTextEngineTest {
  @Test
  fun `number, phone and date fields take key events`() {
    assertTrue(sendsKeyEvents(InputType.TYPE_CLASS_NUMBER))
    assertTrue(sendsKeyEvents(InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL))
    assertTrue(sendsKeyEvents(InputType.TYPE_CLASS_PHONE))
    assertTrue(sendsKeyEvents(InputType.TYPE_CLASS_DATETIME))
  }

  @Test
  fun `text fields keep committing text`() {
    assertFalse(sendsKeyEvents(InputType.TYPE_CLASS_TEXT))
    assertFalse(sendsKeyEvents(InputType.TYPE_NULL))
  }

  @Test
  fun `digits map to their own keycodes`() {
    assertEquals(KeyEvent.KEYCODE_0, keyCodeOf("0"))
    assertEquals(KeyEvent.KEYCODE_5, keyCodeOf("5"))
    assertEquals(KeyEvent.KEYCODE_9, keyCodeOf("9"))
    assertEquals(KeyEvent.KEYCODE_PERIOD, keyCodeOf("."))
  }

  @Test
  fun `anything without a keycode stays on the commit path`() {
    assertNull(keyCodeOf("a"))
    assertNull(keyCodeOf("₦"))
    assertNull(keyCodeOf("12"))
    assertNull(keyCodeOf(""))
  }
}
