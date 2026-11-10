#!/usr/bin/env python3
"""Fetch the pinned Unicode emoji data files the runtime assets are generated from.

The version is pinned deliberately: the keyboard ships its own inventory rather than depending on
whatever emoji data happens to exist on a device, so an emoji is either in the grid on every phone
or on none of them.

Usage:
  download_unicode_data.py --version 17.0 --out unicode/"""
import argparse
import os
import urllib.request

FILES = ("emoji-test.txt", "emoji-sequences.txt", "emoji-zwj-sequences.txt")
BASE = "https://unicode.org/Public/emoji/{version}/{name}"
ANNOTATIONS = "https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-annotations-full/annotations/en/annotations.json"

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", required=True, help="Unicode Emoji version, e.g. 17.0")
    parser.add_argument("--out", required=True, help="Directory to write the raw files into")
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)
    for name, url in [(n, BASE.format(version=args.version, name=n)) for n in FILES] + [
        ("annotations-en.json", ANNOTATIONS)
    ]:
        target = os.path.join(args.out, name)
        with urllib.request.urlopen(url) as response:
            data = response.read()
        with open(target, "wb") as f:
            f.write(data)
        print(f"{target}  ({len(data):,} bytes)  <- {url}")
