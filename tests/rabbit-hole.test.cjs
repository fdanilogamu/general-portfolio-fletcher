const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {page, compose} = require('./rabbit-hole-source.cjs');
const { pool, select, randomIndex } = require('../static/js/rabbit-hole.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync('0-about/js/resident-inventor-data.js', 'utf8'), context);
const projects = [
  '/0-about/lemonless-tms-case-study.html', '/0-about/porpoise-ai-case-study.html',
  '/0-resources/oei.html', '/0-things-i-do-for-fun/prison-planet.html',
  '/0-things-i-do-for-fun/spotify/spotify.html', '/porpoise/',
  '/0-things-i-do-for-fun/inglesrebelde.html', '/0-things-i-do-for-fun/ircalc.html'
];
const destinations = pool(projects, context.window.RESIDENT_INVENTOR_PATHS);
function assertSingleControls(html, entryCount) {
  assert.equal((html.match(/aria-label="Enter the Rabbit Hole"/g) || []).length, entryCount);
  assert.equal((html.match(/data-rabbit-hole hidden>Take me somewhere else/g) || []).length, 1);
  assert.equal((html.match(/id="rabbit-hole-destinations"/g) || []).length, 1);
  assert.equal((html.match(/<script src="[^"]*\/static\/js\/rabbit-hole\.js"/g) || []).length, 1);
}
test('template composition includes each control and shared script exactly once', () => {
  assertSingleControls(compose('0-about/ideas.html'), 1);
  for (const route of destinations) {
    const url = new URL(route, 'https://example.com');
    const file = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
    const html = compose('.' + file);
    assertSingleControls(html, 0);
    assert.doesNotMatch(html, /rabbit_hole:|\n---\n/);
  }
  for (const file of ['porpoise/statistics.html', 'show-and-tell/index.html']) assertSingleControls(compose(file), 0);
});
test('all eligible project front matter has exactly one eligibility key inside its first block', () => {
  for (const route of projects) {
    const file = '.' + (route.endsWith('/') ? route + 'index.html' : route);
    const {metadata, body} = page(file);
    assert.equal((metadata.match(/^rabbit_hole: true$/gm) || []).length, 1);
    assert.doesNotMatch(body, /rabbit_hole:/);
  }
});
test('language selector occupies the wrapping shared control row', () => {
  const html = compose('0-things-i-do-for-fun/inglesrebelde.html');
  const row = html.match(/<nav class="rabbit-hole-access"[\s\S]*?<\/nav>/)[0];
  assert.equal((row.match(/class="language-toggle"/g) || []).length, 1);
  const languageCSS = html.match(/\.language-toggle \{([\s\S]*?)\}/)[1];
  assert.doesNotMatch(languageCSS, /position:|top:|right:|z-index:/);
  assert.match(html, /\.rabbit-hole-access \{[^}]*flex-wrap: wrap/);
});
test('published projects and all nine histories are distinct and reachable', () => {
  assert.equal(destinations.length, 17);
  assert.equal(new Set(destinations).size, 17);
  destinations.forEach((route, index) => assert.equal(select(destinations, '/', null, () => index), route));
  for (const route of projects) {
    const path = route.endsWith('/') ? route + 'index.html' : route;
    assert.match(fs.readFileSync('.' + path, 'utf8'), /rabbit_hole: true/);
  }
  assert.ok(destinations.includes('/0-about/porpoise-ai-case-study.html'));
  assert.ok(destinations.includes('/0-about/resident-inventor.html?history=porpoise'));
  assert.ok(!destinations.some(route => /brand-guidelines|ideas\.html|show-and-tell|history=base/.test(route)));
});
test('pool rejects external routes, unpublished histories and duplicates', () => {
  assert.deepEqual(pool(['/a', '/a', 'https://example.com', '//example.com'], [{id:'draft',published:false}, {id:'base',base:true}]), ['/a']);
});
test('repeat avoidance and small pools', () => {
  assert.equal(select(['/a','/b','/c'], '/a', '/b', () => 0), '/c');
  assert.equal(select(['/a','/b'], '/a', '/b', () => 0), '/b');
  assert.equal(select(['/a'], '/a', null), null);
  assert.equal(select([], '/', null), null);
  assert.equal(select(['/a'], '/', '/a', () => 0), '/a');
});
test('crypto rejection sampling excludes modulo bias', () => {
  const values = [0xffffffff, 4];
  assert.equal(randomIndex(3, {getRandomValues(array) { array[0] = values.shift(); }}), 1);
  assert.equal(values.length, 0);
});
test('Jekyll output contains exactly the eligible project routes and shared controls', {skip: !fs.existsSync('_site/static/js/rabbit-hole.js')}, () => {
  const html = fs.readFileSync('_site/0-about/ideas.html', 'utf8');
  assertSingleControls(html, 1);
  const json = html.match(/id="rabbit-hole-destinations"[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(json);
  const rendered = JSON.parse(json[1]);
  assert.deepEqual(rendered.slice().sort(), projects.slice().sort());
  assert.match(html, /data-rabbit-hole hidden>Take me somewhere else/);
  for (const route of rendered) {
    const file = '_site' + (route.endsWith('/') ? route + 'index.html' : route);
    assert.ok(fs.existsSync(file), file);
    assertSingleControls(fs.readFileSync(file, 'utf8'), 0);
  }
});
test('unlock is initially hidden and persists across page loads and pageshow', () => {
  const storage = new Map();
  function load() {
    const button = {hidden:true};
    const events = {};
    const registrations = {};
    let navigations = 0;
    const win = {
      location:{href:'https://example.com/0-about/ideas.html',assign(route){this.destination=route; navigations++;}},
      localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},
      addEventListener:(name,callback)=>{events[name]=callback; registrations[name]=(registrations[name] || 0)+1;},
      document:{getElementById:()=>({textContent:JSON.stringify(projects)}),
        querySelector:()=>({src:'https://example.com/static/js/rabbit-hole.js'}),
        querySelectorAll:()=>[button],addEventListener:(name,callback)=>{events[name]=callback; registrations[name]=(registrations[name] || 0)+1;}},
      RESIDENT_INVENTOR_PATHS: context.window.RESIDENT_INVENTOR_PATHS
    };
    vm.runInNewContext(fs.readFileSync('static/js/rabbit-hole.js','utf8'), {window:win,URL,Uint32Array});
    assert.deepEqual(registrations, {click:1, pageshow:1, storage:1});
    return {win,button,events,get navigations(){return navigations;}};
  }
  const first = load();
  assert.equal(first.button.hidden,true);
  first.events.click({target:{closest:()=>first.button}});
  assert.equal(first.navigations, 1);
  assert.equal(first.button.hidden,false);
  assert.ok(destinations.includes(first.win.location.destination));
  assert.equal(load().button.hidden,false);
  first.button.hidden=true;
  first.events.pageshow();
  assert.equal(first.button.hidden,false);
});
