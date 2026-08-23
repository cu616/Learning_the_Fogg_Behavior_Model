"""Summarize repeated visual constants in a directory of CSS bundles."""

from __future__ import annotations

import argparse
import collections
import json
import re
from pathlib import Path


PATTERNS = {
    "rgba": re.compile(r"rgba?\([^)]*\)", re.I),
    "hex": re.compile(r"(?<![\w-])#[0-9a-f]{3,8}\b", re.I),
    "font_size": re.compile(r"font-size:([^;}{]+)", re.I),
    "font_weight": re.compile(r"font-weight:([^;}{]+)", re.I),
    "line_height": re.compile(r"line-height:([^;}{]+)", re.I),
    "radius": re.compile(r"border-radius:([^;}{]+)", re.I),
    "blur": re.compile(r"(?:backdrop-filter|-webkit-backdrop-filter|filter):([^;}{]*blur\([^;}{]+)", re.I),
    "opacity": re.compile(r"opacity:([^;}{]+)", re.I),
    "shadow": re.compile(r"box-shadow:([^;}{]+)", re.I),
    "font_family": re.compile(r"font-family:([^;}{]+)", re.I),
}


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip()).lower()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("css_dir", type=Path)
    parser.add_argument("--limit", type=int, default=30)
    args = parser.parse_args()

    files = [args.css_dir] if args.css_dir.is_file() else sorted(args.css_dir.rglob("*.css"))
    results: dict[str, list[dict[str, int | str]]] = {}
    for label, pattern in PATTERNS.items():
        counter: collections.Counter[str] = collections.Counter()
        for path in files:
            text = path.read_text(encoding="utf-8", errors="ignore")
            counter.update(normalize(match) for match in pattern.findall(text))
        results[label] = [
            {"value": value, "count": count}
            for value, count in counter.most_common(args.limit)
        ]

    print(json.dumps({"css_files": len(files), "tokens": results}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
