"""Check source or Jekyll output: python porpoise/verify-integration.py [--site _site]."""
import argparse
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
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
root = options.site.resolve() if options.site else source
html = (root / 'porpoise/index.html').read_text(encoding='utf-8')
page = Links(html)
assert len(page.downloads) == 6
assert set(page.downloads) == {
    f'stances/{slug}.yaml' for slug in
    ('archivist', 'challenger', 'confidante', 'drafter', 'explorer', 'panic-room')
}
assert 'name="viewport"' in html and '@media (max-width:' in html
if options.site:
    assert (root / 'porpoise/index.html').read_bytes() == (source / 'porpoise/index.html').read_bytes()
    assert not (root / 'Porpoise AI').exists()

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
try:
    assert urlopen(base + '/porpoise/').read() == (root / 'porpoise/index.html').read_bytes()
    for link in page.links:
        target = urlsplit(urljoin('/porpoise/', link))
        if target.scheme or target.netloc:
            continue  # Google Fonts is an external dependency.
        if target.fragment:
            assert unquote(target.fragment) in page.ids, link
        if target.path != '/porpoise/':
            assert urlopen(base + target.path).read() == (root / unquote(target.path).lstrip('/')).read_bytes()
    for route in ('/0-about/porpoise-ai-case-study.html', '/0-about/resident-inventor.html',
                  '/0-about/how-i-collaborate-with-ai.html', '/0-about/lemonless-tms-case-study.html', '/index.html'):
        assert urlopen(base + route).status == 200, route
    case = (root / '0-about/porpoise-ai-case-study.html').read_text(encoding='utf-8')
    if not options.site:
        case = re.sub(r"\{\{\s*'([^']+)'\s*\|\s*relative_url\s*\}\}", r'\1', case)
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
