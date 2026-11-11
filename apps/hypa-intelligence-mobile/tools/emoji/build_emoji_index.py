#!/usr/bin/env python3
"""Turn Unicode's emoji-test.txt into the compact asset the keyboard loads at runtime.

Only fully-qualified entries are kept: minimally-qualified and unqualified lines are the same emoji
with variation selectors omitted, and shipping them would put visually identical duplicates in the
grid whose inserted bytes differ.

Skin-tone variants are not separate grid entries. Unicode lists all five for every supported base,
which would triple the inventory for something the UI presents as one item with a long-press. They
are attached to their base instead, exactly as UTS #51 models them: base emoji + modifier.

Output format — line-based, UTF-8, grouped by category so the runtime can index by offset without
parsing the whole file:

    # hypa emoji v1
    !version<TAB><emoji version>
    [<group name>]
    <sequence><TAB><name><TAB><variant sequences, space separated (optional)><TAB><keywords (optional)>

Usage:
  build_emoji_index.py unicode/emoji-test.txt --annotations unicode/annotations-en.json \
      --out ../../keyboard-data/emoji/emoji.txt
"""
import argparse
import json
import re
import sys

# "1F44D 1F3FD ; fully-qualified # 👍🏽 E1.0 thumbs up: medium skin tone"
ENTRY = re.compile(
    r"^(?P<codepoints>[0-9A-Fa-f ]+?)\s*;\s*(?P<status>[a-z-]+)\s*#\s*\S+\s+E\d+\.\d+\s+(?P<name>.+)$"
)
GROUP = re.compile(r"^#\s*group:\s*(?P<name>.+)$")
SUBGROUP = re.compile(r"^#\s*subgroup:\s*(?P<name>.+)$")
VERSION = re.compile(r"^#\s*Version:\s*(?P<version>\S+)$")

# The five Unicode emoji modifiers (skin tones). A sequence containing one is a variant of the same
# sequence with it removed.
SKIN_TONES = {0x1F3FB, 0x1F3FC, 0x1F3FD, 0x1F3FE, 0x1F3FF}

# Unicode names every gendered emoji as "<who> <what>", so "person frowning", "man frowning" and
# "woman frowning" are one concept written three times. Longest first, so "woman" is not matched as
# "man". The neutral forms are preferred as the face of a group.
GENDER_WORDS = ("people", "person", "women", "woman", "men", "man")
NEUTRAL_WORDS = {"people", "person"}

# Irregular pairs Unicode does not name to the pattern above.
IRREGULAR = {
    "older person": ("older adult", "person"),
    "old man": ("older adult", "man"),
    "old woman": ("older adult", "woman"),
}


def gender_split(name):
    """("what it is", "who is doing it"), or (None, None) when the name has no gendered form."""
    if name in IRREGULAR:
        return IRREGULAR[name]
    for word in GENDER_WORDS:
        if name == word:
            return "", word
        if name.startswith(word + " "):
            return name[len(word) + 1 :], word
        if name.startswith(word + ": "):
            return name[len(word) + 2 :], word
    return None, None


def to_text(codepoints):
    return "".join(chr(c) for c in codepoints)


def parse(path):
    version = "unknown"
    group = None
    subgroup = None
    # base sequence -> {"name", "group", "variants": [...]}, insertion-ordered.
    entries = {}
    # Keyed by the tone-stripped code points so a variant finds its base whatever order they arrive.
    by_stripped = {}

    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line:
                continue
            if line.startswith("#"):
                matched = GROUP.match(line)
                if matched:
                    group = matched.group("name").strip()
                    continue
                matched = SUBGROUP.match(line)
                if matched:
                    subgroup = matched.group("name").strip()
                    continue
                matched = VERSION.match(line)
                if matched:
                    version = matched.group("version").strip()
                continue

            matched = ENTRY.match(line)
            if not matched or matched.group("status") != "fully-qualified":
                continue

            codepoints = [int(c, 16) for c in matched.group("codepoints").split()]
            sequence = to_text(codepoints)
            name = matched.group("name").strip()
            stripped = tuple(c for c in codepoints if c not in SKIN_TONES)

            if any(c in SKIN_TONES for c in codepoints):
                base = by_stripped.get(stripped)
                # A toned sequence whose base Unicode never lists on its own is kept as its own
                # entry rather than dropped — the grid would otherwise lose the emoji entirely.
                if base is None:
                    entries[sequence] = {
                        "name": name, "group": group, "subgroup": subgroup, "variants": []
                    }
                    by_stripped[stripped] = sequence
                else:
                    entries[base]["variants"].append(sequence)
                continue

            if sequence not in entries:
                entries[sequence] = {
                    "name": name, "group": group, "subgroup": subgroup, "variants": []
                }
                by_stripped.setdefault(stripped, sequence)

    return version, entries


def merge_gendered(entries):
    """Fold "man X" and "woman X" into "person X", as variants of it.

    Unicode ships every people emoji three times over — 417 entries in People & Body, most of them
    the same concept with a different figure. Left flat that is what the grid shows, and finding the
    one you want means scrolling past two near-identical copies of everything else.

    Grouping is by subgroup as well as by name so unrelated concepts that happen to share a word
    cannot collide. A concept Unicode gives only one form keeps its own entry untouched.

    Returns the number of entries folded away.
    """
    # The neutral figure is usually named with no gender word at all — 🧑‍💻 is "technologist" while
    # its siblings are "man technologist" and "woman technologist" — so it has to be found by the
    # bare concept name rather than by splitting a prefix off it.
    by_name = {}
    for sequence, entry in entries.items():
        by_name.setdefault((entry["group"], entry["subgroup"], entry["name"]), sequence)

    buckets = {}
    for sequence, entry in entries.items():
        base, _ = gender_split(entry["name"])
        if base is None:
            continue
        buckets.setdefault((entry["group"], entry["subgroup"], base), []).append(sequence)

    folded = 0
    for key, gendered in buckets.items():
        neutral = by_name.get(key)
        sequences = ([neutral] if neutral is not None and neutral not in gendered else []) + gendered
        sequences = [s for s in sequences if s in entries]
        if len(sequences) < 2:
            continue
        # The neutral figure leads where Unicode provides one, so the grid shows a person rather
        # than arbitrarily picking a man or a woman to stand for everyone.
        lead = (
            neutral
            if neutral is not None and neutral in sequences
            else next(
                (s for s in gendered if gender_split(entries[s]["name"])[1] in NEUTRAL_WORDS),
                gendered[0],
            )
        )
        # Each figure keeps its own skin tones, and they stay next to it: lead + 5 tones, then the
        # next figure + its 5, which is what lays the variant picker out in even rows.
        merged = list(entries[lead]["variants"])
        for sequence in sequences:
            if sequence == lead:
                continue
            merged.append(sequence)
            merged.extend(entries[sequence]["variants"])
            del entries[sequence]
            folded += 1
        entries[lead]["variants"] = merged
    return folded


def keywords_by_sequence(path):
    annotations = json.load(open(path, encoding="utf-8"))["annotations"]["annotations"]
    return {
        sequence.replace("\ufe0f", ""): value.get("default", [])
        for sequence, value in annotations.items()
    }


def attach_keywords(entries, keywords):
    for sequence, entry in entries.items():
        words = []
        for keyword in keywords.get(sequence.replace("\ufe0f", ""), []):
            word = keyword.lower()
            if word.isalpha() and word not in words:
                words.append(word)
        entry["keywords"] = words


def write(out, version, entries):
    groups = {}
    for sequence, entry in entries.items():
        groups.setdefault(entry["group"], []).append((sequence, entry))

    out.write("# hypa emoji v1 — generated by tools/emoji/build_emoji_index.py, do not edit\n")
    out.write(f"!version\t{version}\n")
    for group, items in groups.items():
        out.write(f"[{group}]\n")
        for sequence, entry in items:
            variants = " ".join(entry["variants"])
            keywords = " ".join(entry.get("keywords", []))
            row = f"{sequence}\t{entry['name']}"
            if variants or keywords:
                row += f"\t{variants}"
            if keywords:
                row += f"\t{keywords}"
            out.write(row + "\n")
    return groups


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", help="Path to emoji-test.txt")
    parser.add_argument("--annotations", required=True, help="Path to CLDR annotations-en.json")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    version, entries = parse(args.source)
    if not entries:
        sys.exit("No fully-qualified entries parsed — is this really emoji-test.txt?")

    before = len(entries)
    folded = merge_gendered(entries)
    attach_keywords(entries, keywords_by_sequence(args.annotations))

    with open(args.out, "w", encoding="utf-8") as f:
        groups = write(f, version, entries)

    variant_count = sum(len(e["variants"]) for e in entries.values())
    print(f"emoji version {version}")
    print(f"{len(entries):,} grid entries across {len(groups)} groups ({before:,} before grouping)")
    print(f"{folded:,} gendered forms folded into their neutral entry")
    print(f"{variant_count:,} variants total attached to a base")
    print(f"wrote {args.out}")
