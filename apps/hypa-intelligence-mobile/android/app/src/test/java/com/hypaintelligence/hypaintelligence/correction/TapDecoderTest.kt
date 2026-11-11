package com.hypaintelligence.hypaintelligence.correction

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class TapDecoderTest {
  private fun tap(letter: String, vararg near: Pair<String, Float>) = TapFit(letter, mapOf(letter to 0.1f) + near)

  private val moeniny =
    listOf(
      tap("m"),
      tap("o"),
      tap("e", "r" to 1.6f),
      tap("n"),
      tap("i"),
      tap("n"),
      tap("y", "g" to 1.9f),
    )

  @Test fun `a typed non-word becomes the common word the taps point to`() {
    assertEquals("morning", TapDecoder.best("moeniny", moeniny, listOf("opening", "morning")))
  }

  @Test fun `candidates with a letter the taps never came near are ignored`() {
    assertNull(TapDecoder.best("moeniny", moeniny, listOf("opening", "monkeys")))
  }

  @Test fun `a candidate far from the taps does not beat the typed word`() {
    val far = listOf(tap("m"), tap("o"), tap("e", "r" to 9f), tap("n"), tap("i"), tap("n"), tap("y", "g" to 9f))
    assertNull(TapDecoder.best("moeniny", far, listOf("morning")))
  }

  @Test fun `a letter the finger landed a full key away from is not a slip`() {
    val centred = listOf(tap("o"), tap("m", "n" to 2.7f), tap("g"))
    assertNull(TapDecoder.best("omg", centred, listOf("ong")))
  }

  @Test fun `taps that do not match the typed letters are not used`() {
    assertNull(TapDecoder.best("moeniny", moeniny.drop(1), listOf("morning")))
    assertNull(TapDecoder.best("moeniny", moeniny.reversed(), listOf("morning")))
  }

  @Test fun `taps from earlier words are ignored`() {
    val trail = listOf(tap("t"), tap("h"), tap("e")) + moeniny
    assertEquals("morning", TapDecoder.best("moeniny", trail, listOf("morning")))
  }

  private val common = setOf("the", "report")

  private fun merged(spaceCost: Float) =
    "thenreport".map { tap(it.toString()) }.mapIndexed { i, fit ->
      if (i == 3) TapFit(fit.letter, fit.penalty + (TapDecoder.SPACE to spaceCost)) else fit
    }

  @Test fun `two common words joined by a tap near the space bar are split`() {
    assertEquals("the" to "report", TapDecoder.split("thenreport", merged(0.6f), common::contains))
  }

  @Test fun `a tap far from the space bar is not a space`() {
    assertNull(TapDecoder.split("thenreport", merged(5f), common::contains))
  }

  @Test fun `both halves must be common words`() {
    assertNull(TapDecoder.split("thenreport", merged(0.6f), setOf("the")::contains))
  }
}
