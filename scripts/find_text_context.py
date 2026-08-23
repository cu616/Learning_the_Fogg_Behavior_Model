"""Print bounded context around literal strings in generated bundles."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("needle")
    parser.add_argument("--context", type=int, default=240)
    parser.add_argument("--limit", type=int, default=20)
    args = parser.parse_args()

    count = 0
    paths = [args.root] if args.root.is_file() else args.root.rglob("*")
    for path in paths:
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        offset = 0
        while count < args.limit:
            index = text.find(args.needle, offset)
            if index < 0:
                break
            start = max(0, index - args.context)
            end = min(len(text), index + len(args.needle) + args.context)
            print(f"\n--- {path.name}:{index} ---\n{text[start:end]}")
            count += 1
            offset = index + len(args.needle)
        if count >= args.limit:
            break


if __name__ == "__main__":
    main()
