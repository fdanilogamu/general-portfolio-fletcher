const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {page, compose, pageSources, sourceFor} = require('./rabbit-hole-source.cjs');
const {pool, normalize, identify, cleanState, selectCycle, randomIndex} = require('../static/js/rabbit-hole.js');
const registry = require('../_data/rabbit_hole.json');
const destinations = pool(registry);
const ids = destinations.map(entry => entry.id);
const excluded = ['/0-resources/oei.html','/0-about/porpoise-ai-case-study.html',
  '/0-things-i-do-for-fun/ircalc.html','/0-things-i-do-for-fun/spotify/spotify.html',
  '/0-about/mindsystem.html','/0-about/resident-inventor.html','/site-navigation.html',
  '/resident-inventor/brand-guidelines/','/release-notes/','/porpoise/statistics.html'];
const expectedIds = ['lemonade-economy','oei','dream-machine','anchorpoint','way-they-see-it','ech',
  'porpoise','cyoa','inventors-lab','lemonless-tms-case-study','prison-planet','porpoise-library',
  'ingles-rebelde','ai-collaboration','technical-writing-samples','job-search-timeline',
  'job-search-lessons','show-and-tell-nook'];
const fileFor = sourceFor;
function assertSingleControls(html, entryCount = 0) {
  assert.equal((html.match(/aria-label="Enter the Rabbit Hole"/g) || []).length, entryCount);
  assert.equal((html.match(/data-rabbit-hole hidden>Take me somewhere else/g) || []).length, 1);
  assert.equal((html.match(/id="rabbit-hole-destinations"/g) || []).length, 1);
  assert.equal((html.match(/<script src="[^"]*\/static\/js\/rabbit-hole\.js"/g) || []).length, 1);
}

test('registry exactly matches approved membership; valid unique IDs, titles, canonical paths and statuses', () => {
  assert.deepEqual(ids.slice().sort(),expectedIds.slice().sort());
  assert.equal(destinations.length,18);
  assert.equal(new Set(registry.map(entry=>entry.id)).size,registry.length);
  assert.equal(new Set(registry.map(entry=>normalize(entry.url))).size,registry.length);
  for (const entry of registry) {
    assert.match(entry.id,/^[a-z0-9-]+$/);
    assert.ok(entry.title.trim());
    assert.ok(['approved','draft','retired'].includes(entry.status));
    assert.equal(normalize(entry.url),entry.url);
    assert.doesNotMatch(entry.url,/[?#]|\.\./);
    assert.ok(fs.existsSync(fileFor(entry.url)),entry.url);
  }
  assert.equal(destinations.filter(entry=>entry.category==='invention-history').length,9);
  assert.ok(!destinations.some(entry=>excluded.includes(entry.url)));
});

test('registry is the only membership source; unpublished/unapproved/external/duplicate entries rejected', () => {
  assert.deepEqual(pool([{id:'a',url:'/a',status:'draft'},{id:'b',url:'//evil',status:'approved'}]),[]);
  assert.equal(pool([{id:'a',url:'/a',status:'approved'},{id:'b',url:'/a',status:'approved'}]).length,1);
  const include=fs.readFileSync('_includes/rabbit-hole.html','utf8');
  assert.match(include,/site.data.rabbit_hole/);
  assert.doesNotMatch(include,/site.pages|RESIDENT_INVENTOR|resident-inventor-data/);
  assert.doesNotMatch(fs.readFileSync('static/js/rabbit-hole.js','utf8'),/RESIDENT_INVENTOR_PATHS/);
  for (const url of [...registry.map(entry=>entry.url),...excluded].filter(url=>fs.existsSync(fileFor(url))))
    assert.doesNotMatch(fs.readFileSync(fileFor(url),'utf8'),/^rabbit_hole:/m);
});

test('three complete cycles contain every ID once and avoid boundary repeats', () => {
  let state=null,current=null;
  for(let cycle=0;cycle<3;cycle++){
    const selected=[];
    for(let i=0;i<ids.length;i++){
      const result=selectCycle(destinations,current,state,()=>0);
      assert.ok(result.destination);assert.notEqual(result.destination,current);
      assert.ok(!selected.includes(result.destination));selected.push(result.destination);
      state={visited:result.state.pending.visited,previous:result.destination};
      current=result.destination;
    }
    assert.deepEqual(selected.slice().sort(),ids.slice().sort());
  }
});

test('each eligible unvisited candidate gets exactly one unbiased index', () => {
  const remaining=destinations.slice(5);
  remaining.forEach((entry,index)=>assert.equal(selectCycle(destinations,null,
    {visited:ids.slice(0,5),previous:ids[4]},length=>{assert.equal(length,remaining.length);return index;}).destination,entry.id));
});

test('last unvisited current page restarts cycle without recording a manual visit', () => {
  const tiny=pool([{id:'a',url:'/a',status:'approved'},{id:'b',url:'/b',status:'approved'},{id:'c',url:'/c',status:'approved'}]);
  const result=selectCycle(tiny,'a',{visited:['b','c'],previous:'c'},()=>0);
  assert.equal(result.destination,'b');
  assert.deepEqual(result.state.visited,['b','c']);
  assert.deepEqual(result.state.pending.visited,['b']);
  assert.equal(selectCycle([],null,null).destination,null);
  assert.equal(selectCycle(tiny.slice(0,1),'a',null).destination,null);
  assert.equal(selectCycle(tiny.slice(0,1),null,null,()=>0).destination,'a');
});

test('legacy URL state migrates to IDs, deduplicates and prunes removed/unapproved exhibits', () => {
  const old='/0-about/resident-inventor.html?history=porpoise';
  const state=cleanState(destinations,{visited:[old,'porpoise',destinations[6].url,'/porpoise/index.html',...excluded],
    previous:'/0-about/resident-inventor.html?history=oei',pending:{destination:old,visited:[old]}});
  assert.deepEqual(state.visited,['porpoise','porpoise-library']);
  assert.equal(state.previous,'oei');assert.equal(state.pending.destination,'porpoise');
  assert.deepEqual(state.pending.visited,['porpoise']);assert.equal(state.version,2);
  assert.equal(cleanState(destinations,{pending:{destination:'/gone'}}).pending,null);
  assert.deepEqual(cleanState(destinations,{visited:'broken'}).visited,[]);
  const prefixed=destinations.map(entry=>({...entry,url:'/portfolio'+entry.url}));
  assert.equal(identify(prefixed,old,'/portfolio'),'porpoise');
  assert.equal(identify(prefixed,'/porpoise/index.html','/portfolio'),'porpoise-library');
});

test('normalization handles aliases, fragments and query order but rejects external paths', () => {
  assert.equal(normalize('/porpoise/index.html#demo'),'/porpoise/');
  assert.equal(normalize('/%70orpoise/'),'/porpoise/');
  assert.equal(normalize('/a/../porpoise/?b=2&a=1'),'/porpoise/?a=1&b=2');
  assert.equal(normalize('//evil/a'),null);
});

function harness(local=new Map(),storage=new Map(),options={}){
  const events={},button={hidden:true},navigations=[];
  const get=map=>key=>map.get(key)||null;
  const win={location:{href:'https://example.com'+(options.route||'/0-about/ideas.html'),assign(route){
    if(options.fail)throw Error('Rejected');navigations.push(route);
  }},localStorage:{getItem:get(local),setItem:(k,v)=>local.set(k,v)},
  sessionStorage:{getItem:get(storage),setItem:(k,v)=>storage.set(k,v)},
  addEventListener:(name,fn)=>{events[name]=fn;},
  document:{getElementById:id=>id==='rabbit-hole-destinations'?{textContent:JSON.stringify(destinations)}:
    (options.redirecting&&id==='ri-history-routes'?{}:null),
    querySelector:()=>({src:'https://example.com/static/js/rabbit-hole.js'}),
    querySelectorAll:()=>[button],addEventListener:(name,fn)=>{events[name]=fn;}}};
  if(options.blocked)win.sessionStorage={getItem(){throw Error('Blocked');},setItem(){throw Error('Blocked');}};
  vm.runInNewContext(fs.readFileSync('static/js/rabbit-hole.js','utf8'),{window:win,URL,Uint32Array});
  return {win,events,button,navigations,click(){events.click({target:{closest:()=>button}});}};
}

test('selection reservations commit only on arrival; cycles and unlock survive refresh', () => {
  const local=new Map(),storage=new Map();let loaded=harness(local,storage);
  assert.equal(loaded.button.hidden,true);
  for(let i=0;i<18;i++){
    loaded.click();assert.equal(JSON.parse(storage.get('rabbit-hole-session')).visited.length,i);
    loaded=harness(local,storage,{route:loaded.navigations[0]});
    assert.equal(JSON.parse(storage.get('rabbit-hole-session')).visited.length,i+1);
    loaded=harness(local,storage,{route:new URL(loaded.win.location.href).pathname});
    assert.equal(JSON.parse(storage.get('rabbit-hole-session')).visited.length,i+1);
    assert.equal(loaded.button.hidden,false);
  }
  const previous=JSON.parse(storage.get('rabbit-hole-session')).previous;
  loaded.click();assert.notEqual(identify(destinations,loaded.navigations[0]),previous);
  loaded=harness(local,storage,{route:loaded.navigations[0]});
  assert.equal(JSON.parse(storage.get('rabbit-hole-session')).visited.length,1);
  const fresh=new Map();assert.equal(harness(local,fresh).button.hidden,false);
  assert.deepEqual(JSON.parse(fresh.get('rabbit-hole-session')).visited,[]);
});

test('manual arrivals do not change tour progress; pageshow restores controls', () => {
  const local=new Map([['rabbit-hole-unlocked','true']]);
  const storage=new Map([['rabbit-hole-session',JSON.stringify({visited:['oei'],previous:'oei'})]]);
  const loaded=harness(local,storage,{route:'/porpoise/'});
  assert.deepEqual(JSON.parse(storage.get('rabbit-hole-session')).visited,['oei']);
  loaded.button.hidden=true;loaded.events.pageshow();assert.equal(loaded.button.hidden,false);
  assert.deepEqual(JSON.parse(storage.get('rabbit-hole-session')).visited,['oei']);
});

test('legacy pending history reservation survives redirect and commits at canonical arrival', () => {
  const local=new Map(),storage=new Map([['rabbit-hole-session',JSON.stringify({visited:['oei'],
    pending:{destination:'/0-about/resident-inventor.html?history=porpoise',visited:['/0-about/resident-inventor.html?history=oei','/0-about/resident-inventor.html?history=porpoise']}})]]);
  harness(local,storage,{route:'/0-about/resident-inventor.html?history=porpoise',redirecting:true});
  assert.deepEqual(JSON.parse(storage.get('rabbit-hole-session')).visited,['oei']);
  assert.equal(JSON.parse(storage.get('rabbit-hole-session')).pending.destination,'porpoise');
  harness(local,storage,{route:'/resident-inventor/histories/porpoise/'});
  assert.deepEqual(JSON.parse(storage.get('rabbit-hole-session')).visited,['oei','porpoise']);
  assert.equal(JSON.parse(storage.get('rabbit-hole-session')).pending,null);
});

test('rapid clicks reserve once, rejected and unsuccessful navigation roll back', () => {
  const storage=new Map(),loaded=harness(new Map(),storage);loaded.click();loaded.click();loaded.win.RabbitHole.navigate();
  assert.equal(loaded.navigations.length,1);assert.deepEqual(JSON.parse(storage.get('rabbit-hole-session')).visited,[]);
  harness(new Map(),storage);assert.equal(JSON.parse(storage.get('rabbit-hole-session')).pending,null);
  const failed=harness(new Map(),storage,{fail:true});failed.click();
  assert.deepEqual(JSON.parse(storage.get('rabbit-hole-session')).visited,[]);
  assert.equal(JSON.parse(storage.get('rabbit-hole-session')).pending,null);
});

test('blocked and corrupt storage degrade gracefully',()=>{
  const loaded=harness(new Map(),new Map(),{blocked:true});assert.doesNotThrow(()=>loaded.click());
  assert.equal(loaded.navigations.length,1);
  const storage=new Map([['rabbit-hole-session','{bad']]);harness(new Map(),storage);
  assert.deepEqual(JSON.parse(storage.get('rabbit-hole-session')).visited,[]);
});

test('shared controls compose once on eligible default and standalone pages',()=>{
  assertSingleControls(compose('0-about/ideas.html'),1);
  for(const entry of destinations.filter(entry=>entry.category!=='invention-history'))assertSingleControls(compose(fileFor(entry.url)),0);
});

test('specialized controls retain language selector, calculator flow and playlist metadata safety',()=>{
  const language=compose(sourceFor('/0-things-i-do-for-fun/inglesrebelde.html'));
  const row=language.match(/<nav class="rabbit-hole-access"[\s\S]*?<\/nav>/)[0];
  assert.equal((row.match(/class="language-toggle"/g)||[]).length,1);
  assert.doesNotMatch(language.match(/\.language-toggle \{([\s\S]*?)\}/)[1],/position:|top:|right:|z-index:/);
  assert.match(compose(sourceFor('/0-things-i-do-for-fun/ircalc.html')),/flex-direction: column/);
  assert.match(page('0-music-and-mischief/spotify/spotify.md').metadata,/published: false/);
  assert.match(page(sourceFor('/0-things-i-do-for-fun/spotify/spotify.html')).body,/playlist_body \| markdownify/);
});

test('crypto rejection sampling excludes modulo bias',()=>{
  const values=[0xffffffff,4];assert.equal(randomIndex(3,{getRandomValues(array){array[0]=values.shift();}}),1);
  assert.equal(values.length,0);
});

test('index adapter replaces recognized histories and retains only meaningful loop fragments',()=>{
  const code=fs.readFileSync('0-about/js/resident-inventor-compatibility.js','utf8');
  function redirect(query){
    const calls=[];
    vm.runInNewContext(code,{URL,document:{getElementById:()=>({textContent:JSON.stringify({
      oei:{url:'/resident-inventor/histories/operational-entropy-index/',sections:7}})})},
      window:{location:{href:'https://example.com/0-about/resident-inventor.html'+query,replace:url=>calls.push(url)}}});
    return calls;
  }
  assert.deepEqual(redirect('?history=oei#oei-loop-5'),['/resident-inventor/histories/operational-entropy-index/#oei-loop-5']);
  for(const hash of ['#oei-loop-7','#ech-loop-0','#the-field'])
    assert.deepEqual(redirect('?history=oei'+hash),['/resident-inventor/histories/operational-entropy-index/']);
  for(const query of ['', '?history=base','?history=unknown','?history=__proto__'])assert.deepEqual(redirect(query),[]);
});

test('all nested history data and order match the original snapshot except approved ECH interface wording',()=>{
  const original=JSON.parse(fs.readFileSync('tests/fixtures/resident-inventor/original-records.json','utf8')
    .replace('Explore its continuation in the ECH tab.','Explore its continuation in the ECH history.'));
  const data=require('../_data/resident_inventor.json');
  assert.deepEqual(data,original);
  const histories=data.filter(entry=>!entry.base);
  assert.equal(histories.length,9);
  assert.equal(histories.reduce((n,entry)=>n+entry.loops.length,0),16);
  assert.equal(histories.flatMap(entry=>entry.loops).reduce((n,loop)=>n+loop.nodes.length,0),89);
  assert.equal(data[0].nodes.length,6);
});

// Detect source publication collisions before building, including HTML/Markdown pairs.
test('page directories declare unique public routes',()=>{
  assert.equal(pageSources().size,50);
});
