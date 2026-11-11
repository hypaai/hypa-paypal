package com.hypaintelligence.hypaintelligence.correction

import com.hypaintelligence.hypaintelligence.correction.WordDiff.Change
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WordDiffTest {
  @Test fun `groups adjacent edits and reports insertions and deletions`() {
    assertEquals(
      listOf(
        Change(listOf("i", "realy"), listOf("I", "really")),
        Change(emptyList(), listOf("my")),
        Change(listOf("the"), emptyList()),
      ),
      WordDiff.changes("i realy like Monday the the end", "I really like my Monday the end"),
    )
  }

  @Test fun `identical text has no changes`() {
    assertEquals(emptyList<Change>(), WordDiff.changes("see you  tomorrow", "see you tomorrow"))
  }

  @Test fun `small fixes are one-for-one typo and case repairs without new punctuation`() {
    val small = WordDiff.changes("i realy want too go tommorow", "I really want to go tomorrow")
    assertTrue(small.all(WordDiff::isSmallFix))
    assertFalse(WordDiff.changes("way to say thank", "way to say. Thank").all(WordDiff::isSmallFix))
    assertFalse(WordDiff.changes("on Monday", "on my Monday").all(WordDiff::isSmallFix))
    assertFalse(WordDiff.changes("go their", "go home").all(WordDiff::isSmallFix))
  }
}
