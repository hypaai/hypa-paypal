#!/usr/bin/env python3
"""Normalize raw Yoruba corpus lines for counting. Preserves canonical orthography: dot-below
letters (ẹ ọ ṣ) and tone marks survive; URLs/HTML/digits/foreign symbols are stripped.
Reads stdin, writes cleaned lines to stdout."""
import re
import sys
import unicodedata

URL = re.compile(r"https?://\S+|www\.\S+")
EMAIL = re.compile(r"\S+@\S+")
TAG = re.compile(r"<[^>]+>")
SPACES = re.compile(r"\s+")

# Letters plus the combining marks Yoruba orthography uses (tones + dot below).
ALLOWED_COMBINING = {"̀", "́", "̄", "̣"}


def keep_char(c: str) -> bool:
    if c == " " or c == "'":
        return True
    if c in ALLOWED_COMBINING:
        return True
    return unicodedata.category(c).startswith("L")


def normalize(line: str) -> str:
    line = unicodedata.normalize("NFC", line.lower())
    line = URL.sub(" ", line)
    line = EMAIL.sub(" ", line)
    line = TAG.sub(" ", line)
    decomposed = unicodedata.normalize("NFD", line)
    kept = "".join(c if keep_char(c) else " " for c in decomposed)
    return SPACES.sub(" ", unicodedata.normalize("NFC", kept)).strip()


if __name__ == "__main__":
    for raw in sys.stdin:
        cleaned = normalize(raw)
        if cleaned:
            print(cleaned)
