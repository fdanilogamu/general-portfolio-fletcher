// Optional browser QA: PLAYWRIGHT_MODULE points to an existing Playwright installation.
// --source-preview checks source-composed HTML; otherwise checks the actual _site build.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const {page: sourcePage, compose} = require('./rabbit-hole-source.cjs');
const {pool} = require('../static/js/rabbit-hole.js');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const preview = process.argv.includes('--source-preview');
const projectFiles = ['0-about/lemonless-tms-case-study.html','0-about/porpoise-ai-case-study.html',
  '0-resources/oei.html','0-things-i-do-for-fun/prison-planet.html',
  '0-things-i-do-for-fun/spotify/spotify.html','porpoise/index.html',
  '0-things-i-do-for-fun/inglesrebelde.html','0-things-i-do-for-fun/ircalc.html'];
const projects = projectFiles.map(file => '/' + file.replace(/index\.html$/, ''));
const data = {window:{}};
vm.runInNewContext(fs.readFileSync('0-about/js/resident-inventor-data.js','utf8'), data);
const histories = data.window.RESIDENT_INVENTOR_PATHS.filter(item => !item.base);
const routes = ['/0-about/ideas.html', ...pool(projects, histories)];
function previewHTML(file) {
  let html = compose(file);
  if (file.endsWith(path.join('spotify','spotify.html'))) {
    const body = sourcePage(path.join(path.dirname(file),'spotify.md')).body;
    const lines = body.trim().split(/\r?\n/);
    const items = lines.filter(line=>/^\d+\./.test(line)).map(line=>line.replace(/^\d+\. \[([^\]]+)\]\(([^)]+)\)$/, '<li><a href="$2">$1</a></li>'));
    html = html.replace('{{ playlist_body | markdownify }}', `<p>${lines[0]}</p><ol>${items.join('')}</ol>`);
  }
  html = html.replace(/<script id="rabbit-hole-destinations"[\s\S]*?<\/script>/,
    `<script id="rabbit-hole-destinations" type="application/json">${JSON.stringify(projects)}</script>`);
  html = html.replace(/{% include_relative ([\w.-]+) %}/g, (_, name) => {
    const body = sourcePage(path.join(path.dirname(file), name)).body;
    // Only the short playlist index uses Markdown in this audit. This is a preview,
    // not a Kramdown renderer; production output is independently checked by CI.
    return body.replace(/^\d+\. \[([^\]]+)\]\(([^)]+)\)$/gm, '<p><a href="$2">$1</a></p>');
  });
  return html.replace(/{{ page.title }}/g, 'Portfolio QA')
    .replace(/{%[\s\S]*?%}/g, '').replace(/{{[\s\S]*?}}/g, '');
}
function overlaps(a, b) {
  return a.x < b.x+b.width-1 && b.x < a.x+a.width-1 && a.y < b.y+b.height-1 && b.y < a.y+a.height-1;
}
(async () => {
  const server = http.createServer((req,res) => {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file = path.resolve(preview ? '.' : '_site', '.' + (pathname.endsWith('/') ? pathname+'index.html' : pathname));
    const base = path.resolve(preview ? '.' : '_site');
    if (!file.startsWith(base+path.sep) || !fs.existsSync(file)) {res.writeHead(404);res.end();return;}
    try {
      const type = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)] || 'application/octet-stream';
      res.setHeader('Content-Type',type);
      res.end(preview && file.endsWith('.html') ? previewHTML(file) : fs.readFileSync(file));
    } catch(error) {res.writeHead(500);res.end(String(error));}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true});
    const context = await browser.newContext();
    const tab = await context.newPage();
    // No preload unlock: check the real entry action and refresh persistence first.
    await tab.goto(origin+routes[0]);
    assert.equal(await tab.locator('.rabbit-hole-nav:visible').count(),0);
    await tab.getByRole('button',{name:'Enter the Rabbit Hole',exact:true}).focus();
    await tab.keyboard.press('Enter');
    await tab.waitForURL(url=>url.pathname!=='/0-about/ideas.html');
    await tab.waitForLoadState('load');
    assert.equal(await tab.locator('.rabbit-hole-nav:visible').count(),1);
    await tab.reload();
    assert.equal(await tab.locator('.rabbit-hole-nav:visible').count(),1);
    const artifacts = path.resolve('tests/.qa');
    fs.mkdirSync(artifacts,{recursive:true});
    let checked = 0;
    for (const width of [1440,768,390]) {
      await tab.setViewportSize({width,height:900});
      for (let index=0;index<routes.length;index++) {
        const route = routes[index];
        const response = await tab.goto(origin+route);
        assert.equal(response.status(),200,route);
        const nav = tab.locator('.rabbit-hole-nav');
        assert.equal(await nav.count(),1,route);
        assert.equal(await nav.isVisible(),true,route);
        assert.equal(await tab.locator('[aria-label="Enter the Rabbit Hole"]').count(),index===0?1:0);
        assert.doesNotMatch(await tab.locator('body').innerText(), /rabbit_hole:|layout: default/);
        const row = tab.locator('.header-actions, .rabbit-hole-access').first();
        const controls = await row.locator('a, button').all();
        const boxes = [];
        for (const control of controls) {
          if (!await control.isVisible()) continue;
          const box = await control.boundingBox();
          assert.ok(box.x>=-1 && box.x+box.width<=width+1,`${route}: control outside viewport ${width}`);
          boxes.forEach(other=>assert.ok(!overlaps(box,other),`${route}: controls overlap ${width}`));
          boxes.push(box);
        }
        assert.equal(await row.locator('a[href="https://fdanilogamu.github.io/fletcherlite/"]').count(),1);
        const id = new URL(route,origin).searchParams.get('history');
        if (id) {
          assert.equal(await tab.locator('[role="tab"][aria-selected="true"]').getAttribute('id'), 'ri-tab-'+id);
          assert.equal(await tab.locator('.ri-panel-intro h3').innerText(),histories.find(item=>item.id===id).title);
        }
        if (route.includes('inglesrebelde.html')) {
          await tab.locator('.language-toggle').focus();
          await tab.keyboard.press('Enter');
          assert.equal(await tab.locator('html').getAttribute('lang'),'en');
          await tab.reload();
          assert.equal(await tab.locator('html').getAttribute('lang'),'en');
          await tab.locator('.language-toggle').click();
          assert.equal(await tab.locator('html').getAttribute('lang'),'es');
        }
        if (route.includes('ircalc.html')) {
          const rowBox = await row.boundingBox();
          const cardBox = await tab.locator('.container').boundingBox();
          assert.ok(rowBox.y+rowBox.height<=cardBox.y, 'Calculator controls must be above the card');
          const range = tab.locator('input[type="range"]').first();
          await range.focus();
          await tab.keyboard.press('ArrowRight');
          assert.ok(await range.isEnabled());
        }
        await tab.evaluate(()=>window.scrollTo(0,0));
        await tab.screenshot({path:path.join(artifacts,`${width}-${index}.png`),animations:'disabled'});
        await nav.focus();
        await tab.keyboard.press('Enter');
        await tab.waitForURL(url=>url.pathname+url.search!==route);
        await tab.waitForLoadState('load');
        assert.ok(routes.slice(1).includes(new URL(tab.url()).pathname+new URL(tab.url()).search));
        checked++;
      }
      console.log(`PASS ${width}px: TL;DR and all 17 destinations; controls, histories, keyboard navigation, language selector`);
    }
    // Tab changes and browser back/forward restore the selected history.
    await tab.goto(origin+'/0-about/resident-inventor.html?history=porpoise');
    await tab.locator('#ri-tab-oei').click();
    await tab.goBack();
    assert.equal(await tab.locator('[aria-selected="true"]').getAttribute('id'),'ri-tab-porpoise');
    await tab.goForward();
    assert.equal(await tab.locator('[aria-selected="true"]').getAttribute('id'),'ri-tab-oei');
    console.log(`PASS ${checked} page/viewport checks; unlock refresh persistence; history back/forward. Mode: ${preview?'source preview (not Jekyll)':'Jekyll output'}`);
  } finally {if(browser) await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
