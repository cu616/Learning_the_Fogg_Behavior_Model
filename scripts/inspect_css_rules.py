"""Print compact selector/declaration pairs matching visual CSS terms."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("css_file", type=Path)
    parser.add_argument("terms", nargs="+")
    parser.add_argument("--limit", type=int, default=100)
    args = parser.parse_args()

    text = args.css_file.read_text(encoding="utf-8", errors="ignore")
    count = 0
    for selector, declarations in re.findall(r"([^{}]+)\{([^{}]*)\}", text):
        combined = f"{selector} {declarations}".lower()
        if not any(term.lower() in combined for term in args.terms):
            continue
        selected = [
            item.strip()
            for item in declarations.split(";")
            if any(term.lower() in item.lower() for term in args.terms)
        ]
        if not selected:
            selected = [item.strip() for item in declarations.split(";") if item.strip()]
        selector = re.sub(r"\s+", " ", selector.strip())
        print(f"{selector[-220:]} {{ {'; '.join(selected)} }}")
        count += 1
        if count >= args.limit:
            break


if __name__ == "__main__":
    main()
