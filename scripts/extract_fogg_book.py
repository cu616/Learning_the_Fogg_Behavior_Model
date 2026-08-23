from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "source"
OUTPUT_DIR = ROOT / "knowledge"
CHAPTER_DIR = OUTPUT_DIR / "chapters"
FULLTEXT_PATH = OUTPUT_DIR / "福格行为模型-全文.md"
PAGE_INDEX_PATH = OUTPUT_DIR / "page-index.jsonl"


@dataclass(frozen=True)
class Chapter:
    number: str
    title: str
    start_page: int
    end_page: int

    @property
    def filename(self) -> str:
        return f"{self.number}-{self.title}.md"


CHAPTERS = [
    Chapter("00", "前置内容", 1, 41),
    Chapter("01", "福格行为模型", 42, 65),
    Chapter("02", "动机与黄金行为", 66, 97),
    Chapter("03", "能力与行为简化", 98, 127),
    Chapter("04", "提示与锚点", 128, 162),
    Chapter("05", "积极情绪与庆祝", 163, 198),
    Chapter("06", "小成功与习惯生长", 199, 235),
    Chapter("07", "行为改变系统方案", 236, 270),
    Chapter("08", "群体行为设计", 271, 308),
    Chapter("09", "结语", 309, 318),
    Chapter("10", "附录与行为设计工具箱", 319, 360),
]


SENTENCE_END = tuple("。！？；：”’）》】」…")
BULLET_PREFIXES = ("·", "•", "❶", "❷", "❸", "❹", "❺", "❻", "❼", "❽", "❾", "❿")


def join_piece(left: str, right: str) -> str:
    if not left:
        return right
    if left[-1].isascii() and left[-1].isalnum() and right[0].isascii() and right[0].isalnum():
        return left + " " + right
    return left + right


def clean_page_text(raw_text: str, page_number: int) -> str:
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n").replace("\u00a0", " ")
    source_lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
    lines = [line for line in source_lines if line and line != str(page_number)]

    paragraphs: list[str] = []
    current = ""

    for line in lines:
        starts_new_item = line.startswith(BULLET_PREFIXES) or bool(re.match(r"^[0-9]{1,3}[．.]\s*\S", line))
        if starts_new_item and current:
            paragraphs.append(current)
            current = ""

        current = join_piece(current, line)

        if line.endswith(SENTENCE_END) or starts_new_item:
            paragraphs.append(current)
            current = ""

    if current:
        paragraphs.append(current)

    cleaned = "\n\n".join(paragraphs)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def chapter_for_page(page_number: int) -> Chapter:
    for chapter in CHAPTERS:
        if chapter.start_page <= page_number <= chapter.end_page:
            return chapter
    raise ValueError(f"Page {page_number} is outside the chapter map")


def markdown_header(title: str, source_name: str) -> str:
    return (
        f"# {title}\n\n"
        f"> 来源：`source/{source_name}`\n"
        "> 说明：由 PDF 文本层自动提取并做轻度断行清理；`[PDF 第 N 页]`为原始 PDF 物理页码，"
        "便于回查图表、脚注和版式。\n\n"
    )


def main() -> None:
    pdfs = sorted(SOURCE_DIR.glob("*.pdf"))
    if len(pdfs) != 1:
        raise RuntimeError(f"Expected exactly one PDF in {SOURCE_DIR}, found {len(pdfs)}")

    source_pdf = pdfs[0]
    reader = PdfReader(source_pdf)
    if len(reader.pages) != CHAPTERS[-1].end_page:
        raise RuntimeError(
            f"Chapter map expects {CHAPTERS[-1].end_page} pages, PDF has {len(reader.pages)}"
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    CHAPTER_DIR.mkdir(parents=True, exist_ok=True)

    pages: dict[int, str] = {}
    for page_number, page in enumerate(reader.pages, start=1):
        pages[page_number] = clean_page_text(page.extract_text() or "", page_number)

    fulltext_parts = [markdown_header("福格行为模型 - 可检索全文", source_pdf.name)]
    for chapter in CHAPTERS:
        fulltext_parts.append(
            f"# {chapter.number} {chapter.title}\n\n"
            f"> PDF 页码：{chapter.start_page}-{chapter.end_page}\n\n"
        )
        chapter_parts = [markdown_header(chapter.title, source_pdf.name)]
        chapter_parts.append(f"> PDF 页码：{chapter.start_page}-{chapter.end_page}\n\n")

        for page_number in range(chapter.start_page, chapter.end_page + 1):
            page_block = f"## [PDF 第 {page_number} 页]\n\n{pages[page_number] or '*本页无可提取文字。*'}\n\n"
            fulltext_parts.append(page_block)
            chapter_parts.append(page_block)

        chapter_text = "".join(chapter_parts).rstrip() + "\n"
        (CHAPTER_DIR / chapter.filename).write_text(chapter_text, encoding="utf-8")

    fulltext = "".join(fulltext_parts).rstrip() + "\n"
    FULLTEXT_PATH.write_text(fulltext, encoding="utf-8")

    with PAGE_INDEX_PATH.open("w", encoding="utf-8", newline="\n") as index_file:
        for page_number in range(1, len(reader.pages) + 1):
            chapter = chapter_for_page(page_number)
            record = {
                "id": f"fogg-p{page_number:03d}",
                "source": f"source/{source_pdf.name}",
                "chapter": f"{chapter.number} {chapter.title}",
                "pdf_page": page_number,
                "text": pages[page_number],
            }
            index_file.write(json.dumps(record, ensure_ascii=False) + "\n")

    nonempty_pages = sum(bool(text) for text in pages.values())
    total_characters = sum(len(text) for text in pages.values())
    print(f"source={source_pdf.name}")
    print(f"pages={len(reader.pages)}")
    print(f"nonempty_pages={nonempty_pages}")
    print(f"characters={total_characters}")
    print(f"chapters={len(CHAPTERS)}")
    print(f"fulltext={FULLTEXT_PATH.relative_to(ROOT)}")
    print(f"index={PAGE_INDEX_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
