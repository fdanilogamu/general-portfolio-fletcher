"""Resolve public routes to page sources for checks, never for publishing."""
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


def page_sources():
    routes = {}
    for directory in ROOT.glob('0-*'):
        if not directory.is_dir():
            continue
        for file in directory.rglob('*'):
            if file.suffix not in {'.html', '.md'}:
                continue
            block = re.match(r'^---\r?\n(.*?)^---', file.read_text(encoding='utf-8'), re.S | re.M)
            if not block or re.search(r'^published: false\s*$', block[1], re.M):
                continue
            route = re.search(r'^permalink: (\S+)\s*$', block[1], re.M)
            if route:
                assert route[1] not in routes, f'Duplicate public route: {route[1]}'
                routes[route[1]] = file
    return routes


def source_for(url):
    path = unquote(urlsplit(url).path)
    routes = page_sources()
    if path in routes:
        return routes[path]
    if path.endswith('/index.html') and path[:-10] in routes:
        return routes[path[:-10]]
    return ROOT / path.lstrip('/') / 'index.html' if path.endswith('/') else ROOT / path.lstrip('/')
