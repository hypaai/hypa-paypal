# emoji — Unicode emoji asset pipeline

Builds `keyboard-data/emoji/emoji.txt`, the inventory the keyboard's emoji panel
loads. **No emoji list is maintained by hand anywhere in this repo**, and no emoji artwork is
bundled — the keyboard ships Unicode sequences and the platform's own font draws them.

## Regenerating (also the Unicode version-update process)

```
python3 download_unicode_data.py --version 17.0 --out unicode/
python3 build_emoji_index.py unicode/emoji-test.txt --annotations unicode/annotations-en.json \
    --out ../../keyboard-data/emoji/emoji.txt
./gradlew :app:testDebugUnitTest      # from android/ — grapheme suite must stay green
```

Then bump `unicodeVersion` / `emojiVersion` / `generatedAt` in
`keyboard-data/emoji/emoji_manifest.json`.

## Output format

Line-based UTF-8, grouped so the runtime can index by group without parsing the whole file:

```
# hypa emoji v1
!version<TAB>17.0
[Smileys & Emotion]
<sequence><TAB><name><TAB><variant sequences, space separated (optional)><TAB><CLDR keywords, space separated (optional)>
```

Consumed by `emoji/EmojiRepository.kt`.

## What the generator does and why

- **Fully-qualified entries only.** `emoji-test.txt` also lists minimally-qualified and unqualified
  forms — the same emoji with variation selectors omitted. Shipping them would put visually
  identical duplicates in the grid whose inserted bytes differ.
- **Skin tones are attached to their base**, not listed separately. Unicode gives all five for every
  supported base; as separate entries that would triple the inventory for something the UI shows as
  one key with a long-press. This matches how UTS #51 models them: base emoji + modifier.
- **Gendered forms are folded into their neutral figure.** Unicode names most people emoji three
  times — "technologist", "man technologist", "woman technologist" — and flat that is 417 entries in
  People & Body, most of them near-identical copies. The neutral figure leads and the others become
  its variants, which takes that group to 239. Grouping keys on subgroup as well as name so
  unrelated concepts sharing a word cannot collide, and a concept with only one form is untouched.
- **A toned sequence whose base Unicode never lists alone** is kept as its own entry, so nothing is
  silently dropped from the grid.

Variants are emitted a figure at a time — the entry's own five tones, then each gendered form
followed by its own five — so the picker lays them out six to a row, one figure per row.

Current output: 1,765 grid entries across 9 groups, 2,179 attached variants, ~78KB.

## Provenance

Source is Unicode's own `emoji-test.txt`, under the
[Unicode License v3](https://www.unicode.org/license.txt). Recorded per release in
`emoji_manifest.json`. Emoji artwork from Google, Apple, Samsung, Microsoft, X or WhatsApp is **not**
bundled and must not be.
