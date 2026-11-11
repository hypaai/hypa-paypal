#!/usr/bin/env python3
"""Merge word sources into the single runtime words.txt asset for one language.

The runtime uses this list to decide what is a word and what a mistyped word could have been —
nothing else. Ranking comes from what the user actually types, so counts are dropped here: any
`word<TAB>count` input is accepted and only the word survives.

Usage: build_wordlist.py out.txt in1.txt [in2.txt ...] [--header "text"] [--min-len 2]"""
import argparse
import sys


def words_from(path):
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # Accepts both `word` and `word<TAB>count`; the count is deliberately discarded.
            yield line.split("\t")[0].strip()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("out")
    parser.add_argument("sources", nargs="+")
    parser.add_argument("--header", default="")
    parser.add_argument("--min-len", type=int, default=2)
    args = parser.parse_args()

    merged = set()
    for source in args.sources:
        before = len(merged)
        for word in words_from(source):
            if len(word) >= args.min_len:
                merged.add(word)
        print(f"{source}: +{len(merged) - before} new (total {len(merged)})", file=sys.stderr)

    with open(args.out, "w", encoding="utf-8") as handle:
        if args.header:
            for line in args.header.split("\n"):
                handle.write(f"# {line}\n")
        for word in sorted(merged):
            handle.write(f"{word}\n")
    print(f"wrote {len(merged)} words to {args.out}", file=sys.stderr)
