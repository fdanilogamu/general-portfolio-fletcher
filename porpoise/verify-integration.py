"""Check source or Jekyll output: python porpoise/verify-integration.py [--site _site]."""
import argparse
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
import sys
from threading import Thread
from urllib.parse import unquote, urljoin, urlsplit
from urllib.request import urlopen


class Links(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.ids, self.links, self.downloads = set(), [], []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs:
                self.links.append(attrs[key])
        if 'download' in attrs:
            self.downloads.append(attrs['href'])


args = argparse.ArgumentParser(description=__doc__)
args.add_argument('--site', type=Path)
options = args.parse_args()
source = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(source / 'tests'))
from site_sources import source_for
root = options.site.resolve() if options.site else source


def file_for(url):
    if not options.site:
        return source_for(url)
    path = unquote(urlsplit(url).path)
    return root / path.lstrip('/') / 'index.html' if path.endswith('/') else root / path.lstrip('/')


def read_page(url):
    html = file_for(url).read_text(encoding='utf-8')
    if not options.site:
        html = re.sub(r"\{\{\s*'([^']+)'\s*\|\s*relative_url\s*\}\}", r'\1', html)
    return html


html = read_page('/porpoise/')
page = Links(html)
assert len(page.downloads) == 6
assert set(page.downloads) == {
    f'stances/{slug}.yaml' for slug in
    ('archivist', 'challenger', 'confidante', 'drafter', 'explorer', 'panic-room')
}
assert 'name="viewport"' in html and '@media (max-width:' in html
if options.site:
    # Jekyll now expands shared navigation. Validate the unchanged product content,
    # assets and downloads below rather than comparing templated source to output.
    assert '{%' not in html and '{{' not in html
    assert len(re.findall(r'id="rabbit-hole-destinations"', html)) == 1
    assert len(re.findall(r'src="[^"]*/static/js/rabbit-hole.js"', html)) == 1
    assert not (root / 'Porpoise AI').exists()
    assert not (root / 'porpoise-api').exists()

assert 'statistics.html' not in page.links
assert html.index('class="download-disclosure"') < html.index('class="stance-grid"')
assert "we don't use visitor identifiers for this tally" in html
stats = Links(read_page('/porpoise/statistics.html'))
assert 'stats-status' in stats.ids and 'stats-total' in stats.ids
for slug in ('archivist', 'challenger', 'confidante', 'drafter', 'explorer', 'panic-room'):
    assert f'count-{slug}' in stats.ids and f'bar-{slug}' in stats.ids

class SourceHandler(SimpleHTTPRequestHandler):
    """Source checks use explicit page routes; built-output checks use actual files."""
    def translate_path(self, path):
        return super().translate_path(path) if options.site else str(source_for(path))


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SourceHandler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
try:
    assert urlopen(base + '/porpoise/').read() == file_for('/porpoise/').read_bytes()
    assert urlopen(base + '/porpoise/porpoise.pdf').read() == (source / 'porpoise/porpoise.pdf').read_bytes()
    assert urlopen(base + '/porpoise/statistics.html').read() == file_for('/porpoise/statistics.html').read_bytes()
    for asset in ('api-config.js', 'downloads.js', 'statistics.js'):
        assert urlopen(base + '/porpoise/' + asset).read() == (root / 'porpoise' / asset).read_bytes()
    for link in page.links:
        target = urlsplit(urljoin('/porpoise/', link))
        if target.scheme or target.netloc:
            continue  # Google Fonts is an external dependency.
        if target.fragment and target.path == '/porpoise/':
            assert unquote(target.fragment) in page.ids, link
        if target.path != '/porpoise/':
            file = file_for(target.path)
            if file.is_dir():
                file = file / 'index.html'
            assert urlopen(base + target.path).read() == file.read_bytes()
    for route in ('/0-about/porpoise-ai-case-study.html', '/0-about/resident-inventor.html',
                  '/0-about/how-i-collaborate-with-ai.html', '/0-about/lemonless-tms-case-study.html', '/index.html'):
        assert urlopen(base + route).status == 200, route
    case = read_page('/0-about/porpoise-ai-case-study.html')
    case_links = Links(case)
    assert '/porpoise/' in case_links.links
    for link in case_links.links:
        target = urlsplit(link)
        if not target.scheme and not target.netloc:
            assert urlopen(base + target.path).status == 200, link
    print('PASS: product route, six downloads, local assets, anchors, case study links, and existing routes.')
finally:
    server.shutdown()
    server.server_close()
