#!/usr/bin/env python3
"""Report dataset health before shipping an asset.

Usage: validate_dataset.py words.txt [--yoruba]"""
import argparse
import re
import unicodedata
from collections import Counter

URLISH = re.compile(r"https?|www\.|\.com|\.net|\.org")
NUMERIC = re.compile(r"\d")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset")
    parser.add_argument("--yoruba", action="store_true")
    args = parser.parse_args()

    total = 0
    words = []
    duplicates = 0
    invalid_unicode = 0
    invalid_tokens = 0
    numeric = 0
    urlish = 0
    seen = set()
    counts = []

    with open(args.dataset, encoding="utf-8", errors="replace") as f:
        for line in f:
            if not line.strip() or line.startswith("#"):
                continue
            total += 1
            word = line.split("\t")[0].strip()
            parts = line.rstrip("\n").split("\t")
            if len(parts) == 2 and parts[1].isdigit():
                counts.append(int(parts[1]))
            if "�" in word:
                invalid_unicode += 1
            if word.lower() in seen:
                duplicates += 1
            seen.add(word.lower())
            if NUMERIC.search(word):
                numeric += 1
            if URLISH.search(word):
                urlish += 1
            if not word or " " in word:
                invalid_tokens += 1
            words.append(word)

    lengths = [len(w) for w in words] or [0]
    print(f"total lines:        {total}")
    print(f"unique words:       {len(seen)}")
    print(f"duplicates:         {duplicates}")
    print(f"invalid unicode:    {invalid_unicode}")
    print(f"invalid tokens:     {invalid_tokens}")
    print(f"average length:     {sum(lengths) / len(lengths):.2f}")
    print(f"max length:         {max(lengths)}")
    print(f"numeric tokens:     {100 * numeric / max(total, 1):.2f}%")
    print(f"url-like tokens:    {100 * urlish / max(total, 1):.2f}%")
    if counts:
        print(f"count range:        {min(counts)} .. {max(counts)}")

    if args.yoruba:
        joined = "".join(words)
        decomposed = unicodedata.normalize("NFD", joined)
        marks = Counter(c for c in decomposed if unicodedata.category(c) == "Mn")
        print(f"ẹ usage:            {joined.count('ẹ')}")
        print(f"ọ usage:            {joined.count('ọ')}")
        print(f"ṣ usage:            {joined.count('ṣ')}")
        tone_marks = marks.get("̀", 0) + marks.get("́", 0) + marks.get("̄", 0)
        print(f"tone marks:         {tone_marks}")
