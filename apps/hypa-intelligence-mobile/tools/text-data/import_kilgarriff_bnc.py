#!/usr/bin/env python3
"""Convert Adam Kilgarriff's BNC word-frequency lists into the pipeline's counts.tsv format.

Usage: import_kilgarriff_bnc.py 1_1_all_fullalpha.txt > counts.tsv

The fullalpha list is tab-separated: word1, word2, word3, frequency (per million), range,
dispersion — where a lemma summary row is `lemma PoS %` (skipped: its `@ @ form` variant rows
carry the same frequency split by surface form) and `lemma PoS :` marks a lemma with no variants.
Surface forms are aggregated across PoS rows, and only clean alphabetic tokens survive — the raw
list contains %, @, entity escapes, and similar noise."""
import re
import sys
from collections import Counter

TOKEN = re.compile(r"^[a-z][a-z']*$")

if __name__ == "__main__":
    counts: Counter = Counter()
    with open(sys.argv[1], encoding="utf-8", errors="replace") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            # Leading empty field before the first tab is normal in these files.
            if parts and parts[0] == "":
                parts = parts[1:]
            if len(parts) < 6:
                continue
            w1, w2, w3 = parts[0], parts[1], parts[2]
            if w1 == "@" and w2 == "@":
                word = w3  # inflected-form row
            elif w3 == ":":
                word = w1  # lemma without variants
            else:
                continue  # lemma summary row (%) — counted via its variant rows
            try:
                frequency = int(parts[3])
            except ValueError:
                continue
            word = word.strip().lower()
            if frequency <= 0 or not TOKEN.match(word):
                continue
            counts[word] += frequency

    for word, count in counts.most_common():
        print(f"{word}\t{count}")
