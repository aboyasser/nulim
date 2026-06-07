#!/usr/bin/env python3
"""
Sync admission knowledge from TXT guides into data/universities_clean.json.

This script updates each university entry with:
  - knowledge_source_txt
  - knowledge_text

It can also append missing universities found in TXT mapping.

Usage:
  python scripts/sync_universities_from_txt.py
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Tuple


TXT_ALIAS: Dict[str, Tuple[str, str]] = {
    "الأمير_سطام.txt": ("PSAU", "جامعة الأمير سطام بن عبدالعزيز"),
    "الباحة.txt": ("BU", "جامعة الباحة"),
    "الجامعة الإسلامية بالمدينة المنورة.txt": ("IU", "الجامعة الإسلامية بالمدينة المنورة"),
    "الجامعة_الالكترونية.txt": ("SEU", "الجامعة السعودية الإلكترونية"),
    "الجوف.txt": ("UJ", "جامعة الجوف"),
    "الطائف.txt": ("UT", "جامعة الطائف"),
    "المجمعة.txt": ("MU", "جامعة المجمعة"),
    "الملك سعود.txt": ("KSU", "جامعة الملك سعود"),
    "الملك_خالد.txt": ("KKU", "جامعة الملك خالد"),
    "الملك_خالد_السكرية.txt": ("KKMA", "كلية الملك خالد العسكرية"),
    "الملك_عبدالعزيز.txt": ("KAU", "جامعة الملك عبدالعزيز"),
    "الملك_فهد.txt": ("KFUPM", "جامعة الملك فهد للبترول والمعادن"),
    "الملك_فيصل.txt": ("KFU", "جامعة الملك فيصل"),
    "بيشة.txt": ("UB", "جامعة بيشة"),
    "تبوك.txt": ("UTAB", "جامعة تبوك"),
    "جامعة الحدود الشمالية.txt": ("NBU", "جامعة الحدود الشمالية"),
    "جامعة_الأميرة_نورة.txt": ("PNU", "جامعة الأميرة نورة بنت عبدالرحمن"),
    "جامعة_الامام.txt": ("IMAMU", "جامعة الإمام محمد بن سعود الإسلامية"),
    "جامعة_القصيم.txt": ("QU", "جامعة القصيم"),
    "جده.txt": ("UJED", "جامعة جدة"),
    "حائل.txt": ("UOH", "جامعة حائل"),
    "شقراء.txt": ("SU", "جامعة شقراء"),
    "عبدالرحمن_بن_فيصل.txt": ("IAU", "جامعة الإمام عبدالرحمن بن فيصل"),
    "وزارة_الدفاع.txt": ("MOD", "الكليات العسكرية - وزارة الدفاع"),
    "‏جامعة حفر الباطن.txt": ("UHB", "جامعة حفر الباطن"),
}


def normalize_name(value: str) -> str:
    return " ".join(value.replace("_", " ").replace("\u200f", "").split())


def find_txt_dir(project_root: Path) -> Path:
    candidates = [
        project_root / "txt",
        project_root.parent / "txt",
    ]
    for candidate in candidates:
        if candidate.exists() and candidate.is_dir():
            return candidate
    raise FileNotFoundError("TXT folder not found in expected locations.")


def main() -> None:
    project_root = Path(__file__).resolve().parents[1]
    txt_dir = find_txt_dir(project_root)
    universities_path = project_root / "data" / "universities_clean.json"

    universities: List[dict] = json.loads(universities_path.read_text(encoding="utf-8"))
    by_id = {u.get("id"): u for u in universities if u.get("id")}

    updated = 0
    added = 0

    for txt_file in sorted(txt_dir.glob("*.txt")):
        content = txt_file.read_text(encoding="utf-8", errors="ignore")
        alias = TXT_ALIAS.get(txt_file.name)
        if alias:
            uni_id, uni_name = alias
        else:
            uni_id, uni_name = None, normalize_name(txt_file.stem)

        target = by_id.get(uni_id) if uni_id else None

        if target is None:
            # Try best-effort name match.
            for uni in universities:
                if normalize_name(uni.get("name", "")) == normalize_name(uni_name):
                    target = uni
                    break

        if target is None:
            target = {
                "id": uni_id,
                "name": uni_name,
                "programs": [],
            }
            universities.append(target)
            if uni_id:
                by_id[uni_id] = target
            added += 1

        target["knowledge_source_txt"] = txt_file.name
        target["knowledge_text"] = content
        updated += 1

    universities_path.write_text(
        json.dumps(universities, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"TXT folder: {txt_dir}")
    print(f"Updated entries: {updated}")
    print(f"Added entries: {added}")
    print(f"Saved: {universities_path}")


if __name__ == "__main__":
    main()

