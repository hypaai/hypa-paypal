import Foundation

/// Standalone regression checks; compile with KeyboardEmoji.swift and KeyboardTextData.swift.
@main
struct EmojiSearchDocumentStateTests {
  static func main() {
    let id = UUID()
    func state(_ before: String?, _ after: String?, selection: String? = nil) -> EmojiSearchDocumentState {
      EmojiSearchDocumentState(documentID: id, before: before, after: after, selectedText: selection)
    }

    let expected = state("hello ", " world", selection: "replace me").inserting("😀")
    let callback = state("hello 😀", " world")
    precondition(expected.matches(callback), "A pick must replace selected text and leave no selection")
    // Both delegates may report the same mutation; matching must not consume the state.
    precondition(expected.matches(callback), "The second delayed callback must also keep search open")
    let second = callback.inserting("👩🏽‍💻")
    precondition(second.matches(state("hello 😀👩🏽‍💻", " world")), "A second pick must retain the new caret")
    precondition(!second.matches(state("hello 😀", "👩🏽‍💻 world")), "A real cursor move must close search")
    precondition(!second.matches(state("hello 😀👩🏽‍💻x", " world")), "Host text edits must close search")
    precondition(!second.matches(state("hello 😀👩🏽‍💻", " world", selection: "x")), "A new selection must close search")
    precondition(!second.matches(EmojiSearchDocumentState(
      documentID: UUID(), before: "hello 😀👩🏽‍💻", after: " world", selectedText: nil)),
      "A different document with identical text must close search")
    precondition(state(nil, nil).inserting("❤️").matches(state("❤️", "")), "Empty document contexts must work")
    precondition(!state("", "").inserting("😀").matches(state(nil, nil)), "Unavailable context is not proof of insertion")
    let longPrefix = String(repeating: "a", count: 100)
    precondition(state(longPrefix, "tail").inserting("😀").matches(state(longPrefix + "😀", "tail")),
      "A shifted context window must not close search")
    precondition(state(longPrefix, "tail").inserting("😀").matches(state(String(repeating: "a", count: 49) + "😀", "ta")),
      "Shorter host context windows must still match the insertion")
    print("Passed 11 emoji-search document-state checks")
  }
}
