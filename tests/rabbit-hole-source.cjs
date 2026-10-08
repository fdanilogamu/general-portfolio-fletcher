// Source-level composition for regression checks, not a replacement for Jekyll.
const fs = require('node:fs');
function page(file) {
  const source = fs.readFileSync(file, 'utf8');
  const block = source.match(/^---\r?\n([\s\S]*?)^---(?:\r?\n|$)/m);
  if (!block || block.index !== 0) throw new Error(`${file}: missing front matter`);
  const keys = [...block[1].matchAll(/^([\w-]+):/gm)].map(match => match[1]);
  if (keys.length !== new Set(keys).size) throw new Error(`${file}: duplicate metadata keys`);
  const body = source.slice(block[0].length);
  if (/^\s*---\r?\n[\s\S]*?rabbit_hole:/.test(body)) throw new Error(`${file}: second front matter block`);
  return { source, body, metadata: block[1] };
}
function expand(html, variables = {}) {
  const locals = { ...variables };
  html = html.replace(/{% capture (\w+) %}([\s\S]*?){% endcapture %}/g, (_, name, body) => {
    locals[name] = body; return '';
  });
  return html.replace(/{{ '([^']+)' \| relative_url }}/g, '$1')
    .replace(/{% include ([\w.-]+)(?: controls=(\w+))? %}/g, (_, name, controls) =>
      expand(fs.readFileSync('_includes/' + name, 'utf8'), {controls: locals[controls] || ''}))
    .replace('{{ include.controls }}', locals.controls || '');
}
function compose(file) {
  const {body, metadata} = page(file);
  return expand(/layout: default/.test(metadata)
    ? fs.readFileSync('_layouts/default.html', 'utf8').replace('{{ content }}', body)
    : body);
}
module.exports = { page, expand, compose };
