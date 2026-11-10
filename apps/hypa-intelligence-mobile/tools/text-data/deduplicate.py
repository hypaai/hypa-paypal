#!/usr/bin/env python3
"""Drop exact duplicate lines (hash-based, order-preserving) so boilerplate and scraped repeats
do not distort frequency counts. Reads stdin, writes unique lines to stdout."""
import hashlib
import sys

if __name__ == "__main__":
    seen = set()
    for line in sys.stdin:
        digest = hashlib.blake2b(line.encode("utf-8"), digest_size=16).digest()
        if digest in seen:
            continue
        seen.add(digest)
        sys.stdout.write(line)
