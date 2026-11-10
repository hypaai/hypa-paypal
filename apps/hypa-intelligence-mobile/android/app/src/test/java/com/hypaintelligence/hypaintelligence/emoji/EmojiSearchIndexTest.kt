package com.hypaintelligence.hypaintelligence.emoji

import org.junit.Assert.assertEquals
import org.junit.Test

class EmojiSearchIndexTest {
  private val index = EmojiSearchIndex(listOf(EmojiGroup("Test", listOf(
    EmojiEntry("😀", "grinning face"),
    EmojiEntry("😁", "beaming face"),
    EmojiEntry("😶", "face without mouth"),
    EmojiEntry("🙂", "faceless"),
    EmojiEntry("🥰", "smiling face with hearts"),
    EmojiEntry("❤️", "heart"),
  ))))

  @Test fun `exact tokens precede prefixes and token position precedes name length`() {
    assertEquals(listOf("😶", "😁", "😀", "🥰", "🙂"),
      index.search("FACE", emptyList(), 40).map { it.sequence })
  }

  @Test fun `recents precede match weight and result limit applies after ranking`() {
    assertEquals(listOf("🙂", "😀"),
      index.search("face", listOf("🙂", "😀"), 2).map { it.sequence })
  }

  @Test fun `empty unknown and multiword queries have no token prefix matches`() {
    for (query in listOf("", "zzzz", "smiling face")) {
      assertEquals(emptyList<EmojiEntry>(), index.search(query, emptyList(), 40))
    }
  }

  @Test fun `exact match outranks longer prefix and duplicate tokens yield one result`() {
    assertEquals(listOf("❤️", "🥰"),
      index.search("heart", emptyList(), 40).map { it.sequence })
    val repeated = EmojiSearchIndex(listOf(EmojiGroup("Test", listOf(EmojiEntry("x", "face face")))))
    assertEquals(listOf("x"), repeated.search("fac", emptyList(), 40).map { it.sequence })
  }
}
