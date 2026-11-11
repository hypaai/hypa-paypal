#!/usr/bin/env python3
"""Count word frequencies from cleaned corpus lines.

Usage: build_frequency.py clean.txt > counts.tsv   (word<TAB>count, descending)"""
import sys
from collections import Counter

if __name__ == "__main__":
    counts: Counter = Counter()
    with open(sys.argv[1], encoding="utf-8") as f:
        for line in f:
            counts.update(line.split())
    for word, count in counts.most_common():
        print(f"{word}\t{count}")
