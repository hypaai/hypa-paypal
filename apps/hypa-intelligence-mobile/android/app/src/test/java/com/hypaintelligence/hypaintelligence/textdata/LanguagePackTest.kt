package com.hypaintelligence.hypaintelligence.textdata

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The packed word list, which every completion in the keyboard is served from.
 *
 * Words are appended straight into a byte array as they are read rather than collected as strings
 * and sorted afterwards, so the sort order the binary searches depend on is now an assumption about
 * the asset rather than something the loader imposes. These cover both sides of that: the sorted
 * path the bundled lists take, and the fallback for an asset that arrives out of order — where a
 * silent failure would not crash anything, it would just quietly stop offering completions.
 */
class LanguagePackTest {
  @Test fun `Igbo normalization retains distinguishing dots but ignores tone`() {
    for ((dotted, plain) in listOf("ị" to "i", "ọ" to "o", "ụ" to "u", "ṅ" to "n")) {
      val toned = java.text.Normalizer.normalize(dotted + "́", java.text.Normalizer.Form.NFD)
      assertEquals(dotted, TextNormalizer.normalize(toned))
      assertFalse(TextNormalizer.normalize(toned) == TextNormalizer.normalize(plain))
      assertEquals(dotted + "a", pack(dotted + "a").canonical(dotted + "a"))
    }
  }

  @Test fun `Hausa normalization preserves hooked consonants`() {
    for ((hooked, plain) in listOf("ɓ" to "b", "ɗ" to "d", "ƙ" to "k", "ƴ" to "y")) {
      assertEquals(hooked, TextNormalizer.normalize(hooked.uppercase(java.util.Locale.ROOT)))
      assertFalse(TextNormalizer.normalize(hooked) == TextNormalizer.normalize(plain))
      val pack = pack(hooked + "a")
      assertEquals(hooked + "a", pack.canonical(hooked + "a"))
      assertTrue(pack.alphabet.contains(hooked[0]))
    }
  }

  @Test fun `decomposed Yoruba spellings return NFC canonical words`() {
    val decomposed = java.text.Normalizer.normalize("ẹ́kọ̀", java.text.Normalizer.Form.NFD)
    val pack = pack(decomposed)
    assertEquals("ẹ́kọ̀", pack.canonical(TextNormalizer.normalize("ẹ́kọ̀")))
    assertEquals(TextNormalizer.normalize(decomposed), TextNormalizer.normalize("ẹ́kọ̀"))
    assertTrue(TextNormalizer.normalize("ẹ́kọ̀") != TextNormalizer.normalize("eko"))
  }

  private fun pack(vararg lines: String): LanguagePack =
    requireNotNull(LanguagePack.parse("test", lines.joinToString("\n").byteInputStream()))

  @Test
  fun `finds words from a sorted list`() {
    val pack = pack("ant", "anthem", "any", "apple", "banana")

    assertTrue(pack.contains("ant"))
    assertTrue(pack.contains("banana"))
    assertFalse(pack.contains("ance"))
    assertFalse(pack.contains("bananas"))
  }

  @Test
  fun `finds words from an unsorted list`() {
    val sorted = pack("ant", "anthem", "any", "apple", "banana")
    val unsorted = pack("banana", "any", "ant", "apple", "anthem")

    for (word in listOf("ant", "anthem", "any", "apple", "banana")) {
      assertTrue("$word should be found however the asset was ordered", unsorted.contains(word))
    }
    assertFalse(unsorted.contains("ance"))
    // Both orderings must answer identically, which is the whole point of the fallback.
    assertEquals(sorted.prefix("an", 4), unsorted.prefix("an", 4))
  }

  @Test
  fun `completes a prefix shortest first`() {
    val pack = pack("ant", "anthem", "anthology", "any", "apple")

    assertEquals(listOf("ant", "any", "anthem"), pack.prefix("an", 3))
  }

  @Test
  fun `prefix excludes the word already typed in full`() {
    val pack = pack("ant", "anthem")

    assertEquals(listOf("anthem"), pack.prefix("ant", 5))
  }

  @Test
  fun `prefix past the end of the list does not run off it`() {
    val pack = pack("ant", "anthem", "zebra")

    assertEquals(emptyList<String>(), pack.prefix("zz", 3))
    assertEquals(listOf("zebra"), pack.prefix("z", 3))
  }

  @Test
  fun `an accented word is found by its normalized form and returned as spelled`() {
    val pack = pack("oro", "ọrọ", "ọmọ")

    assertTrue(pack.contains("ọrọ"))
    assertEquals("ọrọ", pack.canonical("ọrọ"))
    // Tone marks are stripped on the way in, so the toneless spelling reaches the same entry.
    assertEquals("ọrọ", pack.canonical(TextNormalizer.normalize("ọ̀rọ̀")))
  }

  @Test
  fun `a capitalised word is found lowercased and returned as the list spells it`() {
    val pack = pack("London", "Paris")

    assertTrue(pack.contains("london"))
    assertEquals("London", pack.canonical("london"))
    assertEquals("Paris", pack.canonical("paris"))
  }

  @Test
  fun `comments and blank lines are skipped`() {
    val pack = pack("# a comment", "", "   ", "ant", "banana")

    assertTrue(pack.contains("ant"))
    assertTrue(pack.contains("banana"))
    assertFalse(pack.contains("#"))
    assertFalse(pack.alphabet.contains('#'))
  }

  @Test
  fun `an empty list is not a pack`() {
    assertNull(LanguagePack.parse("test", "".byteInputStream()))
    assertNull(LanguagePack.parse("test", "# nothing but a comment".byteInputStream()))
  }

  @Test
  fun `the alphabet covers every letter that appears`() {
    val pack = pack("ant", "ọrọ")

    assertTrue(pack.alphabet.containsAll(listOf('a', 'n', 't', 'ọ', 'r')))
  }

  @Test
  fun `a list long enough to grow the buffers stays searchable`() {
    // Past the builder's initial capacity, so the geometric growth and the final trim both run.
    val words = (0 until 20_000).map { "word%05d".format(it) }
    val pack = requireNotNull(LanguagePack.parse("test", words.joinToString("\n").byteInputStream()))

    assertTrue(pack.contains("word00000"))
    assertTrue(pack.contains("word09999"))
    assertTrue(pack.contains("word19999"))
    assertFalse(pack.contains("word20000"))
  }
}
