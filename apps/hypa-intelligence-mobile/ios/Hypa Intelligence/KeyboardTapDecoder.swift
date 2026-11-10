import Foundation

/// One tap: the letter it typed, and how far it landed from every letter key and from the space bar (0 = dead centre).
struct TapFit {
  let letter: String
  let penalty: [String: Float]
}

/// Picks the common word whose keys best fit where the finger actually landed, for a typed word that is not a word.
enum TapDecoder {
  static let nonWordBonus: Float = 8
  static let uncommonWordBonus: Float = 1.5
  static let splitBonus: Float = 1.5
  /// A changed letter must have been tapped within about 0.8 of a key width, so careful typing of slang like "omg" stays as typed.
  static let maxLetterCost: Float = 2.5
  static let space = " "
  private static let minHalf = 2

  private static func trailOf(_ typed: String, _ taps: [TapFit]) -> [TapFit]? {
    let trail = Array(taps.suffix(typed.count))
    guard trail.count == typed.count else { return nil }
    for (tap, letter) in zip(trail, typed) where tap.letter != String(letter) { return nil }
    return trail
  }

  /// Two common words run together, with a letter between them that was really a tap on the space bar.
  static func split(_ typed: String, taps: [TapFit], isCommon: (String) -> Bool) -> (String, String)? {
    let letters = Array(typed)
    guard letters.count > 2 * minHalf, let trail = trailOf(typed, taps) else { return nil }
    var best: (String, String)?
    var bestGap = splitBonus
    for i in minHalf..<(letters.count - minHalf) {
      guard let spaceCost = trail[i].penalty[space] else { continue }
      let gap = spaceCost - (trail[i].penalty[trail[i].letter] ?? 0)
      if gap >= bestGap { continue }
      let left = String(letters[..<i])
      let right = String(letters[(i + 1)...])
      if isCommon(left) && isCommon(right) {
        best = (left, right)
        bestGap = gap
      }
    }
    return best
  }

  /// `bonus` is how much worse the taps may fit a candidate than the typed word and still win.
  static func best(_ typed: String, taps: [TapFit], candidates: [String], bonus: Float = nonWordBonus) -> String? {
    guard let trail = trailOf(typed, taps) else { return nil }
    var best: String?
    var bestCost = cost(typed, typed, trail) + bonus
    for candidate in candidates {
      let candidateCost = cost(candidate, typed, trail)
      if candidateCost < bestCost {
        best = candidate
        bestCost = candidateCost
      }
    }
    return best
  }

  private static func cost(_ word: String, _ typed: String, _ trail: [TapFit]) -> Float {
    guard word.count == trail.count else { return .greatestFiniteMagnitude }
    var total: Float = 0
    for (tap, (letter, typedLetter)) in zip(trail, zip(word, typed)) {
      guard let penalty = tap.penalty[String(letter)] else { return .greatestFiniteMagnitude }
      if letter != typedLetter && penalty > maxLetterCost { return .greatestFiniteMagnitude }
      total += penalty
    }
    return total
  }
}

