package com.hypaintelligence.hypaintelligence.neural

import java.io.File
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Test

class TinyKeysTokenizerTest {
  private val tokenizer = TinyKeysTokenizer(File("../../../../packages/@hypa-tiny-keys/models/tokenizer.json").readText())
  private val fixtures =
    JSONObject(javaClass.classLoader!!.getResource("tiny-keys-tokens.json")!!.readText())

  @Test fun `encode matches the reference tokenizer and round-trips`() {
    fixtures.getJSONArray("encode").forEachObject { case ->
      val text = case.getString("text")
      val ids = case.getJSONArray("ids").toIntList()
      assertEquals(text, ids, tokenizer.encode(text))
      assertEquals(text, java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFC), tokenizer.decode(ids))
    }
  }

  @Test fun `chat prompt matches the rendered checkpoint template`() {
    fixtures.getJSONArray("chat").forEachObject { case ->
      val ids = case.getJSONArray("ids").toIntList()
      assertEquals(ids, tokenizer.chat(case.getString("system"), case.getString("user")).toList())
    }
  }

  private fun JSONArray.forEachObject(block: (JSONObject) -> Unit) {
    for (i in 0 until length()) block(getJSONObject(i))
  }

  private fun JSONArray.toIntList(): List<Int> = List(length()) { getInt(it) }
}
