package com.hypaintelligence.hypaintelligence.context

import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Test

/**
 * The words the engine cuts out of its buffer, which decide what gets predicted, corrected and
 * learned.
 *
 * These used to fall out of a chain of string operations; they are now index arithmetic over the
 * buffer, so the boundaries are worth pinning down — particularly the ones where the two could
 * disagree: punctuation between words, runs of whitespace, an apostrophe inside a word, and an
 * empty buffer.
 */
class ContextEngineTest {
  /** No [android.view.inputmethod.InputConnection], so nothing here can resync from an editor. */
  private fun engine() = ContextEngine(inputSupplier = { null })

  private fun engineTyping(text: String) = engine().apply { applyInsertedText(text) }

  @Test
  fun `mid-word the current word is the prefix and the previous one is the word before`() {
    val snapshot = engineTyping("hello wor").snapshot()

    assertEquals("wor", snapshot.currentWord)
    assertEquals("hello", snapshot.previousWord)
  }

  @Test
  fun `at a boundary there is no current word`() {
    val snapshot = engineTyping("hello ").snapshot()

    assertEquals("", snapshot.currentWord)
    assertEquals("hello", snapshot.previousWord)
    assertEquals(true, snapshot.isAtWordBoundary)
  }

  @Test
  fun `several spaces still find the previous word`() {
    val snapshot = engineTyping("hello   ").snapshot()

    assertEquals("", snapshot.currentWord)
    assertEquals("hello", snapshot.previousWord)
  }

  @Test
  fun `punctuation between words leaves no previous word`() {
    // Nothing between the cursor and a full stop is a word, so there is no pair to learn here.
    val snapshot = engineTyping("hello. ").snapshot()

    assertEquals("", snapshot.currentWord)
    assertEquals("", snapshot.previousWord)
  }

  @Test
  fun `an apostrophe is part of the word`() {
    val snapshot = engineTyping("it doesn't").snapshot()

    assertEquals("doesn't", snapshot.currentWord)
    assertEquals("it", snapshot.previousWord)
  }

  @Test
  fun `an empty buffer has no words`() {
    val snapshot = engine().snapshot()

    assertEquals("", snapshot.currentWord)
    assertEquals("", snapshot.previousWord)
    assertEquals("", snapshot.textBeforeCursor)
  }

  @Test
  fun `the first word typed has no previous word`() {
    val snapshot = engineTyping("hello").snapshot()

    assertEquals("hello", snapshot.currentWord)
    assertEquals("", snapshot.previousWord)
  }

  @Test
  fun `the sentence is what follows the last ending`() {
    val snapshot = engineTyping("Done. Now this ").snapshot()

    assertEquals("Now this ", snapshot.sentence)
    assertEquals("this", snapshot.previousWord)
  }

  @Test
  fun `backspace moves the boundaries back`() {
    val engine = engineTyping("hello world")
    engine.applyBackspace(1)

    val snapshot = engine.snapshot()
    assertEquals("worl", snapshot.currentWord)
    assertEquals("hello", snapshot.previousWord)
  }

  @Test
  fun `the buffer keeps only the last window of text`() {
    val engine = engineTyping("x".repeat(ContextEngine.BUFFER_CHARS + 50) + " tail")

    assertEquals(ContextEngine.BUFFER_CHARS, engine.snapshot().textBeforeCursor.length)
    assertEquals("tail", engine.snapshot().currentWord)
  }

  @Test
  fun `repeated snapshots between edits return the same instance`() {
    val engine = engineTyping("hello ")

    assertSame(engine.snapshot(), engine.snapshot())
  }

  @Test
  fun `an edit invalidates the cached snapshot`() {
    val engine = engineTyping("hello")
    val before = engine.snapshot()
    engine.applyInsertedText(" there")

    val after = engine.snapshot()
    assertEquals("hello", before.currentWord)
    assertEquals("there", after.currentWord)
  }

  @Test
  fun `changing language invalidates the cached snapshot`() {
    val engine = engineTyping("hello")
    assertEquals("en", engine.snapshot().language)

    engine.setLanguage("yo")
    assertEquals("yo", engine.snapshot().language)
  }
}
