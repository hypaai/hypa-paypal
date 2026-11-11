package com.hypaintelligence.hypaintelligence

import org.junit.Assert.assertEquals
import org.junit.Test

class KeyboardLanguageCatalogTest {
  @Test fun `Igbo exposes dotted vowel tones and nasal consonants`() {
    assertEquals(listOf("qwẹrtyụịọp", "asdfghjkl", "zxcvbnm"),
      KeyboardLanguageCatalog.alphabetRows("ig").map { it.joinToString("") })
    assertEquals(listOf("I", "Ị́", "Ị̀", "Ị̄", "Í", "Ì", "Ī"),
      KeyboardLanguageCatalog.alternateKeys("ig", "ị", shifted = true))
    assertEquals(listOf("Ṅ", "Ñ", "Nw", "Ny", "Ń", "Ǹ", "N̄"),
      KeyboardLanguageCatalog.alternateKeys("ig", "n", shifted = true))
    assertEquals(listOf("Ṅ", "Ñ", "NW", "NY", "Ń", "Ǹ", "N̄"),
      KeyboardLanguageCatalog.alternateKeys("ig", "n", capsLocked = true))
  }

  @Test fun `Hausa hooked base keys and explicit case forms`() {
    assertEquals(listOf("qwertƴuiop", "asɗfghjƙl", "zxcvɓnm"),
      KeyboardLanguageCatalog.alphabetRows("ha").map { it.joinToString("") })
    assertEquals(listOf("K", "Ƙw", "Ƙy", "Kw", "Ky"),
      KeyboardLanguageCatalog.alternateKeys("ha", "ƙ", shifted = true))
    assertEquals(listOf("K", "ƘW", "ƘY", "KW", "KY"),
      KeyboardLanguageCatalog.alternateKeys("ha", "ƙ", capsLocked = true))
    assertEquals(listOf("Y", "ʼY", "ʼ"),
      KeyboardLanguageCatalog.alternateKeys("ha", "ƴ", shifted = true))
    assertEquals("ƁƊƘƳ", "ɓɗƙƴ".uppercase(java.util.Locale.forLanguageTag("ha")))
  }

  @Test fun `Yoruba and Igala expose dotted keys and complete tone variants`() {
    for (code in listOf("yo", "igl")) {
      assertEquals(listOf("qwẹrtyuiọp", "aṣdfghjkl", "zxcvbnm"),
        KeyboardLanguageCatalog.alphabetRows(code).map { it.joinToString("") })
      assertEquals(listOf("e", "ẹ́", "ẹ̀", "ẹ̄", "é", "è", "ē"), KeyboardLanguageCatalog.alternateKeys(code, "ẹ"))
      assertEquals(listOf("E", "Ẹ́", "Ẹ̀", "Ẹ̄", "É", "È", "Ē"), KeyboardLanguageCatalog.alternateKeys(code, "ẹ", shifted = true))
      assertEquals(listOf("Gb"), KeyboardLanguageCatalog.alternateKeys(code, "g", shifted = true))
      assertEquals(listOf("GB"), KeyboardLanguageCatalog.alternateKeys(code, "g", capsLocked = true))
    }
  }
  @Test fun `Igbo and Hausa digraphs distinguish once from caps lock`() {
    assertEquals(listOf("Gb", "Gh", "Gw"), KeyboardLanguageCatalog.alternateKeys("ig", "g", shifted = true))
    assertEquals(listOf("GB", "GH", "GW"), KeyboardLanguageCatalog.alternateKeys("ig", "g", capsLocked = true))
    assertEquals(listOf("Sh"), KeyboardLanguageCatalog.alternateKeys("ha", "s", shifted = true))
    assertEquals(listOf("SH"), KeyboardLanguageCatalog.alternateKeys("ha", "s", capsLocked = true))
  }
}
