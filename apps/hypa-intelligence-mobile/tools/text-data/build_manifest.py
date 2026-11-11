#!/usr/bin/env python3
"""Add or update a dataset entry in the bundled asset manifest, so every shipped file has its
source and license tracked.

Usage:
  build_manifest.py --manifest ../../keyboard-data/text-data/manifest.json \
      --path en/words.txt --language en --source "..." --license "..." \
      [--processing "..."] [--notes "..."] [--no-redistribution]"""
import argparse
import datetime
import json

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--path", required=True)
    parser.add_argument("--language", required=True)
    parser.add_argument("--source", required=True)
    parser.add_argument("--license", required=True)
    parser.add_argument("--processing", default=None)
    parser.add_argument("--notes", default=None)
    parser.add_argument("--no-redistribution", action="store_true")
    args = parser.parse_args()

    with open(args.manifest, encoding="utf-8") as f:
        manifest = json.load(f)

    entry = {
        "path": args.path,
        "language": args.language,
        "source": args.source,
        "license": args.license,
        "generated": datetime.date.today().isoformat(),
        "redistributionAllowed": not args.no_redistribution,
    }
    if args.processing:
        entry["processing"] = args.processing
    if args.notes:
        entry["notes"] = args.notes

    datasets = [d for d in manifest.get("datasets", []) if d.get("path") != args.path]
    datasets.append(entry)
    manifest["datasets"] = sorted(datasets, key=lambda d: d["path"])

    with open(args.manifest, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"recorded {args.path} in {args.manifest}")
