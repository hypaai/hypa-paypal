package com.hypaintelligence.hypaintelligence

import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Test

class TextSelectionRangeTest {
  @Test
  fun `snapshot maps local selection offsets into the host document`() {
    val snapshot = TextEditingDocumentSnapshot("partial", 1, 3, startOffset = 40)

    assertEquals(41, snapshot.absoluteOffset(snapshot.selectionStart))
    assertEquals(43, snapshot.absoluteOffset(snapshot.selectionEnd))
  }

  @Test
  fun `character selects forward and selects backward at document end`() {
    assertEquals(TextSelectionRange(1, 2), TextSelectionRanges.character("cat", 1, Locale.US))
    assertEquals(TextSelectionRange(2, 3), TextSelectionRanges.character("cat", 3, Locale.US))
  }

  @Test
  fun `character keeps a surrogate pair together`() {
    assertEquals(TextSelectionRange(1, 3), TextSelectionRanges.character("a😀b", 1, Locale.US))
    assertEquals(1, TextSelectionRanges.caretBefore("a😀b", 3, Locale.US))
    assertEquals(3, TextSelectionRanges.caretAfter("a😀b", 1, Locale.US))
  }

  @Test
  fun `word selects the word on either side of its trailing boundary`() {
    val text = "hello world"
    assertEquals(TextSelectionRange(0, 5), TextSelectionRanges.word(text, 2, Locale.US))
    assertEquals(TextSelectionRange(0, 5), TextSelectionRanges.word(text, 5, Locale.US))
  }

  @Test
  fun `word skips whitespace to select the next word`() {
    assertEquals(
      TextSelectionRange(8, 13),
      TextSelectionRanges.word("hello   world", 6, Locale.US),
    )
  }

  @Test
  fun `line selects content without consuming the newline`() {
    val text = "first line\nsecond line\nthird"
    assertEquals(TextSelectionRange(11, 22), TextSelectionRanges.line(text, 15))
  }
}
