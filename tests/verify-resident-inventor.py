"""Mandatory real-Jekyll-output checks: python tests/verify-resident-inventor.py --site _site."""
import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class Element:
    def __init__(self, tag, attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def has(self, name):
        return name in self.attrs.get('class', '').split()

    def all(self, predicate):
        result = []
        for child in self.children:
            if isinstance(child, Element):
                if predicate(child):
                    result.append(child)
                result.extend(child.all(predicate))
        return result

    def text(self):
        return ''.join(child.text() if isinstance(child, Element) else child for child in self.children)


class Document(HTMLParser):
    void = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Element('document')
        self.stack = [self.root]
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        node = Element(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in self.void:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def nodes(root, class_name):
    return root.all(lambda node: node.has(class_name))


def one(root, class_name):
    found = nodes(root, class_name)
    assert len(found) == 1, (class_name, len(found))
    return found[0]


def normalized(text):
    return ' '.join(text.split())


def equivalent(actual, expected):
    assert normalized(actual) == normalized(expected), (actual, expected)


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--site', type=Path, required=True)
parser.add_argument('--baseurl', default='')
args = parser.parse_args()
source = Path(__file__).resolve().parents[1]
site = args.site.resolve()
base = args.baseurl.rstrip('/')
baseline = json.loads((source / 'tests/fixtures/resident-inventor/original-records.json').read_text(encoding='utf-8'))
data = json.loads((source / '_data/resident_inventor.json').read_text(encoding='utf-8'))
# The only approved content adjustment is interface terminology for the ECH link.
expected = json.loads(json.dumps(baseline).replace('Explore its continuation in the ECH tab.', 'Explore its continuation in the ECH history.'))
assert data == expected, 'Nested history content or ordering changed'
histories = [item for item in data if not item.get('base')]
assert len(histories) == 9
assert sum(len(item['loops']) for item in histories) == 16
assert sum(len(loop['nodes']) for item in histories for loop in item['loops']) == 89
assert len(data[0]['nodes']) == 6

registry = json.loads((source / '_data/rabbit_hole.json').read_text(encoding='utf-8'))
approved = [entry for entry in registry if entry['status'] == 'approved']
assert len(approved) == 18
assert len({entry['id'] for entry in registry}) == len(registry)
assert len({entry['url'] for entry in registry}) == len(registry)
assert all(entry['status'] in {'approved', 'draft', 'retired'} for entry in registry)
history_entries = {entry['id']: entry for entry in approved if entry.get('category') == 'invention-history'}
assert set(history_entries) == {item['id'] for item in histories}


def file_for(url):
    path = unquote(urlsplit(url).path)
    if base:
        assert path == base or path.startswith(base + '/'), url
        path = path[len(base):]
    target = site / path.lstrip('/')
    return target / 'index.html' if path.endswith('/') else target


def read(url):
    target = file_for(url)
    assert target.is_file(), target
    html = target.read_text(encoding='utf-8')
    assert '{%' not in html and '{{' not in html and not html.startswith('---'), target
    return html, Document(html).root


def metadata(root, title, description=None, canonical=None, keywords=None):
    """Assert actual document metadata, including its absence where convention requires it."""
    titles = root.all(lambda item: item.tag == 'title')
    assert [item.text() for item in titles] == [title], ('titles', title, [item.text() for item in titles])
    for name, expected_value in [('description', description), ('keywords', keywords)]:
        values = [item.attrs.get('content') for item in root.all(
            lambda item: item.tag == 'meta' and item.attrs.get('name') == name)]
        assert values == ([] if expected_value is None else [expected_value]), (title, name, values)
    canonicals = [item.attrs.get('href') for item in root.all(
        lambda item: item.tag == 'link' and item.attrs.get('rel') == 'canonical')]
    assert canonicals == ([] if canonical is None else [canonical]), (title, 'canonical', canonicals)
    # The shared layout has no social metadata convention; do not silently introduce it.
    assert not root.all(lambda item: item.tag == 'meta' and (
        item.attrs.get('property', '').startswith('og:') or item.attrs.get('name', '').startswith('twitter:'))), title


def controls(root, entry_count=0, document_ids=False):
    assert len(root.all(lambda node: 'data-rabbit-hole' in node.attrs)) == entry_count + 1
    assert len(nodes(root, 'rabbit-hole-nav')) == 1
    scripts = root.all(lambda node: node.tag == 'script' and node.attrs.get('src', '').endswith('/static/js/rabbit-hole.js'))
    assert len(scripts) == 1
    manifests = root.all(lambda node: node.attrs.get('id') == 'rabbit-hole-destinations')
    assert len(manifests) == 1
    manifest = json.loads(manifests[0].text())
    expected_manifest = [{**entry, 'url': base + entry['url']} for entry in approved]
    assert manifest == expected_manifest, 'Output membership differs from explicit approved registry'
    assert not any('?' in entry['url'] for entry in manifest)
    if document_ids:
        ids = [node.attrs['id'] for node in root.all(lambda node: 'id' in node.attrs)]
        assert len(ids) == len(set(ids)), 'Duplicate document IDs'


def links(root, current_url):
    for node in root.all(lambda node: node.tag in {'a', 'script', 'link'}):
        raw = node.attrs.get('href', node.attrs.get('src', ''))
        url = urlsplit(raw)
        if url.scheme or url.netloc or not raw:
            continue
        if url.path and not url.path.startswith('/'):
            continue  # This suite validates site-relative history/navigation links.
        target_url = url.path or current_url
        target = file_for(target_url)
        assert target.is_file(), (current_url, raw, target)
        if url.fragment and target.suffix == '.html':
            target_root = root if target_url == current_url else Document(target.read_text(encoding='utf-8')).root
            assert target_root.all(lambda item: item.attrs.get('id') == unquote(url.fragment)), (current_url, raw)


kind_names = {'field': 'Field', 'collision': 'Collision', 'ding': 'Ding 💡', 'form': 'Form',
              'reality': 'Reality', 'dormant': 'Dormant', 'note': 'Record note'}
for history in histories:
    url = base + history_entries[history['id']]['url']
    html, root = read(url)
    controls(root, document_ids=True)
    article = one(root, 'ri-history-page')
    assert article.attrs['data-history-id'] == history['id']
    assert not article.all(lambda item: item.tag == 'script'), 'Article content must be HTML, not a script payload'
    equivalent(article.all(lambda item: item.tag == 'h1')[0].text(), history['title'])
    equivalent(one(article, 'ri-deck').text(), history['summary'])
    equivalent(one(article, 'ri-insight').text(), 'What this path showed: ' + history['insight'])
    metadata(root, history['title'] + ' — Invention History · Resident Inventor',
             history['summary'], 'https://thestuffihave.online' + url)
    loops = nodes(article, 'ri-loop')
    assert len(loops) == len(history['loops'])
    for i, (actual_loop, loop) in enumerate(zip(loops, history['loops'])):
        heading = one(actual_loop, 'ri-loop-label')
        assert heading.tag == 'h2' and heading.attrs['id'] == f"{history['id']}-loop-{i}"
        heading_label = loop['label'].replace(' · ', ' ') if loop['label'].startswith('Loop ') else loop['label']
        equivalent(heading.text(), heading_label)
        assert actual_loop.has('ri-loop--featured') == bool(loop.get('featured'))
        sequence = one(actual_loop, 'ri-sequence')
        assert sequence.tag == 'ol' and sequence.attrs.get('tabindex') == '0'
        assert sequence.attrs.get('role', 'list') == 'list', 'Scroll container must retain ordered-list semantics'
        actual_nodes = nodes(sequence, 'ri-node')
        assert len(actual_nodes) == len(loop['nodes'])
        for actual_node, node in zip(actual_nodes, loop['nodes']):
            assert actual_node.attrs['data-node-kind'] == node['kind']
            assert actual_node.has('ri-node--' + node['kind'])
            equivalent(one(actual_node, 'ri-node-kind').text(), node.get('stateLabel', kind_names[node['kind']]))
            heading = one(actual_node, 'ri-node-title')
            assert heading.tag == 'h3'
            equivalent(heading.text(), node['title'])
            paragraphs, quotes = nodes(actual_node, 'ri-node-text'), nodes(actual_node, 'ri-node-quote')
            assert len(paragraphs) == bool(node.get('text'))
            assert len(quotes) == bool(node.get('quote'))
            if paragraphs:
                equivalent(paragraphs[0].text(), node['text'])
            if quotes:
                equivalent(quotes[0].text(), '“' + node['quote'].removeprefix('“').removesuffix('”') + '”')
        captions = nodes(actual_loop, 'ri-loop-caption')
        assert len(captions) == bool(loop.get('caption'))
        if captions:
            equivalent(captions[0].text(), loop['caption'])
        branches = nodes(actual_loop, 'ri-branch')
        assert len(branches) == bool(loop.get('branch'))
        if branches:
            equivalent(one(branches[0], 'ri-node-text').text(), loop['branch']['text'])
            branch = one(branches[0], 'ri-branch-control')
            assert branch.tag == 'a' and branch.attrs['href'] == base + history_entries[loop['branch']['project']]['url']
            equivalent(branch.text(), loop['branch']['label'])
    assert len(nodes(article, 'ri-recursion')) == (0 if history.get('implicitReturns') is False else len(loops) - 1)
    if history['id'] == 'oei':
        assert len(one(article, 'ri-section-nav').all(lambda item: item.tag == 'a')) == 7
    assert len(one(article, 'ri-history-directory').all(lambda item: item.tag == 'a')) == 8
    assert any(item.attrs.get('href') == base + '/0-about/resident-inventor.html' for item in article.all(lambda item: item.tag == 'a'))
    assert root.all(lambda item: item.attrs.get('href') == base + '/resident-inventor.css')
    assert root.all(lambda item: item.attrs.get('src') == base + '/0-about/js/resident-inventor.js')
    links(article, url)

index_url = base + '/0-about/resident-inventor.html'
html, index = read(index_url)
metadata(index, 'Resident Inventor',
         'A model of invention derived from the origin histories of nine real projects by Fletcher Galeano.',
         'https://thestuffihave.online' + index_url)
controls(index, document_ids=True)
original = Document((source / 'tests/fixtures/resident-inventor/original-index.html.txt').read_text(encoding='utf-8')).root
for class_name in ['ri-hero', 'ri-articles', 'ri-ending', 'ri-section-heading']:
    equivalent(one(index, class_name).text(), one(original, class_name).text())
assert len(nodes(index, 'ri-article')) == 5
assert html.index('id="invention-paths"') < html.index('id="invention-model"') < html.index('class="ri-articles"')
assert len(one(index, 'ri-history-directory').all(lambda item: item.tag == 'a')) == 9
model = one(index, 'ri-field-environment')
renderer = (source / 'tests/fixtures/resident-inventor/original-renderer.js.txt').read_text(encoding='utf-8')
for fragment in ['Most of what is here may never need to leave.', 'something retained', 'something newly available',
                 'Event within the Field', 'A temporary active path becomes perceptible', 'Detected signal',
                 'Joins the Field again', 'Changed, redirected, dormant, expanded, or available for another collision.']:
    assert fragment in renderer and fragment in model.text(), fragment
assert [item.text() for item in one(model, 'ri-field-fragments').all(lambda item: item.tag == 'li')] == [
    'observation', 'old idea', 'question', 'experience', 'unfinished project', 'learned skill', 'constraint', 'strange connection']
for node in data[0]['nodes'][1:5]:
    assert node['title'] in model.text() and node['text'] in model.text()
equivalent(one(index, 'ri-insight').text(), 'What this path showed: ' + data[0]['insight'])
links(one(index, 'resident-inventor-page'), index_url)

for entry in approved:
    url = base + entry['url']
    assert re.fullmatch(r'/[A-Za-z0-9_./-]+', entry['url']) and '..' not in entry['url']
    _, root = read(url)
    controls(root)
_, entry_root = read(base + '/0-about/ideas.html')
controls(entry_root, 1)
assert not (site / '0-about/js/resident-inventor-data.js').exists()
navigation_html, navigation = read(base + '/site-navigation.html')
metadata(navigation, 'Site Navigation')
_, homepage = read(base + '/')
metadata(homepage, 'Home',
         'Fletcher Galeano is a Resident Inventor who retains, connects, shapes, and tests ideas across operations, knowledge systems, teaching, software, writing, and other forms.',
         'https://thestuffihave.online' + base + '/',
         'COO consultant, Director of Operations, Operations Leader, Systems Design, Fletcher Galeano, Documentation, Workflow Optimization, Colombia, Operational Entropy Index, OEI, Founder transition')

# Scan every generated HTML document, not only the pages that exposed the regression.
# Includes can mention histories in body content; only head metadata must be isolated.
history_files = {file_for(base + entry['url']).resolve() for entry in history_entries.values()}
record_titles = {item['title'] + ' — Invention History · Resident Inventor' for item in data}
record_summaries = {item['summary'] for item in data}
checked = 0
for target in site.rglob('*.html'):
    if target.resolve() in history_files:
        continue
    root = Document(target.read_text(encoding='utf-8')).root
    for item in root.all(lambda node: node.tag in {'title', 'meta', 'link'}):
        if item.tag == 'title':
            assert item.text() not in record_titles and 'Invention History · Resident Inventor' not in item.text(), target
        elif item.tag == 'meta':
            assert item.attrs.get('content') not in record_summaries | record_titles, (target, item.attrs)
        elif item.attrs.get('rel') == 'canonical':
            assert urlsplit(item.attrs.get('href', '')).path not in {base + entry['url'] for entry in history_entries.values()}, target
    checked += 1
print(f'PASS: homepage, Site Navigation, Resident Inventor index and nine histories resolve independent metadata; no history metadata leaked into {checked} unrelated HTML documents.')
assert 'Choose a tab' not in navigation_html
assert len(one(navigation, 'ri-history-directory').all(lambda item: item.tag == 'a')) == 9
print('PASS: exact nested parity; 9 static histories / 16 sections / 89 nodes; 6 model nodes; original introduction, diagram and five articles; metadata, links and headings; exactly 18 registry destinations and single shared controls on every exhibit.')
