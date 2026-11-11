#!/usr/bin/env python3
"""Merge a trusted counts file (e.g. BNC) with a noisy web counts file (e.g. Norvig's Google Web
list) into one counts.tsv.

Each source is normalized to relative frequency and the merged count is the max, rescaled to
integers — so a word's rank reflects its strongest evidence. Web-only tokens are gated: kept only
if they appear in the validity dictionary, in the trusted list, or above --web-min-count raw
occurrences (misspellings like "teh" sit well below common modern words like "app"). Obvious URL
fragments are dropped regardless.

Usage: merge_counts.py trusted.tsv web.tsv --dictionary dictionary.txt [--web-min-count 5000000]"""
import argparse

URL_FRAGMENTS = {
    "www", "http", "https", "com", "org", "net", "edu", "gov", "html", "htm",
    "php", "asp", "aspx", "jsp", "cgi", "href", "url", "ftp", "xml", "css",
}
SCALE = 1_000_000_000


def read_counts(path):
    counts = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) != 2 or not parts[1].isdigit():
                continue
            counts[parts[0].lower()] = counts.get(parts[0].lower(), 0) + int(parts[1])
    return counts


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("trusted")
    parser.add_argument("web")
    parser.add_argument("--dictionary", required=True)
    parser.add_argument("--web-min-count", type=int, default=5_000_000)
    args = parser.parse_args()

    trusted = read_counts(args.trusted)
    web = read_counts(args.web)
    with open(args.dictionary, encoding="utf-8") as f:
        dictionary = {line.strip() for line in f if line.strip()}

    trusted_total = sum(trusted.values()) or 1
    web_total = sum(web.values()) or 1

    merged = {}
    for word, count in trusted.items():
        merged[word] = count / trusted_total
    for word, count in web.items():
        if word in URL_FRAGMENTS:
            continue
        if word not in trusted and word not in dictionary and count < args.web_min_count:
            continue
        rel = count / web_total
        if rel > merged.get(word, 0.0):
            merged[word] = rel

    for word, rel in sorted(merged.items(), key=lambda kv: (-kv[1], kv[0])):
        scaled = int(rel * SCALE)
        if scaled > 0:
            print(f"{word}\t{scaled}")
