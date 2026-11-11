# Yoruba and Igala keyboard (HYP-107)

Yoruba retains all 26 QWERTY positions, promoting only e/o/s to ẹ/ọ/ṣ.
A tap inserts the dotted letter; hold it for plain e/o/s or a tone variant.
Other base letters stay plain. The approved variants include macrons and exclude
ñ from Yoruba. Igala shares this table as a Yoruba-derived placeholder, not a
linguistically validated Igala layout. Existing space-bar labels name each language.

Edit `scripts/keyboard-layouts.ts`, then run the keyboard language generator.
The generated iOS and Android catalogs contain explicit Shift-once and Caps-lock
forms. Digraphs produce Gb/Ch/Sh with Shift-once and GB/CH/SH with Caps-lock.
Popup case uses the key-down state, before a base tap consumes Shift-once.

Keyboard commits, recorded clipboard text, and canonical corpus spellings use NFC.
Prediction, autocorrect, and learned-vocabulary lookup retain their existing shared
normalization: strip tones, preserve dot-below letters, then NFC. The Yoruba corpus
contains dotted spellings. Restoring q/z/x does not change corpus training; English
text may still need the English layout for appropriate predictions.

## Validation

Run `node --import tsx --test apps/hypa-intelligence-mobile/scripts/keyboard-layouts.test.ts`
from the repository root. Android tests are `KeyboardLanguageCatalogTest`,
`GraphemeTextTest`, and `LanguagePackTest`. They cover layout/case parity, combined
mark deletion and cursor stepping, and canonical-equivalent dictionary lookup.

Device acceptance remains necessary: select Yoruba/Igala; check all keys and
popups with Shift off, Shift-once, automatic capitalization, and Caps-lock.
Repeat the digraph checks for Igbo and Hausa, including toggling Shift without
changing boards. Type ẹ́ọ̀n̄m̀ and verify one-cluster backspace and cursor movement
in a host editor. Check copied decomposed text and dotted-word suggestions.
At the largest supported font size, inspect base keys, previews, and popups for
clipping of upper and lower marks. No linguistic validation beyond the approved
ticket table is implied for Igala.
