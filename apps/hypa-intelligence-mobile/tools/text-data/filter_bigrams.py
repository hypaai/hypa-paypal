#!/usr/bin/env python3
"""Filter a raw bigram counts file down to the runtime bigrams.txt asset.

Keeps only pairs of clean alphabetic tokens whose words both exist in the prediction vocabulary,
caps continuations per first word (the runtime only ever shows a handful), and caps the overall
list size.

Usage: filter_bigrams.py bigrams.tsv words.txt [--per-word 12] [--top 60000]"""
import argparse
import re
from collections import defaultdict

TOKEN = re.compile(r"^[a-z][a-z']*$")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("bigrams")
    parser.add_argument("words")
    parser.add_argument("--per-word", type=int, default=12)
    parser.add_argument("--top", type=int, default=60000)
    args = parser.parse_args()

    vocab = set()
    with open(args.words, encoding="utf-8") as f:
        for line in f:
            if line.startswith("#") or not line.strip():
                continue
            vocab.add(line.split("\t")[0].strip().lower())

    by_first = defaultdict(list)
    with open(args.bigrams, encoding="utf-8") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) != 2 or not parts[1].isdigit():
                continue
            pair = parts[0].lower().split(" ")
            if len(pair) != 2:
                continue
            w1, w2 = pair
            if not (TOKEN.match(w1) and TOKEN.match(w2)):
                continue
            if w1 not in vocab or w2 not in vocab:
                continue
            by_first[w1].append((w2, int(parts[1])))

    kept = []
    for w1, nexts in by_first.items():
        nexts.sort(key=lambda kv: -kv[1])
        for w2, count in nexts[: args.per_word]:
            kept.append((f"{w1} {w2}", count))

    kept.sort(key=lambda kv: -kv[1])
    for gram, count in kept[: args.top]:
        print(f"{gram}\t{count}")
