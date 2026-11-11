# text-data — offline corpus pipeline

Builds the compact runtime assets the keyboard consumes from
`keyboard-data/text-data/<lang>/`. **No corpus processing ever happens on-device** —
the app only parses the small pre-built outputs.

Pipeline (per language):

```
raw corpus (one document per line, UTF-8)
  | python3 normalize_english.py   (or normalize_yoruba.py)
  | python3 deduplicate.py
  > clean.txt

python3 build_frequency.py clean.txt            > counts.tsv
python3 build_dictionary.py counts.tsv --min-count 5 --top 50000 > words.txt
python3 build_ngrams.py clean.txt --order 2     > bigrams.txt
python3 validate_dataset.py words.txt --yoruba  # report before shipping
python3 build_manifest.py ...                   # record source + license
```

English: include `en_contractions.txt` when rebuilding `en/words.txt` and `en/common.txt`
(lowercased there). Frequency sources split contractions, and without them autocorrect turns
`i'll` into `ill`. Autocorrect restores a dropped apostrophe (`cant` -> `can't`) unless the bare
form is in `common.txt`, so keep real words (`well`, `its`) there and slang spellings (`dont`) out.

Formats consumed by the runtime (`textdata/LanguagePack.kt`):

- `words.txt` — `canonical<TAB>count`, `#` comments allowed. Prediction vocabulary.
- `dictionary.txt` — one lowercase ASCII word per line, `LC_ALL=C` sorted. Broad validity lexicon
  for autocorrect only (binary-searched as raw bytes at runtime).
- `bigrams.txt` — `word1 word2<TAB>count`.

License rules: keep sources under `data_sources/commercial_safe/` vs `data_sources/research_only/`
and record every source in the asset `manifest.json` via `build_manifest.py`. Never bundle
research-only (e.g. CC-BY-NC) data into a production build — "available online" does not mean
"safe to redistribute".

Yoruba: canonical forms keep dot-below letters (ẹ ọ ṣ) **and** tone marks; the runtime strips only
tone marks for lookup. Never ASCII-fold Yoruba entries.

The current bundled assets are curated starter data (see the asset manifest) — good enough to
exercise the pipeline end to end, meant to be replaced by real corpus builds from these tools.
