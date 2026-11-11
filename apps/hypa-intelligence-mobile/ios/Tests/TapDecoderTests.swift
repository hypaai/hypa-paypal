import Foundation

/// Standalone regression checks; compile with KeyboardTapDecoder.swift.
@main
struct TapDecoderTests {
  static func tap(_ letter: String, _ near: [String: Float] = [:]) -> TapFit {
    TapFit(letter: letter, penalty: [letter: 0.1].merging(near) { $1 })
  }

  static func main() {
    let moeniny = [
      tap("m"), tap("o"), tap("e", ["r": 1.6]), tap("n"), tap("i"), tap("n"), tap("y", ["g": 1.9]),
    ]

    precondition(
      TapDecoder.best("moeniny", taps: moeniny, candidates: ["opening", "morning"]) == "morning",
      "A typed non-word must become the common word the taps point to")
    precondition(
      TapDecoder.best("moeniny", taps: moeniny, candidates: ["opening", "monkeys"]) == nil,
      "Candidates with a letter the taps never came near are ignored")

    let far = [
      tap("m"), tap("o"), tap("e", ["r": 9]), tap("n"), tap("i"), tap("n"), tap("y", ["g": 9]),
    ]
    precondition(
      TapDecoder.best("moeniny", taps: far, candidates: ["morning"]) == nil,
      "A far candidate must not beat the typed word")

    let centred = [tap("o"), tap("m", ["n": 2.7]), tap("g")]
    precondition(
      TapDecoder.best("omg", taps: centred, candidates: ["ong"]) == nil,
      "A letter the finger landed a full key away from is not a slip")

    precondition(
      TapDecoder.best("moeniny", taps: Array(moeniny.dropFirst()), candidates: ["morning"]) == nil,
      "Too few taps are not used")
    precondition(
      TapDecoder.best("moeniny", taps: moeniny.reversed(), candidates: ["morning"]) == nil,
      "Taps that do not match the typed letters are not used")
    precondition(
      TapDecoder.best("moeniny", taps: [tap("t"), tap("h"), tap("e")] + moeniny, candidates: ["morning"])
        == "morning",
      "Taps from earlier words are ignored")

    let common: Set<String> = ["the", "report"]
    func merged(_ spaceCost: Float) -> [TapFit] {
      "thenreport".enumerated().map { index, letter in
        tap(String(letter), index == 3 ? [TapDecoder.space: spaceCost] : [:])
      }
    }
    let nearSpace = TapDecoder.split("thenreport", taps: merged(0.6), isCommon: common.contains)
    precondition(nearSpace?.0 == "the" && nearSpace?.1 == "report", "A tap near the space bar splits the word")
    precondition(
      TapDecoder.split("thenreport", taps: merged(5), isCommon: common.contains) == nil,
      "A tap far from the space bar is not a space")
    precondition(
      TapDecoder.split("thenreport", taps: merged(0.6), isCommon: { $0 == "the" }) == nil,
      "Both halves must be common words")
    precondition(
      TapDecoder.split("abcd", taps: "abcd".map { tap(String($0)) }, isCommon: { _ in true }) == nil,
      "Words too short to hold two halves are never split")

    print("TapDecoderTests passed")
  }
}
