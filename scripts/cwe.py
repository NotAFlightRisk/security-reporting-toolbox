#!/usr/bin/env python3
"""Turns MITRE's CWE XML (downloaded unless you pass --xml) into the explorer's lean JSON."""

import argparse
import io
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

SOURCE = "https://cwe.mitre.org/data/xml/cwec_latest.xml.zip"
OUT = Path(__file__).resolve().parent.parent / "src/lib/data/cwe.json"
NS = "{http://cwe.mitre.org/cwe-7}"
HTML = "{http://www.w3.org/1999/xhtml}"
RESEARCH = "1000"

VIEWS = {
    "1435": ("Top 25 (2025)", "pillar"),
    "1344": ("OWASP Top 10 (2021)", "categories"),
    "1003": ("NVD simplified (1003)", "children"),
    "699": ("Software development", "categories"),
    "1194": ("Hardware design", "categories"),
}

BLOCKS = {"p", "div", "blockquote", "pre", "h1", "h2", "h3", "h4", "tr"}
LISTS = {"ul", "ol"}


def tidy(text):
    text = re.sub(r"\s*\[REF-\d+\]", "", text or "")
    return re.sub(r"\s+", " ", text).strip()


def local(el):
    return el.tag.split("}")[-1]


def flatten(el):
    """Paragraphs as strings and lists as lists of strings, from CWE's mix of text and xhtml."""
    if el is None:
        return []
    blocks, current = [], []

    def flush():
        line = tidy(" ".join(current))
        if line:
            blocks.append(line)
        current.clear()

    def walk(node):
        current.append(node.text or "")
        for child in node:
            tag = local(child)
            if tag in LISTS:
                flush()
                items = [tidy(" ".join(li.itertext())) for li in child if local(li) == "li"]
                if any(items):
                    blocks.append([item for item in items if item])
            elif tag == "table":
                flush()
                rows = [" - ".join(tidy(c) for c in tr.itertext() if tidy(c)) for tr in child.iter(f"{HTML}tr")]
                if any(rows):
                    blocks.append([row for row in rows if row])
            elif tag in BLOCKS:
                flush()
                walk(child)
                flush()
            elif tag == "br":
                flush()
            else:
                current.append(" ".join(child.itertext()))
            current.append(child.tail or "")

    walk(el)
    flush()
    return blocks


def text(el, path):
    found = el.find(path)
    return tidy(" ".join(found.itertext())) if found is not None else ""


def texts(el, path):
    return [tidy(" ".join(found.itertext())) for found in el.findall(path)]


def mapping(el):
    notes = el.find(f"{NS}Mapping_Notes")
    if notes is None:
        return None
    return {
        "usage": text(notes, f"{NS}Usage"),
        "rationale": text(notes, f"{NS}Rationale"),
        "comments": text(notes, f"{NS}Comments"),
        "reasons": [r.get("Type") for r in notes.iter(f"{NS}Reason")],
        "suggestions": [
            {"id": int(s.get("CWE_ID")), "comment": tidy(s.get("Comment"))}
            for s in notes.iter(f"{NS}Suggestion")
        ],
    }


def platforms(el):
    found = []
    for item in el.iterfind(f"{NS}Applicable_Platforms/*"):
        name = item.get("Name") or item.get("Class")
        found.append({"type": local(item), "name": name, "prevalence": item.get("Prevalence")})
    return found


def weakness(el):
    related = [
        {"nature": r.get("Nature"), "id": int(r.get("CWE_ID")), "view": r.get("View_ID")}
        for r in el.iterfind(f"{NS}Related_Weaknesses/{NS}Related_Weakness")
    ]
    return {
        "id": int(el.get("ID")),
        "name": el.get("Name"),
        "abstraction": el.get("Abstraction"),
        "status": el.get("Status"),
        "description": text(el, f"{NS}Description"),
        "extended": flatten(el.find(f"{NS}Extended_Description")),
        "terms": [
            {"term": text(t, f"{NS}Term"), "description": text(t, f"{NS}Description")}
            for t in el.iterfind(f"{NS}Alternate_Terms/{NS}Alternate_Term")
        ],
        "likelihood": text(el, f"{NS}Likelihood_Of_Exploit"),
        "consequences": [
            {
                "scopes": texts(c, f"{NS}Scope"),
                "impacts": texts(c, f"{NS}Impact"),
                "note": text(c, f"{NS}Note"),
            }
            for c in el.iterfind(f"{NS}Common_Consequences/{NS}Consequence")
        ],
        "introduced": [
            {"phase": text(i, f"{NS}Phase"), "note": text(i, f"{NS}Note")}
            for i in el.iterfind(f"{NS}Modes_Of_Introduction/{NS}Introduction")
        ],
        "platforms": platforms(el),
        "mitigations": [
            {
                "phases": texts(m, f"{NS}Phase"),
                "strategy": text(m, f"{NS}Strategy"),
                "description": flatten(m.find(f"{NS}Description")),
                "effectiveness": text(m, f"{NS}Effectiveness"),
            }
            for m in el.iterfind(f"{NS}Potential_Mitigations/{NS}Mitigation")
        ],
        "related": [r for r in related if r["view"] == RESEARCH],
        "examples": [
            {"ref": text(o, f"{NS}Reference"), "description": text(o, f"{NS}Description")}
            for o in el.iterfind(f"{NS}Observed_Examples/{NS}Observed_Example")
        ],
        "mapping": mapping(el),
        "_related": related,
    }


def category(el):
    members = []
    for m in el.iterfind(f"{NS}Relationships/{NS}Has_Member"):
        member = int(m.get("CWE_ID"))
        if member not in members:
            members.append(member)
    return {
        "id": int(el.get("ID")),
        "name": el.get("Name"),
        "status": el.get("Status"),
        "summary": flatten(el.find(f"{NS}Summary")),
        "members": members,
        "mapping": mapping(el),
        "_members": [(int(m.get("CWE_ID")), m.get("View_ID")) for m in el.iterfind(f"{NS}Relationships/{NS}Has_Member")],
    }


def pillar_of(entry, weaknesses, seen=()):
    """Walks primary ChildOf links in the research view up to the pillar."""
    if entry["abstraction"] == "Pillar" or entry["id"] in seen:
        return entry
    parents = [r for r in entry["_related"] if r["nature"] == "ChildOf" and r["view"] == RESEARCH]
    if not parents or parents[0]["id"] not in weaknesses:
        return entry
    return pillar_of(weaknesses[parents[0]["id"]], weaknesses, (*seen, entry["id"]))


def build_view(el, weaknesses, categories):
    view_id = el.get("ID")
    label, layout = VIEWS[view_id]
    members = [int(m.get("CWE_ID")) for m in el.iterfind(f"{NS}Members/{NS}Has_Member")]
    columns = []
    if layout == "categories":
        for cat_id in members:
            cat = categories[cat_id]
            name = re.sub(r"^OWASP Top Ten 2021 Category ", "", cat["name"])
            cells = [m for m, v in cat["_members"] if v == view_id]
            columns.append({"id": cat_id, "name": name, "members": cells})
    elif layout == "children":
        for top in members:
            kids = [
                w["id"]
                for w in weaknesses.values()
                if any(r["nature"] == "ChildOf" and r["id"] == top and r["view"] == view_id for r in w["_related"])
            ]
            columns.append({"id": top, "name": weaknesses[top]["name"], "members": kids})
    else:
        for member in members:
            pillar = pillar_of(weaknesses[member], weaknesses)
            column = next((c for c in columns if c["id"] == pillar["id"]), None)
            if column is None:
                column = {"id": pillar["id"], "name": pillar["name"], "members": []}
                columns.append(column)
            column["members"].append(member)
    return {
        "id": int(view_id),
        "label": label,
        "name": el.get("Name"),
        "objective": text(el, f"{NS}Objective"),
        "columns": columns,
    }


def convert(root):
    weaknesses = {w["id"]: w for w in map(weakness, root.iterfind(f"{NS}Weaknesses/{NS}Weakness"))}
    categories = {c["id"]: c for c in map(category, root.iterfind(f"{NS}Categories/{NS}Category"))}
    view_els = list(root.iterfind(f"{NS}Views/{NS}View"))
    views = [build_view(el, weaknesses, categories) for el in view_els if el.get("ID") in VIEWS]
    views.sort(key=lambda v: list(VIEWS).index(str(v["id"])))

    for w in weaknesses.values():
        w["children"] = sorted(
            other["id"]
            for other in weaknesses.values()
            if any(r["nature"] == "ChildOf" and r["id"] == w["id"] for r in other["related"])
        )
    for entry in (*weaknesses.values(), *categories.values()):
        entry.pop("_related", None)
        entry.pop("_members", None)

    return {
        "version": root.get("Version"),
        "date": root.get("Date"),
        "weaknesses": sorted(weaknesses.values(), key=lambda w: w["id"]),
        "categories": sorted(categories.values(), key=lambda c: c["id"]),
        "views": views,
        "viewNames": {el.get("ID"): el.get("Name") for el in view_els},
    }


def download():
    with urllib.request.urlopen(SOURCE, timeout=120) as response:
        archive = zipfile.ZipFile(io.BytesIO(response.read()))
    name = next(n for n in archive.namelist() if n.endswith(".xml"))
    return archive.read(name)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--xml", type=Path, help="a local cwec XML file instead of downloading")
    parser.add_argument("--out", type=Path, default=OUT)
    args = parser.parse_args()

    raw = args.xml.read_bytes() if args.xml else download()
    data = convert(ET.fromstring(raw))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"CWE {data['version']} ({data['date']}): {len(data['weaknesses'])} weaknesses, "
          f"{len(data['categories'])} categories -> {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
