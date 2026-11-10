# Emoji search (HYP-106)

Both native keyboards open search from the magnifier in the emoji category strip.
Search uses the existing picker query interception and alphabet keys; the query never
commits to the host document. Back or Return returns to the emoji panel.

V1 behavior:

- Empty queries show up to 40 recents; other queries show up to 40 ranked matches.
  With no history, the empty state says “No recently used emoji”. “Not found” appears
  only after an emoji search query has no matches.
- Selecting a glyph inserts it and records it as recent. Search and its query remain open.
- Skin-tone variants remain available by holding an emoji in the main grid.
- Matching uses the existing iOS normalized single-token prefix semantics. Multi-word
  AND matching is outside this change.
- Android mirrors iOS ranking: recent order, exact/prefix weight, token position,
  name length, then asset order. Result chips display glyphs and expose names to accessibility.

## Device verification

On both platforms, open a host document with text before and after a selected range.
Open emoji search, type `face`, delete a character, and check that host text stays unchanged.
Select two results: the first should replace the selection and the second should follow it.
Close search and verify that the cursor remains after the inserted emoji.
Repeat closing without selecting anything; the original host selection should remain.

Also check empty recents, populated recents (including skin-tone variants), unknown queries,
horizontal result scrolling, opening from the symbols board, and switching back to grid
skin-tone selection. Language and voice search should retain their existing selection behavior.

## Automated checks

`EmojiSearchIndexTest` covers ranking, recents, limits, case normalization, no matches,
multi-word behavior, and duplicate-token results. Run with Android's `:app:testDebugUnitTest`.
Build the iOS `Hypa Keyboard` scheme from `HypaIntelligence.xcworkspace`.
