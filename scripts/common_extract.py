from __future__ import annotations

import datetime as _dt
import hashlib
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
GENERATED = ROOT / "data" / "generated"
PUBLIC_GENERATED = ROOT / "public" / "generated"
PARSER_VERSION = "0.1.0"
GAME_VERSION = "2.65.3b"


def utc_now() -> str:
    return _dt.datetime.now(_dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def slug(value: str) -> str:
    lowered = value.strip().lower()
    lowered = re.sub(r"[^a-z0-9]+", "-", lowered)
    return lowered.strip("-") or "unknown"


def source(source_file: str, parser: str, confidence: str, source_path: str | None = None, notes: list[str] | None = None) -> dict[str, Any]:
    return {
        "sourceFile": source_file,
        "parser": parser,
        "sourcePath": source_path,
        "extractedAt": utc_now(),
        "confidence": confidence,
        "notes": notes or [],
    }


def write_json(name: str, payload: Any) -> None:
    GENERATED.mkdir(parents=True, exist_ok=True)
    PUBLIC_GENERATED.mkdir(parents=True, exist_ok=True)
    for folder in (GENERATED, PUBLIC_GENERATED):
        with (folder / name).open("w", encoding="utf-8", newline="\n") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def raw_files() -> list[Path]:
    if not RAW.exists():
        return []
    return sorted(path for path in RAW.iterdir() if path.is_file())
