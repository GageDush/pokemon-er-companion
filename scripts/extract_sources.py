from __future__ import annotations

import json
import shutil
import re
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Any

import openpyxl
from pypdf import PdfReader

from common_extract import GAME_VERSION, PARSER_VERSION, RAW, slug, source, utc_now, write_json

NEXTDEX_ZIP = RAW / "ER-nextdex-main.zip"
NEXTDEX_STATIC_GAME_DATA = "ER-nextdex-main/static/js/data/gameDataV2.65beta.json"
NEXTDEX_FALLBACK_GAME_DATA = "ER-nextdex-main/out/gameDataVVanilla.json"
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


def load_nextdex_game_data(warnings: list[str]) -> tuple[dict[str, Any] | None, str | None, str]:
    if not NEXTDEX_ZIP.exists():
        return None, None, "low"
    with zipfile.ZipFile(NEXTDEX_ZIP) as archive:
        if NEXTDEX_STATIC_GAME_DATA in archive.namelist():
            with archive.open(NEXTDEX_STATIC_GAME_DATA) as handle:
                return json.load(handle), NEXTDEX_STATIC_GAME_DATA, "high"
        if NEXTDEX_FALLBACK_GAME_DATA in archive.namelist():
            warnings.append(f"{NEXTDEX_STATIC_GAME_DATA} missing; fell back to {NEXTDEX_FALLBACK_GAME_DATA}.")
            with archive.open(NEXTDEX_FALLBACK_GAME_DATA) as handle:
                return json.load(handle), NEXTDEX_FALLBACK_GAME_DATA, "medium"
    return None, None, "low"


def move_ref(move_id: int, method: str, moves_by_id: dict[int, dict[str, Any]], level: int | None = None) -> dict[str, Any]:
    move = moves_by_id.get(move_id)
    payload = {
        "id": f"move-{move_id}",
        "name": move.get("name") if move else f"Move #{move_id}",
        "learnMethod": method,
        "confidence": "high" if move else "low",
    }
    if level is not None:
        payload["level"] = level
    return payload


def ability_ref(ability_id: int, source_kind: str, abilities_by_id: dict[int, dict[str, Any]]) -> dict[str, Any]:
    ability = abilities_by_id.get(ability_id)
    return {
        "id": f"ability-{ability_id}",
        "name": ability.get("name") if ability else f"Ability #{ability_id}",
        "sourceKind": "parsed" if ability else source_kind,
        "confidence": "high" if ability else "low",
    }


def normalize_moves(data: dict[str, Any], src: dict[str, Any]) -> tuple[list[dict], dict[int, dict[str, Any]]]:
    split_table = data.get("splitT", [])
    type_table = data.get("typeT", [])
    target_table = data.get("targetT", [])
    flag_table = data.get("flagsT", [])
    moves: list[dict] = []
    by_id: dict[int, dict[str, Any]] = {}
    for raw in data.get("moves", []) or []:
        move_id = raw.get("id")
        if not isinstance(move_id, int) or move_id <= 0:
            continue
        move_types = raw.get("types") or []
        record = {
            "id": f"move-{move_id}",
            "name": raw.get("name") or raw.get("NAME") or f"Move #{move_id}",
            "type": table_lookup(type_table, move_types[0]) if move_types else None,
            "category": table_lookup(split_table, raw.get("split")),
            "power": raw.get("pwr"),
            "accuracy": raw.get("acc"),
            "pp": raw.get("pp"),
            "priority": raw.get("prio"),
            "flags": [table_lookup(flag_table, flag) for flag in raw.get("flags", []) if table_lookup(flag_table, flag)],
            "effectText": raw.get("lDesc") or raw.get("desc") or None,
            "confidence": "high",
            "source": [src],
        }
        if table_lookup(target_table, raw.get("target")):
            record["target"] = table_lookup(target_table, raw.get("target"))
        moves.append(record)
        by_id[move_id] = record
    return moves, by_id


def normalize_abilities(data: dict[str, Any], src: dict[str, Any]) -> tuple[list[dict], list[dict], dict[int, dict[str, Any]]]:
    abilities: list[dict] = []
    by_id: dict[int, dict[str, Any]] = {}
    for raw in data.get("abilities", []) or []:
        ability_id = raw.get("id")
        if not isinstance(ability_id, int) or ability_id <= 0:
            continue
        record = {
            "id": f"ability-{ability_id}",
            "name": raw.get("name") or f"Ability #{ability_id}",
            "effectText": raw.get("desc") or None,
            "compatibleSpeciesIds": [],
            "confidence": "high",
            "source": [src],
        }
        abilities.append(record)
        by_id[ability_id] = record
    subabilities = [{**record, "kind": "subAbility"} for record in abilities]
    return abilities, subabilities, by_id


def normalize_items(data: dict[str, Any], src: dict[str, Any]) -> tuple[list[dict], dict[int, dict[str, Any]]]:
    items: list[dict] = []
    by_id: dict[int, dict[str, Any]] = {}
    for raw in data.get("items", []) or []:
        item_id = raw.get("id")
        if not isinstance(item_id, int) or item_id <= 0:
            continue
        record = {
            "id": f"item-{item_id}",
            "name": raw.get("name") or raw.get("NAME") or f"Item #{item_id}",
            "confidence": "high",
            "source": [src],
        }
        items.append(record)
        by_id[item_id] = record
    return items, by_id


def normalize_species(
    data: dict[str, Any],
    warnings: list[str],
    source_path: str,
    source_confidence: str,
    moves_by_id: dict[int, dict[str, Any]],
    abilities_by_id: dict[int, dict[str, Any]],
) -> tuple[list[dict], list[dict], list[dict]]:
    species_records: list[dict] = []
    learnsets: list[dict] = []
    evolutions: list[dict] = []
    type_table = data.get("typeT", [])
    species_source = source("ER-nextdex-main.zip", "extract_sources.py:nextdex-game-data", source_confidence, source_path)
    species_by_numeric_id = {
        raw.get("id"): slug(raw.get("NAME") or raw.get("name") or f"species-{raw.get('id')}")
        for raw in data.get("species", [])
        if isinstance(raw.get("id"), int) and raw.get("id", -1) > 0
    }

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
                abilities.append(ability_ref(ability_id, "numeric-reference", abilities_by_id))

        innates = []
        for ability_id in stats.get("inns", []) or []:
            if isinstance(ability_id, int) and ability_id > 0:
                innates.append(ability_ref(ability_id, "numeric-reference", abilities_by_id))

        learnset_id = f"learnset-{species_id}"
        level_up = []
        for entry in raw.get("levelUpMoves", []) or []:
            move_id = entry.get("id")
            if isinstance(move_id, int):
                level_up.append(move_ref(move_id, "level-up", moves_by_id, entry.get("lv")))
        tmhm = []
        for move_id in raw.get("TMHMMoves", []) or []:
            if isinstance(move_id, int):
                tmhm.append(move_ref(move_id, "tmhm", moves_by_id))
        tutor = []
        for move_id in raw.get("tutor", []) or []:
            if isinstance(move_id, int):
                tutor.append(move_ref(move_id, "tutor", moves_by_id))
        egg = []
        for move_id in raw.get("eggMoves", []) or []:
            if isinstance(move_id, int):
                egg.append(move_ref(move_id, "egg", moves_by_id))

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
                "toSpeciesId": species_by_numeric_id.get(to_species) if to_species is not None else None,
                "method": f"kind:{evolution.get('kd', 'unknown')}",
                "condition": str(evolution.get("rs", "")) or None,
                "confidence": "medium" if species_by_numeric_id.get(to_species) else "low",
                "source": [species_source],
            })

        sprite_key = sprite_key_from_species_name(raw.get("NAME"))
        species_records.append({
            "id": species_id,
            "dexNumber": dex_number if isinstance(dex_number, int) else None,
            "name": raw.get("name") or raw.get("NAME") or species_id,
            "types": [table_lookup(type_table, type_id) or TYPE_NAMES.get(type_id, f"Type #{type_id}") for type_id in stats.get("types", []) if isinstance(type_id, int)],
            "baseStats": base_stats,
            "abilities": abilities,
            "subAbilities": innates,
            "learnsetId": learnset_id,
            "evolutionIds": evolution_ids,
            "locationIds": [],
            "description": raw.get("dex", {}).get("desc"),
            "spriteKey": raw.get("NAME"),
            "spritePath": f"/generated/sprites/{sprite_key}.png" if sprite_key else None,
            "confidence": source_confidence,
            "source": [species_source],
        })

    return species_records, learnsets, evolutions


def table_lookup(table: list[Any], index: Any) -> Any | None:
    if isinstance(index, int) and 0 <= index < len(table):
        return table[index]
    return None


def sprite_key_from_species_name(name: str | None) -> str | None:
    if not name:
        return None
    return name.removeprefix("SPECIES_")


def extract_sprites(species: list[dict], warnings: list[str]) -> int:
    if not NEXTDEX_ZIP.exists():
        return 0
    sprite_dir = Path("public") / "generated" / "sprites"
    target_dir = Path(__file__).resolve().parents[1] / sprite_dir
    if target_dir.exists():
        shutil.rmtree(target_dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    copied = 0
    with zipfile.ZipFile(NEXTDEX_ZIP) as archive:
        names = set(archive.namelist())
        for record in species:
            key = sprite_key_from_species_name(record.get("spriteKey"))
            if not key:
                record.pop("spritePath", None)
                continue
            archive_path = f"ER-nextdex-main/static/sprites/{key}.png"
            if archive_path not in names:
                record.pop("spritePath", None)
                continue
            with archive.open(archive_path) as src, (target_dir / f"{key}.png").open("wb") as dst:
                shutil.copyfileobj(src, dst)
            copied += 1
    if copied == 0:
        warnings.append("No species sprites were copied from ER-nextdex-main/static/sprites.")
    return copied


def cell_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def normalize_locations(data: dict[str, Any], species_by_numeric_id: dict[int, dict[str, Any]], src: dict[str, Any]) -> list[dict]:
    records: list[dict] = []
    map_names = data.get("mapsT", [])
    encounter_kinds = ["land", "water", "fish", "honey", "rock", "hidden"]
    for raw_map in data.get("locations", {}).get("maps", []) or []:
        map_id = raw_map.get("id")
        if not isinstance(map_id, int):
            continue
        encounters = []
        for kind in encounter_kinds:
            for encounter in raw_map.get(kind, []) or []:
                if not isinstance(encounter, list) or len(encounter) < 3:
                    continue
                min_level, max_level, species_num = encounter[:3]
                species = species_by_numeric_id.get(species_num)
                encounters.append({
                    "speciesId": species.get("id") if species else None,
                    "speciesName": species.get("name") if species else f"Species #{species_num}",
                    "method": kind,
                    "notes": f"Level {min_level}-{max_level}",
                    "confidence": "high" if species else "medium",
                })
        if not encounters:
            continue
        name = table_lookup(map_names, map_id) or f"Map #{map_id}"
        records.append({
            "id": f"map-{map_id}",
            "name": name,
            "area": name,
            "encounters": encounters,
            "notes": [f"{len(encounters)} structured encounter entries from NextDex static data."],
            "confidence": "high",
            "source": [src],
        })
    return records


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


def normalize_trainers(
    data: dict[str, Any],
    species_by_numeric_id: dict[int, dict[str, Any]],
    moves_by_id: dict[int, dict[str, Any]],
    abilities_by_id: dict[int, dict[str, Any]],
    items_by_id: dict[int, dict[str, Any]],
    src: dict[str, Any],
) -> list[dict]:
    records: list[dict] = []
    map_names = data.get("mapsT", [])
    trainer_classes = data.get("tclassT", [])
    nature_table = data.get("natureT", [])
    for index, trainer in enumerate(data.get("trainers", []) or []):
        team = []
        levels = []
        for mon in trainer.get("party", []) or []:
            species = species_by_numeric_id.get(mon.get("spc"))
            moves = [moves_by_id.get(move_id, {}).get("name", f"Move #{move_id}") for move_id in mon.get("moves", []) if isinstance(move_id, int) and move_id > 0]
            ability = abilities_by_id.get(mon.get("abi"), {}).get("name") if isinstance(mon.get("abi"), int) else None
            item = items_by_id.get(mon.get("item"), {}).get("name") if isinstance(mon.get("item"), int) else None
            level = mon.get("lvl") or mon.get("level")
            if isinstance(level, int):
                levels.append(level)
            notes = []
            nature = table_lookup(nature_table, mon.get("nature"))
            if nature:
                notes.append(f"Nature: {nature}")
            team.append({
                "speciesName": species.get("name") if species else f"Species #{mon.get('spc')}",
                "speciesId": species.get("id") if species else None,
                "level": level if isinstance(level, int) else None,
                "item": item,
                "ability": ability,
                "subAbilities": [],
                "moves": moves,
                "confidence": "high" if species else "medium",
            })
        map_name = table_lookup(map_names, trainer.get("map"))
        record = {
            "id": slug(f"trainer-{index}-{trainer.get('name', 'unknown')}"),
            "name": trainer.get("name") or f"Trainer #{index}",
            "className": table_lookup(trainer_classes, trainer.get("tclass")),
            "location": map_name,
            "team": team,
            "notes": ["Structured trainer party from NextDex static data."],
            "confidence": "high",
            "source": [src],
        }
        if levels:
            record["levelRange"] = [min(levels), max(levels)]
        records.append(record)
    return records


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
            "tokens": " ".join([record["name"], record.get("location") or "", " ".join(record.get("notes", []))]),
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
    items: list[dict] = []

    data, source_path, source_confidence = load_nextdex_game_data(warnings)
    if data:
        structured_src = source("ER-nextdex-main.zip", "extract_sources.py:nextdex-static-game-data", source_confidence, source_path)
        moves, moves_by_id = normalize_moves(data, structured_src)
        abilities, subabilities, abilities_by_id = normalize_abilities(data, structured_src)
        items, items_by_id = normalize_items(data, structured_src)
        species, learnsets, evolutions = normalize_species(data, warnings, source_path or "unknown", source_confidence, moves_by_id, abilities_by_id)
        sprite_count = extract_sprites(species, warnings)
        species_by_numeric_id = {
            raw.get("id"): record
            for raw, record in zip([raw for raw in data.get("species", []) if raw.get("NAME") != "SPECIES_NONE" and raw.get("id", -1) > 0], species)
            if isinstance(raw.get("id"), int)
        }
        structured_locations = normalize_locations(data, species_by_numeric_id, structured_src)
        structured_trainers = normalize_trainers(data, species_by_numeric_id, moves_by_id, abilities_by_id, items_by_id, structured_src)
    else:
        warnings.append("ER-nextdex-main.zip is missing or did not contain out/gameDataVVanilla.json.")
        moves_by_id = {}
        abilities_by_id = {}
        items_by_id = {}
        structured_locations = []
        structured_trainers = []
        sprite_count = 0

    spreadsheet_locations = parse_earliest_locations(warnings)
    spreadsheet_trainers = parse_trainers(warnings)
    locations = structured_locations + spreadsheet_locations
    trainers = structured_trainers + spreadsheet_trainers
    wiki = parse_pdf_docs(warnings)
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
                    "items": len(items),
                    "sprites": sprite_count,
                },
                "warnings": [],
                "confidence": source_confidence,
            },
            {
                "sourceFile": EARLIEST_XLSX.name,
                "parser": "extract_sources.py:parse-earliest-locations",
                "recordCounts": {"locations": len(spreadsheet_locations)},
                "warnings": [],
                "confidence": "low",
            },
            {
                "sourceFile": TRAINERS_XLSX.name,
                "parser": "extract_sources.py:parse-trainer-locations",
                "recordCounts": {"trainers": len(spreadsheet_trainers)},
                "warnings": [],
                "confidence": "low",
            },
            {
                "sourceFile": "ER-nextdex-main.zip",
                "parser": "extract_sources.py:nextdex-static-locations-trainers",
                "recordCounts": {"locations": len(structured_locations), "trainers": len(structured_trainers)},
                "warnings": [],
                "confidence": source_confidence,
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
