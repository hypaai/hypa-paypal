package com.hypaintelligence.hypaintelligence.emoji

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * The emoji sequences from the implementation guide's grapheme suite.
 *
 * Each is one user-perceived character and several UTF-16 units, which is the whole reason
 * backspace cannot delete a fixed number of units. The counts here are what a reader would say,
 * not what `String.length` says — the two disagree for every case below.
 */
class GraphemeTextTest {
  @Test fun `Yoruba combined tones delete as whole clusters`() {
    for (letter in listOf("ẹ́", "ẹ̀", "ẹ̄", "ọ́", "ọ̀", "ọ̄", "n̄", "m̀", "m̄", "Ẹ́", "Ọ̀", "N̄", "M̀", "e\u0323\u0301")) {
      assertSingleCluster(letter)
      assertEquals("ab", ("ab" + letter).dropLast(GraphemeText.lastClusterLength("ab" + letter)))
    }
  }

  @Test fun `cursor steps cross tone clusters without splitting them`() {
    val text = "aẹ́ọ̀n̄b"
    assertEquals(3, GraphemeText.offsetByClusters(text, 1, 1))
    assertEquals(1, GraphemeText.offsetByClusters(text, 3, -1))
    assertEquals(7, GraphemeText.offsetByClusters(text, 1, 3))
    assertEquals(1, GraphemeText.offsetByClusters(text, 7, -3))
    assertEquals(0, GraphemeText.offsetByClusters(text, 0, -2))
    assertEquals(text.length, GraphemeText.offsetByClusters(text, text.length, 2))
  }

  private fun assertSingleCluster(emoji: String) {
    assertEquals("$emoji should be one grapheme cluster", 1, GraphemeText.clusterCount(emoji))
    assertEquals(
      "backspace after $emoji should remove all of it",
      emoji.length,
      GraphemeText.lastClusterLength(emoji),
    )
  }

  @Test
  fun `simple emoji is one cluster`() = assertSingleCluster("😀")

  @Test
  fun `variation selector stays with its base`() = assertSingleCluster("❤️")

  @Test
  fun `zwj pair is one cluster`() = assertSingleCluster("👩‍💻")

  @Test
  fun `zwj sequence with variation selector is one cluster`() = assertSingleCluster("❤️‍🔥")

  @Test
  fun `four person family is one cluster`() = assertSingleCluster("👨‍👩‍👧‍👦")

  @Test
  fun `skin tone modifier stays with its base`() = assertSingleCluster("👍🏽")

  @Test
  fun `zwj sequence with skin tone is one cluster`() = assertSingleCluster("🧑🏽‍🚀")

  @Test
  fun `handshake with two different skin tones is one cluster`() = assertSingleCluster("🫱🏼‍🫲🏿")

  @Test
  fun `regional indicator pair is one flag`() = assertSingleCluster("🇳🇬")

  @Test
  fun `rainbow flag is one cluster`() = assertSingleCluster("🏳️‍🌈")

  @Test
  fun `keycap sequence is one cluster`() = assertSingleCluster("1️⃣")

  @Test
  fun `hash keycap is one cluster`() = assertSingleCluster("#️⃣")

  @Test
  fun `backspace after an emoji leaves the text before it untouched`() {
    val text = "hello 👨‍👩‍👧‍👦"
    val removed = GraphemeText.lastClusterLength(text)
    assertEquals("hello ", text.dropLast(removed))
  }

  @Test
  fun `backspace over ordinary text removes one letter`() {
    assertEquals(1, GraphemeText.lastClusterLength("hello"))
  }

  @Test
  fun `backspace over a tone-marked yoruba vowel removes the whole letter`() {
    // Decomposed ọ̀ — the dot-below letter plus a combining grave, one character to a reader.
    val text = "ọ̀"
    assertEquals(1, GraphemeText.clusterCount(text))
    assertEquals(text.length, GraphemeText.lastClusterLength(text))
  }

  @Test
  fun `empty text has nothing to delete`() {
    assertEquals(0, GraphemeText.lastClusterLength(""))
    assertEquals(0, GraphemeText.clusterCount(""))
  }

  @Test
  fun `two emoji are two clusters and only the last is deleted`() {
    val text = "👍🏽👩‍💻"
    assertEquals(2, GraphemeText.clusterCount(text))
    assertEquals("👍🏽", text.dropLast(GraphemeText.lastClusterLength(text)))
  }
}
