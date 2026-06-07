#!/usr/bin/env python3
"""Extract structured admission programs from Arabic DOCX university files."""

from __future__ import annotations

import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


APP_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = APP_ROOT.parent
DOCX_DIR = PROJECT_ROOT / "الجامعات"
DATA_PATH = APP_ROOT / "data" / "universities_clean.json"
REPORT_PATH = APP_ROOT / "data" / "docx_extraction_report.json"
REVIEW_PATH = PROJECT_ROOT / "output" / "docx_extraction_review.json"

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

DOCX_SOURCES = [
    ("MOD", "وزارة_الدفاع.docx", "الكليات العسكرية - وزارة الدفاع", "الرياض", "المنطقة الوسطى"),
    ("KKMA", "كلية_الملك_خالد_العسكرية.docx", "كلية الملك خالد العسكرية", "الرياض", "المنطقة الوسطى"),
    ("MU", "جامعة_المجمعة.docx", "جامعة المجمعة", "المجمعة", "المنطقة الوسطى"),
    ("UJ", "جامعة_الجوف.docx", "جامعة الجوف", "سكاكا", "المنطقة الشمالية"),
    ("IMAMU", "جامعة_الامام_محمدبن_سعود.docx", "جامعة الإمام محمد بن سعود الإسلامية", "الرياض", "المنطقة الوسطى"),
    ("UJED", "جدة.docx", "جامعة جدة", "جدة", "منطقة مكة المكرمة"),
    ("PSAU", "شروط القبول_جامعة_سطام.docx", "جامعة الأمير سطام بن عبدالعزيز", "الخرج", "المنطقة الوسطى"),
    ("NBU", "الحدود_الشمالية.docx", "جامعة الحدود الشمالية", "عرعر", "المنطقة الشمالية"),
    ("PNU", "جامعة_الأميرة_نورة.docx", "جامعة الأميرة نورة بنت عبدالرحمن", "الرياض", "المنطقة الوسطى"),
    ("UTAB", "جامعة_تبوك.docx", "جامعة تبوك", "تبوك", "المنطقة الشمالية"),
    ("KKU", "جامعة_الملك_خالد.docx", "جامعة الملك خالد", "أبها", "المنطقة الجنوبية"),
    ("UB", "جامعة_بيشة.docx", "جامعة بيشة", "بيشة", "المنطقة الجنوبية"),
    ("BU", "جامعة الباحة.docx", "جامعة الباحة", "الباحة", "المنطقة الجنوبية"),
    ("SU", "جامعة شقراء.docx", "جامعة شقراء", "شقراء", "المنطقة الوسطى"),
    ("UHB", "حفر_الباطن.docx", "جامعة حفر الباطن", "حفر الباطن", "المنطقة الشرقية"),
    ("IAU", "جامعة_عبدالرحمن_بن_فيصل.docx", "جامعة الإمام عبدالرحمن بن فيصل", "الدمام", "المنطقة الشرقية"),
    ("KSU", "جامعة_الملك_سعود.docx", "جامعة الملك سعود", "الرياض", "المنطقة الوسطى"),
    ("UT", "جامعة_الطائف.docx", "جامعة الطائف", "الطائف", "منطقة مكة المكرمة"),
    ("KAU", "جامعة_الملك_عبدالعزيز.docx", "جامعة الملك عبدالعزيز", "جدة", "منطقة مكة المكرمة"),
    ("UOH", "جامعة_حائل.docx", "جامعة حائل", "حائل", "المنطقة الشمالية"),
    ("QU", "جامعة_القصيم.docx", "جامعة القصيم", "بريدة", "المنطقة الوسطى"),
]

PROGRAM_HEADERS = {"الكلية", "التخصص", "الفئة", "المقر", "البرنامج", "الكلية او المسار"}
REQUIREMENT_RE = re.compile(
    r"(يشترط|شرط|الشروط|أن يكون|ان يكون|ألا يكون|الا يكون|لا تقبل|يجب|اجتياز|الفحص|المقابلة|العمر|الثانوية|القدرات|التحصيلي)"
)
SIGNAL_RE = re.compile(
    r"(نسبة|الموزونة|المركبة|المكافئة|ثانوية|قدرات|تحصيلي|قبول|تخصص|كلية|المسار|طلاب|طالبات|بكالوريوس|دبلوم|مقر|فرع)"
)

SCIENCE_WORDS = [
    "الطب",
    "طب ",
    "الصيدلة",
    "صيدلي",
    "التمريض",
    "الهندسة",
    "الحاسب",
    "الحاسبات",
    "تقنية المعلومات",
    "الأمن السيبراني",
    "الذكاء الاصطناعي",
    "العلوم",
    "المختبرات",
    "الأشعة",
    "العلاج",
    "الصحي",
    "الصحية",
]

THEORY_WORDS = [
    "الشريعة",
    "القانون",
    "الآداب",
    "الاداب",
    "اللغة",
    "التربية",
    "الأعمال",
    "الاعمال",
    "الإدارة",
    "الادارة",
    "المحاسبة",
    "التسويق",
    "الاقتصاد",
]


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\u200f", "").replace("\u200e", "")).strip()


def normalize_arabic(text: str) -> str:
    text = clean_text(text)
    text = re.sub(r"[\u064B-\u065F\u0670]", "", text)
    text = text.replace("إ", "ا").replace("أ", "ا").replace("آ", "ا")
    return text


def text_of(element: ET.Element) -> str:
    return clean_text(" ".join(node.text or "" for node in element.findall(".//w:t", NS)))


def read_docx(path: Path) -> tuple[str, list[dict]]:
    with zipfile.ZipFile(path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))

    body = root.find("w:body", NS)
    if body is None:
        return "", []

    blocks = []
    paragraphs = []
    last_heading = ""
    table_index = 0

    for child in body:
        tag = child.tag.rsplit("}", 1)[-1]
        if tag == "p":
            text = text_of(child)
            if not text:
                continue
            paragraphs.append(text)
            if SIGNAL_RE.search(text) or len(text) < 90:
                last_heading = text
            blocks.append({"type": "paragraph", "text": text})
        elif tag == "tbl":
            table_index += 1
            rows = []
            for tr in child.findall("./w:tr", NS):
                row = [text_of(tc) for tc in tr.findall("./w:tc", NS)]
                if any(row):
                    rows.append(row)
            if rows:
                blocks.append(
                    {
                        "type": "table",
                        "index": table_index,
                        "heading": last_heading,
                        "rows": rows,
                    }
                )

    return "\n".join(paragraphs), blocks


def header_index(headers: list[str], choices: list[str]) -> int | None:
    normalized_headers = [normalize_arabic(header) for header in headers]
    for choice in choices:
        normalized_choice = normalize_arabic(choice)
        for index, header in enumerate(normalized_headers):
            if normalized_choice in header:
                return index
    return None


def looks_like_program_table(rows: list[list[str]]) -> bool:
    if not rows:
        return False
    header = " ".join(rows[0])
    matches = sum(1 for word in PROGRAM_HEADERS if word in header)
    return matches >= 2 and ("التخصص" in header or "البرنامج" in header)


def infer_degree(heading: str, previous_degree: str | None) -> str:
    normalized = normalize_arabic(heading)
    if "بكالوريوس" in normalized:
        return "بكالوريوس"
    if "دبلوم" in normalized:
        return "دبلوم"
    return previous_degree or "بكالوريوس"


def normalize_gender(value: str) -> str:
    value = clean_text(value).replace("–", "-").replace("/", " / ")
    normalized = normalize_arabic(value)
    has_male = "طلاب" in normalized or "طالب" in normalized and "طالبات" not in normalized
    has_female = "طالبات" in normalized or "طالبه" in normalized or "إناث" in value or "اناث" in normalized
    if has_male and has_female:
        return "طلاب وطالبات"
    if has_female:
        return "طالبات"
    if has_male:
        return "طلاب"
    return "غير محدد"


def normalize_campus(value: str, main_city: str) -> tuple[str, str]:
    value = clean_text(value).replace("اﻟﻤﻘﺮ اﻟﺮﺋﻴﺲ", "المقر الرئيسي")
    if not value:
        return "", "غير محدد"
    normalized = normalize_arabic(value)
    if "الرئيس" in normalized or value == main_city:
        return "المقر الرئيسي", "مقر رئيسي"
    if "مقر" in normalized and "رئيس" in normalized:
        return "المقر الرئيسي", "مقر رئيسي"
    return value, "فرع"


def infer_formula(row_text: str, degree: str, gender: str) -> str:
    normalized = normalize_arabic(row_text)
    if degree == "دبلوم":
        return "حسب نوع التخصص"
    if "40 %" in row_text and "30 %" in row_text:
        return "40% ثانوية + 30% قدرات + 30% تحصيلي"
    if any(word in normalized for word in [normalize_arabic(word) for word in SCIENCE_WORDS]):
        return "30% ثانوية + 30% قدرات + 40% تحصيلي"
    if any(word in normalized for word in [normalize_arabic(word) for word in THEORY_WORDS]):
        if gender == "طالبات":
            return "حسب الجامعة؛ غالباً موزونة أو مكافئة"
        return "50% ثانوية + 50% قدرات"
    return "حسب نوع التخصص"


def infer_track(row_text: str, degree: str) -> str:
    normalized = normalize_arabic(row_text)
    if degree == "دبلوم":
        return "دبلوم"
    if any(word in normalized for word in [normalize_arabic(word) for word in SCIENCE_WORDS]):
        return "علمي"
    if any(word in normalized for word in [normalize_arabic(word) for word in THEORY_WORDS]):
        return "نظري"
    return "غير محدد"


def infer_row_degree(table_degree: str, row_text: str) -> str:
    normalized = normalize_arabic(row_text)
    if "دبلوم" in normalized or "التطبيقيه" in normalized or "الكلية التطبيقية" in row_text:
        return "دبلوم"
    if table_degree == "دبلوم":
        return "بكالوريوس"
    return table_degree


def extract_min_rate(text: str) -> str:
    normalized = normalize_arabic(text)
    if "تنافسي" in normalized or "مفاضله" in normalized or "المفاضله" in normalized:
        return "تنافسي"
    match = re.search(r"(\d{2}(?:\.\d+)?)\s*%", text)
    if match:
        return f"{match.group(1)}%"
    return "تنافسي"


def extract_requirements(text: str, limit: int = 14) -> list[str]:
    chunks = re.split(r"(?:(?:^|\s)(?:\d+|[أابجدهو])[-.)]\s*)|[؛.]\s+", text)
    picked = []
    seen = set()
    for chunk in chunks:
        line = clean_text(chunk)
        if len(line) < 18 or len(line) > 220:
            continue
        if not REQUIREMENT_RE.search(line):
            continue
        if line in seen:
            continue
        picked.append(line)
        seen.add(line)
        if len(picked) >= limit:
            break
    return picked


def program_key(program: dict) -> tuple:
    return (
        program["degree"],
        normalize_arabic(program["college"]),
        normalize_arabic(program["name"]),
        program["gender"],
        normalize_arabic(program["campus"]),
    )


def extract_programs(blocks: list[dict], source: dict) -> list[dict]:
    programs = []
    seen = set()
    degree = "بكالوريوس"

    for block in blocks:
        if block["type"] != "table":
            if block["type"] == "paragraph":
                degree = infer_degree(block["text"], degree)
            continue

        rows = block["rows"]
        if not looks_like_program_table(rows):
            continue

        headers = rows[0]
        degree = infer_degree(block.get("heading", ""), degree)
        college_i = header_index(headers, ["الكلية", "الكلية او المسار", "المسار"])
        program_i = header_index(headers, ["التخصص", "البرنامج"])
        gender_i = header_index(headers, ["الفئة", "الجنس"])
        campus_i = header_index(headers, ["المقر", "الفرع", "الموقع"])
        if program_i is None:
            continue

        last_values = [""] * len(headers)
        for row in rows[1:]:
            padded = row + [""] * max(0, len(headers) - len(row))
            for index, value in enumerate(padded[: len(headers)]):
                if value:
                    last_values[index] = value

            college = last_values[college_i] if college_i is not None else ""
            program_name = last_values[program_i]
            gender = normalize_gender(last_values[gender_i] if gender_i is not None else "")
            if gender == "غير محدد" and source["id"] == "PNU":
                gender = "طالبات"
            elif gender == "غير محدد" and source["id"] in {"MOD", "KKMA"}:
                gender = "طلاب"
            campus, campus_type = normalize_campus(
                last_values[campus_i] if campus_i is not None else "",
                source["city"],
            )

            program_name = clean_text(program_name).lstrip("•- ")
            college = clean_text(college).lstrip("•- ")
            if not program_name or program_name in {"التخصص", "البرنامج"}:
                continue
            if len(program_name) < 2:
                continue

            row_text = " ".join([block.get("heading", ""), college, program_name, gender, campus])
            row_degree = infer_row_degree(degree, row_text)
            item = {
                "name": program_name,
                "college": college or "غير محدد",
                "min_rate": extract_min_rate(row_text),
                "formula": infer_formula(row_text, row_degree, gender),
                "gender": gender,
                "degree": row_degree,
                "campus": campus or "غير محدد",
                "campus_type": campus_type,
                "city": source["city"],
                "region": source["region"],
                "track": infer_track(row_text, row_degree),
                "source_file": source["file"],
                "source_table": block["index"],
                "source_excerpt": clean_text(row_text)[:280],
            }
            key = program_key(item)
            if key in seen:
                continue
            seen.add(key)
            programs.append(item)

    return programs


def merge_universities(extracted: list[dict]) -> list[dict]:
    by_id = {}

    for item in extracted:
        programs = item["programs"]
        for program in programs:
            program.setdefault("city", item["city"])
            program.setdefault("region", item["region"])
            program.setdefault("campus", "غير محدد")
            program.setdefault("campus_type", "غير محدد")
            program.setdefault("track", infer_track(" ".join([program.get("college", ""), program.get("name", "")]), program.get("degree", "")))
            program.setdefault("source_file", item["source_docx"])
        merged = {
            "id": item["id"],
            "name": item["name"],
            "city": item["city"],
            "region": item["region"],
            "source_docx": item["source_docx"],
            "extraction_method": "docx_tables",
            "programs": programs,
            "requirements": item["requirements"],
            "knowledge_source_txt": item["source_docx"],
            "knowledge_text": item["knowledge_text"],
        }
        by_id[item["id"]] = merged

    ordered_ids = [source[0] for source in DOCX_SOURCES]
    output = [by_id[id_] for id_ in ordered_ids if id_ in by_id]
    return output


def main() -> int:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    REVIEW_PATH.parent.mkdir(parents=True, exist_ok=True)
    extracted = []
    report = []

    for id_, filename, name, city, region in DOCX_SOURCES:
        path = DOCX_DIR / filename
        source = {"id": id_, "file": filename, "name": name, "city": city, "region": region}
        if not path.exists():
            report.append({"id": id_, "name": name, "file": filename, "exists": False, "programs_count": 0})
            continue
        text, blocks = read_docx(path)
        programs = extract_programs(blocks, source)
        requirements = extract_requirements(text)
        extracted.append(
            {
                "id": id_,
                "name": name,
                "city": city,
                "region": region,
                "source_docx": filename,
                "programs": programs,
                "requirements": requirements,
                "knowledge_text": text,
            }
        )
        report.append(
            {
                "id": id_,
                "name": name,
                "file": filename,
                "exists": True,
                "text_chars": len(text),
                "tables_count": sum(1 for block in blocks if block["type"] == "table"),
                "programs_count": len(programs),
                "requirements_count": len(requirements),
            }
        )
        print(f"{id_}\tprograms={len(programs)}\trequirements={len(requirements)}\t{name}")

    merged = merge_universities(extracted)
    DATA_PATH.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REVIEW_PATH.write_text(json.dumps(extracted, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {DATA_PATH}")
    print(f"Saved {REPORT_PATH}")
    print(f"Saved {REVIEW_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
