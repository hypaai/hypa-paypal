#!/usr/bin/env python3
"""Normalize raw English corpus lines for counting: lowercase, strip URLs/emails/HTML/digits,
keep letters and apostrophes. Reads stdin, writes cleaned lines to stdout."""
import re
import sys

URL = re.compile(r"https?://\S+|www\.\S+")
EMAIL = re.compile(r"\S+@\S+")
TAG = re.compile(r"<[^>]+>")
KEEP = re.compile(r"[^a-z' ]+")
SPACES = re.compile(r"\s+")


def normalize(line: str) -> str:
    line = line.lower()
    line = URL.sub(" ", line)
    line = EMAIL.sub(" ", line)
    line = TAG.sub(" ", line)
    line = KEEP.sub(" ", line)
    return SPACES.sub(" ", line).strip()


if __name__ == "__main__":
    for raw in sys.stdin:
        cleaned = normalize(raw)
        if cleaned:
            print(cleaned)
