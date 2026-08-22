from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHAPTER10 = ROOT / "knowledge/chapters/10-附录与行为设计工具箱.md"
OUT_DIR = ROOT / "knowledge/references"

ITEM_RE = re.compile(r"^(\d{1,3})．\s*(.*)$")
FOOTNOTE_RE = re.compile(r"\(\d+\)")  # 半角脚注标记，如 (3)

# 300 个配方的 15 个分类，按书中顺序
CATEGORIES = [
    "职场女性",
    "改善睡眠",
    "充满活力的老人",
    "照顾者",
    "新晋管理者",
    "大学生",
    "（父亲们）居家办公",
    "减轻压力",
    "团队工作",
    "提高效率",
    "有益大脑健康",
    "加强亲密关系",
    "保持专注",
    "终止坏习惯",
    "出差",
]


def find_line(lines: list[str], substr: str) -> int:
    for i, line in enumerate(lines):
        if substr in line:
            return i
    return -1


def parse_items(block_lines: list[str]) -> list[dict]:
    """把 'N．' 开头的条目解析成列表，跨行引号续接合并。"""
    items: list[dict] = []
    cur: dict | None = None
    for raw in block_lines:
        line = raw.strip()
        if not line:
            continue
        # 去掉行首粘着的脚注标记，如 "(6)81．..."
        line = re.sub(r"^\(\d+\)", "", line).strip()
        if not line:
            continue
        # 跳过页码标题与空页占位
        if line.startswith("#") or line.startswith("*本页") or line.startswith("[PDF 第"):
            continue
        m = ITEM_RE.match(line)
        if m:
            if cur:
                items.append(cur)
            cur = {"n": int(m.group(1)), "text": m.group(2).strip()}
        elif cur is not None:
            cur["text"] += line
    if cur:
        items.append(cur)
    return items


def clean(text: str) -> str:
    text = FOOTNOTE_RE.sub("", text)
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    return text


def main() -> None:
    lines = CHAPTER10.read_text(encoding="utf-8").splitlines()

    # --- 庆祝方式：第 330–335 页 ---
    celeb_start = find_line(lines, "100种庆祝方式")
    celeb_end = find_line(lines, "300个微习惯配方")
    if celeb_start == -1 or celeb_end == -1:
        raise RuntimeError("无法定位庆祝方式或配方区段")

    celebrations = [
        {"id": it["n"], "text": clean(it["text"])}
        for it in parse_items(lines[celeb_start:celeb_end])
    ]

    # --- 微习惯配方：第 335–355 页 ---
    recipe_end = find_line(lines, "奖励，英文为reward")  # 第 360 页译者注起点
    if recipe_end == -1:
        recipe_end = len(lines)

    recipe_lines = lines[celeb_end:recipe_end]
    recipe_text = "\n".join(recipe_lines)
    recipe_text = re.sub(r"^\(\d+\)", "", recipe_text.strip())
    recipe_text = recipe_text.replace("300个微习惯配方", "", 1)

    cat_re = re.compile(
        "(" + "|".join(re.escape(c + "的微习惯配方") for c in CATEGORIES) + r")(?=\d{1,3}．)"
    )
    parts = re.split(cat_re, recipe_text)

    categories: list[dict] = []
    # parts = ["", header1, block1, header2, block2, ...]
    for i in range(1, len(parts), 2):
        header = parts[i]
        block = parts[i + 1] if i + 1 < len(parts) else ""
        name = header.removesuffix("的微习惯配方")
        items = [
            {"id": it["n"], "recipe": clean(it["text"])}
            for it in parse_items(block.splitlines())
        ]
        categories.append({"name": name, "items": items})

    total_recipes = sum(len(c["items"]) for c in categories)

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # --- JSON（供软件程序化加载） ---
    celeb_json = {
        "source": "knowledge/chapters/10-附录与行为设计工具箱.md，PDF 第 330–335 页",
        "count": len(celebrations),
        "items": celebrations,
    }
    recipe_json = {
        "source": "knowledge/chapters/10-附录与行为设计工具箱.md，PDF 第 335–355 页",
        "count": total_recipes,
        "categories": categories,
    }
    (OUT_DIR / "庆祝方式库.json").write_text(
        json.dumps(celeb_json, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (OUT_DIR / "微习惯配方库.json").write_text(
        json.dumps(recipe_json, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # --- Markdown（供人 / AI 阅读） ---
    md = [
        "# 庆祝方式库",
        "",
        "> 来源：`knowledge/chapters/10-附录与行为设计工具箱.md`，PDF 第 330–335 页。",
        "> 说明：共 100 种庆祝方式，供第 6 步「庆祝成功」作为可选参考。",
        "",
    ]
    for it in celebrations:
        md.append(f"{it['id']}. {it['text']}")
    (OUT_DIR / "庆祝方式库.md").write_text("\n".join(md), encoding="utf-8")

    md = [
        "# 微习惯配方库",
        "",
        "> 来源：`knowledge/chapters/10-附录与行为设计工具箱.md`，PDF 第 335–355 页。",
        "> 说明：共 300 个配方，按 15 个场景分类，供第 2 步启发、第 5 步锚点参考。",
        "",
    ]
    for cat in categories:
        md.append(f"## {cat['name']}")
        md.append("")
        for it in cat["items"]:
            md.append(f"{it['id']}. {it['recipe']}")
        md.append("")
    (OUT_DIR / "微习惯配方库.md").write_text("\n".join(md), encoding="utf-8")

    print(f"celebrations={len(celebrations)}")
    print(f"categories={len(categories)}")
    print(f"recipes={total_recipes}")
    for cat in categories:
        print(f"  - {cat['name']}: {len(cat['items'])}")


if __name__ == "__main__":
    main()
