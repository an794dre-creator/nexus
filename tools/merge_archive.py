"""Junta duas versões de um arquivo do histórico (web/data/archive/AAAA-MM.json) sem perder itens.

Uso (em caso de conflito no git):
    git show origin/main:web/data/archive/2026-11.json > a.json
    git show stash@{0}:web/data/archive/2026-11.json > b.json
    py tools/merge_archive.py a.json b.json web/data/archive/2026-11.json
"""
import json
import sys
from pathlib import Path

*sources, dest = sys.argv[1:]
items = {}
for s in sources:
    for it in json.loads(Path(s).read_text("utf-8-sig")):
        items.setdefault(it["id"], it)
out = sorted(items.values(), key=lambda x: x["published"])
Path(dest).write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), "utf-8")
print(f"{len(out)} itens em {dest}")
