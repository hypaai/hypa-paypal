#!/usr/bin/env python3
"""Filter raw counts into the runtime prediction vocabulary (words.txt format).

Usage: build_dictionary.py counts.tsv [--min-count N] [--top N] [--min-len N] [--max-len N]

Drops rare noise, over-long tokens, and single letters; keeps the top N by count."""
import argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("counts")
    parser.add_argument("--min-count", type=int, default=5)
    parser.add_argument("--top", type=int, default=50000)
    parser.add_argument("--min-len", type=int, default=2)
    parser.add_argument("--max-len", type=int, default=24)
    args = parser.parse_args()

    kept = 0
    with open(args.counts, encoding="utf-8") as f:
        for line in f:
            if kept >= args.top:
                break
            parts = line.rstrip("\n").split("\t")
            if len(parts) != 2:
                continue
            word, raw = parts
            count = int(raw)
            if count < args.min_count:
                break  # counts.tsv is sorted descending
            if not (args.min_len <= len(word) <= args.max_len):
                continue
            print(f"{word}\t{count}")
            kept += 1
