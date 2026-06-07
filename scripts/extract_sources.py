from __future__ import annotations

import json
import re
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Any

import openpyxl
from pypdf import PdfReader

from common_extract import GAME_VERSION, PARSER_VERSION, RAW, slug, source, utc_now, write_json

NEXTDEX_ZIP = RAW / "ER-nextdex-main.zip"
EARLIEST_XLSX = RAW / "Pokémon Elite Redux V2.65 beta — Mono Earliest Locations.xlsx"
TRAINERS_XLSX = RAW / "ER Trainer Locations 2.5.xlsx"

TYPE_NAMES = {
    0: "Normal",
    1: "Fighting",
    2: "Flying",
    3: "Poison",
    4: "Ground",
    5: "Rock",
    6: "Bug",
    7: "Ghost",
    8: "Steel",
    9: "Mystery",
    10: "Fire",
    11: "Water",
    12: "Grass",
    13: "Electric",
    14: "Psychic",
    15: "Ice",
    16: "Dragon",
    17: "Dark",
    18: "Fairy",
}


def load_nextdex_game_data() -> dict[str, Any] | None:
    if not NEXTDEX_ZIP.exists():
        return None
    with zipfile.ZipFile(NEXTDEX_ZIP) as archive:
        with archive.open("ER-nextdex-main/out/gameDataVVanilla.json") as handle:
            return json.load(handle)


def move_ref(move_id: int, method: str, level: int | None = None) -> dict[str, Any]:
    payload = {
        "id": f"move-{move_id}",
        "name": f"Move #{move_id}",
        "learnMethod": method,
        "confidence": "low",
    }
    if level is not None:
        payload["level"] = level
    return payload


def ability_ref(ability_id: int, source_kind: str) -> dict[str, Any]:
    return {
        "id": f"ability-{ability_id}",
        "name": f"Ability #{ability_id}",
        "sourceKind": source_kind,
        "confidence": "low",
    }


def normalize_species(data: dict[str, Any], warnings: list[str]) -> tuple[list[dict], list[dict], list[dict], list[dict], list[dict]]:
    species_records: list[dict] = []
    learnsets: list[dict] = []
    evolutions: list[dict] = []
    move_ids: set[int] = set()
    ability_ids: set[int] = set()
    species_source = source("ER-nextdex-main.zip", "extract_sources.py:nextdex-game-data", "medium", "ER-nextdex-main/out/gameDataVVanilla.json")

    for raw in data.get("species", []):
        dex_number = raw.get("dex", {}).get("id")
        if raw.get("NAME") == "SPECIES_NONE" or raw.get("id", -1) < 1:
            continue
        stats = raw.get("stats", {})
        species_id = slug(raw.get("NAME") or raw.get("name") or f"species-{raw.get('id')}")
        base = stats.get("base") or []
        base_stats = None
        if len(base) >= 6 and all(isinstance(value, int) and value >= 0 for value in base[:6]):
            base_stats = {
                "hp": base[0],
                "attack": base[1],
                "defense": base[2],
                "speed": base[3],
                "spAttack": base[4],
                "spDefense": base[5],
            }

        abilities = []
        for ability_id in stats.get("abis", []) or []:
            if isinstance(ability_id, int) and ability_id > 0:
                ability_ids.add(ability_id)
                abilities.append(ability_ref(ability_id, "numeric-reference"))

        innates = []
        for ability_id in stats.get("inns", []) or []:
            if isinstance(ability_id, int) and ability_id > 0:
                ability_ids.add(ability_id)
                innates.append(ability_ref(ability_id, "numeric-reference"))

        learnset_id = f"learnset-{species_id}"
        level_up = []
        for entry in raw.get("levelUpMoves", []) or []:
            move_id = entry.get("id")
            if isinstance(move_id, int):
                move_ids.add(move_id)
                level_up.append(move_ref(move_id, "level-up", entry.get("lv")))
        tmhm = []
        for move_id in raw.get("TMHMMoves", []) or []:
            if isinstance(move_id, int):
                move_ids.add(move_id)
                tmhm.append(move_ref(move_id, "tmhm"))
        tutor = []
        for move_id in raw.get("tutor", []) or []:
            if isinstance(move_id, int):
                move_ids.add(move_id)
                tutor.append(move_ref(move_id, "tutor"))
        egg = []
        for move_id in raw.get("eggMoves", []) or []:
            if isinstance(move_id, int):
                move_ids.add(move_id)
                egg.append(move_ref(move_id, "egg"))

        learnsets.append({
            "id": learnset_id,
            "speciesId": species_id,
            "levelUp": level_up,
            "tmhm": tmhm,
            "tutor": tutor,
            "egg": egg,
            "source": [species_source],
        })

        evolution_ids: list[str] = []
        for index, evolution in enumerate(raw.get("evolutions", []) or []):
            evo_id = f"evolution-{species_id}-{index}"
            evolution_ids.append(evo_id)
            to_species = evolution.get("in")
            evolutions.append({
                "id": evo_id,
                "fromSpeciesId": species_id,
                "toSpeciesId": f"species-index-{to_species}" if to_species is not None else None,
                "method": f"kind:{evolution.get('kd', 'unknown')}",
                "condition": str(evolution.get("rs", "")) or None,
                "confidence": "low",
                "source": [species_source],
            })

        species_records.append({
            "id": species_id,
            "dexNumber": dex_number if isinstance(dex_number, int) else None,
            "name": raw.get("name") or raw.get("NAME") or species_id,
            "types": [TYPE_NAMES.get(type_id, f"Type #{type_id}") for type_id in stats.get("types", []) if isinstance(type_id, int)],
            "baseStats": base_stats,
            "abilities": abilities,
            "subAbilities": innates,
            "learnsetId": learnset_id,
            "evolutionIds": evolution_ids,
            "locationIds": [],
            "description": raw.get("dex", {}).get("desc"),
            "spriteKey": raw.get("NAME"),
            "confidence": "medium",
            "source": [species_source],
        })

    if move_ids:
        warnings.append("Move names were not present in bundled NextDex JSON; generated move records preserve numeric IDs at low confidence.")
    if ability_ids:
        warnings.append("Ability and sub-ability names were not present in bundled NextDex JSON; generated ability records preserve numeric IDs at low confidence.")

    moves = [{
        "id": f"move-{move_id}",
        "name": f"Move #{move_id}",
        "flags": [],
        "confidence": "low",
        "source": [species_source],
    } for move_id in sorted(move_ids)]

    abilities = [{
        "id": f"ability-{ability_id}",
        "name": f"Ability #{ability_id}",
        "compatibleSpeciesIds": [],
        "confidence": "low",
        "source": [species_source],
    } for ability_id in sorted(ability_ids)]

    subabilities = [{
        "id": f"ability-{ability_id}",
        "name": f"Ability #{ability_id}",
        "compatibleSpeciesIds": [],
        "confidence": "low",
        "kind": "subAbility",
        "source": [species_source],
    } for ability_id in sorted(ability_ids)]

    return species_records, learnsets, evolutions, moves, abilities + subabilities


def cell_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def parse_earliest_locations(warnings: list[str]) -> list[dict]:
    if not EARLIEST_XLSX.exists():
        warnings.append("Earliest locations workbook is missing.")
        return []
    records: dict[str, dict] = {}
    workbook = openpyxl.load_workbook(EARLIEST_XLSX, read_only=True, data_only=True)
    src = source(EARLIEST_XLSX.name, "extract_sources.py:parse-earliest-locations", "medium")
    for sheet in workbook.worksheets:
        if sheet.title == "Index":
            continue
        milestone = sheet.title.strip()
        for row in sheet.iter_rows(min_row=1, values_only=True):
            values = [cell_text(value) for value in row if cell_text(value)]
            if not values:
                continue
            joined = " | ".join(values)
            if len(joined) < 3 or joined.lower().startswith(("pokemon", "location", "notes")):
                continue
            name = values[0]
            location_id = slug(f"{milestone}-{name}")
            records[location_id] = {
                "id": location_id,
                "name": name,
                "area": milestone,
                "earliestAvailability": milestone,
                "encounters": [{
                    "speciesName": name,
                    "earliestMilestone": milestone,
                    "notes": joined,
                    "confidence": "low",
                }],
                "notes": [joined],
                "confidence": "low",
                "source": [src],
            }
    workbook.close()
    return list(records.values())[:2000]


def parse_trainers(warnings: list[str]) -> list[dict]:
    if not TRAINERS_XLSX.exists():
        warnings.append("Trainer locations workbook is missing.")
        return []
    workbook = openpyxl.load_workbook(TRAINERS_XLSX, read_only=True, data_only=True)
    src = source(TRAINERS_XLSX.name, "extract_sources.py:parse-trainer-locations", "low")
    records: list[dict] = []
    for sheet in workbook.worksheets:
        if sheet.title in {"Help", "Table of Contents"}:
            continue
        for row_index, row in enumerate(sheet.iter_rows(min_row=1, values_only=True), start=1):
            values = [cell_text(value) for value in row if cell_text(value)]
            if not values:
                continue
            joined = " | ".join(values)
            if row_index <= 2 and re.search(r"trainer|pokemon|level", joined, re.I):
                continue
            name = values[0]
            if len(name) < 2:
                continue
            records.append({
                "id": slug(f"{sheet.title}-{row_index}-{name}"),
                "name": name,
                "location": sheet.title,
                "team": [],
                "notes": [joined],
                "confidence": "low",
                "source": [src],
            })
            if len(records) >= 2500:
                workbook.close()
                return records
    workbook.close()
    return records


def parse_pdf_docs(warnings: list[str]) -> list[dict]:
    pages: list[dict] = []
    for path in sorted(RAW.glob("*.pdf")):
        src = source(path.name, "extract_sources.py:parse-pdf-docs", "medium")
        try:
            reader = PdfReader(str(path))
            text_parts = []
            for page in reader.pages[:30]:
                extracted = page.extract_text() or ""
                if extracted.strip():
                    text_parts.append(extracted.strip())
            text = "\n\n".join(text_parts)
        except Exception as exc:
            warnings.append(f"Could not parse PDF {path.name}: {exc}")
            continue
        summary = " ".join(text.split())[:500] if text else "PDF parsed but no text was extracted."
        pages.append({
            "id": slug(path.stem),
            "title": path.stem,
            "summary": summary,
            "text": text[:30000],
            "confidence": "medium" if text else "low",
            "source": [src],
        })
    return pages


def build_search(species: list[dict], locations: list[dict], trainers: list[dict], wiki: list[dict]) -> list[dict]:
    docs: list[dict] = []
    for record in species:
        docs.append({
            "id": f"species:{record['id']}",
            "kind": "species",
            "title": record["name"],
            "summary": record.get("description") or "Elite Redux species record",
            "tokens": " ".join([record["name"], " ".join(record.get("types", []))]),
            "href": f"/pokedex/{record['id']}",
            "source": record.get("source", []),
            "confidence": record.get("confidence", "low"),
        })
    for record in locations:
        docs.append({
            "id": f"location:{record['id']}",
            "kind": "location",
            "title": record["name"],
            "summary": record.get("earliestAvailability") or "Location record",
            "tokens": " ".join([record["name"], " ".join(record.get("notes", []))]),
            "href": f"/locations/{record['id']}",
            "source": record.get("source", []),
            "confidence": record.get("confidence", "low"),
        })
    for record in trainers:
        docs.append({
            "id": f"trainer:{record['id']}",
            "kind": "trainer",
            "title": record["name"],
            "summary": record.get("location") or "Trainer record",
            "tokens": " ".join([record["name"], record.get("location", ""), " ".join(record.get("notes", []))]),
            "href": f"/trainers/{record['id']}",
            "source": record.get("source", []),
            "confidence": record.get("confidence", "low"),
        })
    for record in wiki:
        docs.append({
            "id": f"wiki:{record['id']}",
            "kind": "wiki",
            "title": record["title"],
            "summary": record.get("summary", ""),
            "tokens": " ".join([record["title"], record.get("summary", ""), record.get("text", "")]),
            "href": f"/wiki/{record['id']}",
            "source": record.get("source", []),
            "confidence": record.get("confidence", "low"),
        })
    return docs


def main() -> None:
    warnings: list[str] = []
    species: list[dict] = []
    learnsets: list[dict] = []
    evolutions: list[dict] = []
    moves: list[dict] = []
    abilities: list[dict] = []
    subabilities: list[dict] = []

    data = load_nextdex_game_data()
    if data:
        species, learnsets, evolutions, moves, ability_like = normalize_species(data, warnings)
        abilities = [record for record in ability_like if record.get("kind") != "subAbility"]
        subabilities = [record for record in ability_like if record.get("kind") == "subAbility"]
    else:
        warnings.append("ER-nextdex-main.zip is missing or did not contain out/gameDataVVanilla.json.")

    locations = parse_earliest_locations(warnings)
    trainers = parse_trainers(warnings)
    wiki = parse_pdf_docs(warnings)
    items: list[dict] = []
    search_index = build_search(species, locations, trainers, wiki)

    outputs = {
        "species.json": species,
        "learnsets.json": learnsets,
        "evolutions.json": evolutions,
        "moves.json": moves,
        "abilities.json": abilities,
        "subabilities.json": subabilities,
        "items.json": items,
        "locations.json": locations,
        "trainers.json": trainers,
        "mechanics.json": wiki,
        "search-index.json": search_index,
        "warnings.json": warnings,
    }
    for name, payload in outputs.items():
        write_json(name, payload)

    manifest = {
        "gameVersion": GAME_VERSION,
        "generatedAt": utc_now(),
        "parserVersion": PARSER_VERSION,
        "sources": [
            {
                "sourceFile": "ER-nextdex-main.zip",
                "parser": "extract_sources.py:nextdex-game-data",
                "recordCounts": {
                    "species": len(species),
                    "learnsets": len(learnsets),
                    "evolutions": len(evolutions),
                    "moves": len(moves),
                    "abilities": len(abilities),
                    "subabilities": len(subabilities),
                },
                "warnings": [warning for warning in warnings if "Move names" in warning or "Ability" in warning],
                "confidence": "medium",
            },
            {
                "sourceFile": EARLIEST_XLSX.name,
                "parser": "extract_sources.py:parse-earliest-locations",
                "recordCounts": {"locations": len(locations)},
                "warnings": [],
                "confidence": "low",
            },
            {
                "sourceFile": TRAINERS_XLSX.name,
                "parser": "extract_sources.py:parse-trainer-locations",
                "recordCounts": {"trainers": len(trainers)},
                "warnings": [],
                "confidence": "low",
            },
            {
                "sourceFile": "PDF docs",
                "parser": "extract_sources.py:parse-pdf-docs",
                "recordCounts": {"wiki": len(wiki)},
                "warnings": [],
                "confidence": "medium",
            },
        ],
        "totals": {key.removesuffix(".json"): len(value) if isinstance(value, list) else 0 for key, value in outputs.items()},
        "warnings": warnings,
    }
    write_json("manifest.json", manifest)
    print(json.dumps(manifest["totals"], indent=2))
    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"- {warning}")


if __name__ == "__main__":
    main()
