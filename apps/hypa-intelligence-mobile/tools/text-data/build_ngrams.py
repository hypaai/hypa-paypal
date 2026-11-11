#!/usr/bin/env python3
"""Count n-grams from cleaned corpus lines.

Usage: build_ngrams.py clean.txt [--order 2|3] [--min-count N] [--top N] > ngrams.txt

Output: "w1 w2[ w3]<TAB>count", descending."""
import argparse
from collections import Counter

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("clean")
    parser.add_argument("--order", type=int, default=2, choices=(2, 3))
    parser.add_argument("--min-count", type=int, default=3)
    parser.add_argument("--top", type=int, default=100000)
    args = parser.parse_args()

    counts: Counter = Counter()
    with open(args.clean, encoding="utf-8") as f:
        for line in f:
            tokens = line.split()
            for i in range(len(tokens) - args.order + 1):
                counts[" ".join(tokens[i : i + args.order])] += 1

    emitted = 0
    for gram, count in counts.most_common():
        if count < args.min_count or emitted >= args.top:
            break
        print(f"{gram}\t{count}")
        emitted += 1
