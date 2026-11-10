# Hausa keyboard (HYP-108)

QWERTY positions promote ɓ, ɗ, ƙ and ƴ. Plain b/d/k/y are the first long-press choices. ƙ includes hooked and plain w/y digraphs; g offers gw/gy, s offers sh, t offers ts. ƴ offers y, ʼy and standalone U+02BC ʼ. No vowel macrons or non-letter row changes. Nigeria-style ƴ is the default.

Explicit Shift-once and Caps-lock forms come from `scripts/keyboard-layouts.ts`; regenerate both native catalogs with `yarn workspace @hypa/intelligence generate:keyboard-languages`. Existing Yoruba tone order is unchanged.

The latest long-press digraph deletes as one unit on immediate backspace when the host supplies unchanged surrounding context. Further typing, host edits, cursor movement and field/session changes invalidate the record. With unavailable context the keyboard falls back to normal grapheme deletion. Manually typing two letters retains ordinary character deletion. A held popup is dismissed on external cursor changes; a stale replacement never blindly deletes selected text.

No Hausa corpus is bundled. Missing active-language packs now disable corpus suggestions/corrections instead of substituting English. Switching languages clears old packs immediately and rejects stale asynchronous loads. Personal vocabulary remains available; normalization preserves hooked consonants. A linguistically reviewed corpus remains future work.

Validation: TypeScript layout tests and Android `KeyboardLanguageCatalogTest` cover hooked Unicode mappings, QWERTY positions, popup ordering and title-case versus caps. Native device QA should cover immediate/repeated backspace, manually typed digraphs, cursor/selection changes during holds, secure fields, switching host fields, rapid language changes, long-press cancellation, both shift modes and small-screen popup reachability. Do not treat static parsing or catalog tests as device interaction coverage.
