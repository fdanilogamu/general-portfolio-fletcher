const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {page, compose} = require('./rabbit-hole-source.cjs');
const { pool, select, randomIndex, normalize, cleanState, selectCycle } = require('../static/js/rabbit-hole.js');
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

test('session cycles select every destination once before resetting and avoid boundary repeats', () => {
  let state = null;
  let current = '/';
  let previous = null;
  for (let cycle = 0; cycle < 3; cycle++) {
    const selected = [];
    for (let index = 0; index < destinations.length; index++) {
      const result = selectCycle(destinations, current, state, () => 0);
      assert.ok(result.destination);
      assert.notEqual(result.destination, previous);
      assert.notEqual(result.destination, current);
      assert.ok(!selected.includes(result.destination));
      selected.push(result.destination);
      state = {visited: result.state.pending.visited, previous: result.destination};
      previous = current = result.destination;
    }
    assert.deepEqual(selected.slice().sort(), destinations.slice().sort());
  }
});

test('session selection gives each remaining destination one equal index', () => {
  const state = {visited: destinations.slice(0, 5), previous: destinations[4]};
  const remaining = destinations.slice(5);
  remaining.forEach((route, index) => {
    assert.equal(selectCycle(destinations, '/', state, length => {
      assert.equal(length, remaining.length);
      return index;
    }).destination, route);
  });
});

test('normalization preserves distinct history identities and cleans deployment changes', () => {
  assert.equal(normalize('/porpoise/index.html#demo'), '/porpoise/');
  assert.equal(normalize('/a/../porpoise/?b=2&a=1#x'), '/porpoise/?a=1&b=2');
  assert.equal(normalize('/%70orpoise/'), '/porpoise/');
  assert.equal(normalize('//external.example/a'), null);
  const state = cleanState(destinations, {visited: ['/gone','/porpoise/index.html', '/porpoise/',
    '/0-about/resident-inventor.html?history=porpoise'], previous:'/gone', pending:{destination:'/gone'}});
  assert.deepEqual(state.visited, ['/porpoise/', '/0-about/resident-inventor.html?history=porpoise']);
  assert.equal(state.previous,null);
  assert.equal(state.pending,null);
  assert.deepEqual(cleanState(destinations,{visited:'bad'}).visited,[]);
});

test('current-page exclusion does not repeat visited routes or discard an unfinished cycle', () => {
  assert.equal(selectCycle(['/a','/b'], '/a', {visited:['/b']}).destination,null);
  assert.equal(selectCycle(['/a','/b'], '/b', {visited:['/b']},()=>0).destination,'/a');
  assert.equal(selectCycle([], '/', null).destination,null);
  assert.equal(selectCycle(['/a'], '/a', null).destination,null);
  assert.equal(selectCycle(['/a'], '/', {visited:['/a'],previous:'/a'},()=>0).destination,'/a');
});

function sessionHarness(local = new Map(), storage = new Map(), options = {}) {
  const read = map => key => map.get(key) || null;
  const events = {};
  const button = {hidden:true};
  const navigations = [];
  const win = {
    location: {href: 'https://example.com' + (options.route || '/0-about/ideas.html'), assign(route) {
      if (options.fail) throw new Error('Navigation rejected');
      navigations.push(route);
    }},
    localStorage: {getItem:read(local), setItem:(key,value)=>local.set(key,value)},
    sessionStorage: {getItem:read(storage), setItem:(key,value)=>storage.set(key,value)},
    addEventListener:(name,callback)=>{events[name]=callback;},
    document: {getElementById:()=>({textContent:JSON.stringify(projects)}),
      querySelector:()=>({src:'https://example.com/static/js/rabbit-hole.js'}),
      querySelectorAll:()=>[button], addEventListener:(name,callback)=>{events[name]=callback;}},
    RESIDENT_INVENTOR_PATHS:context.window.RESIDENT_INVENTOR_PATHS
  };
  if (options.blocked) win.sessionStorage = {getItem(){throw new Error('Blocked');},setItem(){throw new Error('Blocked');}};
  vm.runInNewContext(fs.readFileSync('static/js/rabbit-hole.js','utf8'), {window:win,URL,Uint32Array});
  return {win,events,button,navigations,click(control) {events.click({target:{closest:()=>control}});}};
}

test('both controls share session progress across arrivals and refreshes, independently of unlock', () => {
  const local = new Map();
  const storage = new Map();
  let page = sessionHarness(local, storage);
  assert.equal(page.button.hidden,true);
  for (let index = 0; index < 17; index++) {
    page.click(index%2 ? page.button : {entry:true});
    const destination = page.navigations[0];
    assert.ok(destination);
    // Progress is reserved until the destination actually loads.
    const pending = JSON.parse(storage.get('rabbit-hole-session'));
    assert.equal(pending.visited.length,index);
    page = sessionHarness(local, storage, {route:destination});
    assert.equal(JSON.parse(storage.get('rabbit-hole-session')).visited.length,index+1);
    page = sessionHarness(local, storage, {route:destination}); // Refresh.
    assert.equal(JSON.parse(storage.get('rabbit-hole-session')).visited.length,index+1);
    assert.equal(page.button.hidden,false);
  }
  assert.equal(new Set(JSON.parse(storage.get('rabbit-hole-session')).visited).size,17);
  page.click(page.button);
  const last = JSON.parse(storage.get('rabbit-hole-session')).previous;
  assert.notEqual(page.navigations[0],last);
  page = sessionHarness(local, storage, {route:page.navigations[0]});
  assert.equal(JSON.parse(storage.get('rabbit-hole-session')).visited.length,1);
  const freshSession = new Map();
  page = sessionHarness(local,freshSession);
  assert.equal(page.button.hidden,false);
  assert.equal(JSON.parse(freshSession.get('rabbit-hole-session')).visited.length,0);
  assert.equal(local.has('rabbit-hole-session'),false);
});

test('rapid clicks reserve only one destination and failed navigation does not commit visits', () => {
  const storage = new Map();
  const page = sessionHarness(new Map(),storage);
  page.click({entry:true});
  page.click(page.button);
  page.win.RabbitHole.navigate();
  assert.equal(page.navigations.length,1);
  assert.equal(JSON.parse(storage.get('rabbit-hole-session')).visited.length,0);
  sessionHarness(new Map(),storage); // Did not reach reserved destination.
  assert.equal(JSON.parse(storage.get('rabbit-hole-session')).pending,null);
  const failed = sessionHarness(new Map(),storage,{fail:true});
  failed.click(failed.button);
  assert.equal(JSON.parse(storage.get('rabbit-hole-session')).visited.length,0);
  assert.equal(JSON.parse(storage.get('rabbit-hole-session')).pending,null);
  assert.doesNotThrow(()=>failed.click(failed.button));
});

test('blocked and corrupt session storage degrade gracefully', () => {
  const blocked = sessionHarness(new Map(),new Map(),{blocked:true});
  assert.doesNotThrow(()=>blocked.click(blocked.button));
  assert.equal(blocked.navigations.length,1);
  const storage = new Map([['rabbit-hole-session','{broken json']]);
  const page = sessionHarness(new Map(),storage);
  assert.deepEqual(JSON.parse(storage.get('rabbit-hole-session')).visited,[]);
  page.click(page.button);
  assert.equal(page.navigations.length,1);
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
test('playlist include cannot emit metadata or generate a competing page', () => {
  assert.match(page('0-things-i-do-for-fun/spotify/spotify.md').metadata, /published: false/);
  const source = page('0-things-i-do-for-fun/spotify/spotify.html').body;
  assert.match(source, /playlist_source \| split: '---' \| last/);
  assert.match(source, /playlist_body \| markdownify/);
});
test('calculator keeps shared controls above its content in document flow', () => {
  const html = compose('0-things-i-do-for-fun/ircalc.html');
  const bodyCSS = html.match(/body \{([\s\S]*?)\}/)[1];
  assert.match(bodyCSS, /flex-direction: column/);
  assert.match(html, /\.rabbit-hole-access \{[^}]*width: 100%/);
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
    const output = fs.readFileSync(file, 'utf8');
    assertSingleControls(output, 0);
    assert.doesNotMatch(output, /rabbit_hole:|layout: default|published: false/);
  }
  assertSingleControls(fs.readFileSync('_site/0-about/resident-inventor.html', 'utf8'), 0);
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
