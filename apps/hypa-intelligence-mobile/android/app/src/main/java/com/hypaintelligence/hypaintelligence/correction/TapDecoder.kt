package com.hypaintelligence.hypaintelligence.correction

/** One tap: the letter it typed, and how far it landed from every letter key and from the space bar (0 = dead centre). */
class TapFit(val letter: String, val penalty: Map<String, Float>)

/** Picks the common word whose keys best fit where the finger actually landed, for a typed word that is not a word. */
object TapDecoder {
  const val NON_WORD_BONUS = 8f
  const val UNCOMMON_WORD_BONUS = 1.5f
  const val SPLIT_BONUS = 1.5f

  /** A changed letter must have been tapped within about 0.8 of a key width, so careful typing of slang like "omg" stays as typed. */
  const val MAX_LETTER_COST = 2.5f
  const val SPACE = " "
  private const val MIN_HALF = 2

  private fun trailOf(typed: String, taps: List<TapFit>): List<TapFit>? {
    val trail = taps.takeLast(typed.length)
    return trail.takeIf { it.size == typed.length && it.indices.all { i -> it[i].letter == typed[i].toString() } }
  }

  /** Two common words run together, with a letter between them that was really a tap on the space bar. */
  fun split(typed: String, taps: List<TapFit>, isCommon: (String) -> Boolean): Pair<String, String>? {
    val trail = trailOf(typed, taps) ?: return null
    var best: Pair<String, String>? = null
    var bestGap = SPLIT_BONUS
    for (i in MIN_HALF until typed.length - MIN_HALF) {
      val gap = (trail[i].penalty[SPACE] ?: continue) - (trail[i].penalty[trail[i].letter] ?: 0f)
      if (gap >= bestGap) continue
      val left = typed.substring(0, i)
      val right = typed.substring(i + 1)
      if (isCommon(left) && isCommon(right)) {
        best = left to right
        bestGap = gap
      }
    }
    return best
  }

  /** [bonus] is how much worse the taps may fit a candidate than the typed word and still win. */
  fun best(typed: String, taps: List<TapFit>, candidates: List<String>, bonus: Float = NON_WORD_BONUS): String? {
    val trail = trailOf(typed, taps) ?: return null
    var best: String? = null
    var bestCost = cost(typed, typed, trail) + bonus
    for (candidate in candidates) {
      val candidateCost = cost(candidate, typed, trail)
      if (candidateCost < bestCost) {
        best = candidate
        bestCost = candidateCost
      }
    }
    return best
  }

  private fun cost(word: String, typed: String, trail: List<TapFit>): Float {
    var total = 0f
    for (i in word.indices) {
      val penalty = trail[i].penalty[word[i].toString()] ?: return Float.MAX_VALUE
      if (word[i] != typed[i] && penalty > MAX_LETTER_COST) return Float.MAX_VALUE
      total += penalty
    }
    return total
  }
}
