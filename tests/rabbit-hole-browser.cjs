// Real generated-site browser QA. No source-preview renderer or project dependency.
// PLAYWRIGHT_MODULE and BROWSER_EXECUTABLE may point to existing local tooling.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const registry=require('../_data/rabbit_hole.json').filter(entry=>entry.status==='approved');
const histories=require('../_data/resident_inventor.json').filter(entry=>!entry.base);
const output=path.resolve(process.env.SITE_DIR||'_site');
const artifacts=path.resolve(process.env.QA_ARTIFACTS||'tests/.qa');
function overlap(a,b){return a.x<b.x+b.width-1&&b.x<a.x+a.width-1&&a.y<b.y+b.height-1&&b.y<a.y+a.height-1;}
(async()=>{
  assert.ok(fs.existsSync(path.join(output,'resident-inventor/histories/porpoise/index.html')),'Build Jekyll first');
  const server=http.createServer((req,res)=>{
    const route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(output,'.'+(route.endsWith('/')?route+'index.html':route));
    if(!file.startsWith(output+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true});
    const context=await browser.newContext();
    // External fonts/services are outside this regression; exercise fallback typography.
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const tab=await context.newPage();
    const errors=[];tab.on('pageerror',error=>errors.push(String(error)));
    await tab.goto(origin+'/0-about/ideas.html');
    assert.equal(await tab.locator('.rabbit-hole-nav:visible').count(),0);
    await tab.getByRole('button',{name:'Enter the Rabbit Hole',exact:true}).focus();await tab.keyboard.press('Enter');
    await tab.waitForURL(url=>url.pathname!=='/0-about/ideas.html');await tab.waitForLoadState('load');
    const selected=[new URL(tab.url()).pathname];
    for(let i=1;i<18;i++){
      if(i%2===0)await tab.goto(origin+'/0-about/ideas.html');
      const previous=tab.url();
      const control=i%2===0?'[aria-label="Enter the Rabbit Hole"]':'.rabbit-hole-nav';
      await tab.locator(control).focus();await tab.keyboard.press('Enter');
      await tab.waitForURL(url=>url.href!==previous);await tab.waitForLoadState('load');
      const route=new URL(tab.url()).pathname;assert.ok(!selected.includes(route));selected.push(route);
      await tab.reload();assert.equal(await tab.evaluate(()=>JSON.parse(sessionStorage.getItem('rabbit-hole-session')).visited.length),i+1);
    }
    assert.deepEqual(selected.slice().sort(),registry.map(entry=>entry.url).sort());
    const previous=tab.url();await tab.evaluate(()=>{RabbitHole.navigate();RabbitHole.navigate();});
    await tab.waitForURL(url=>url.href!==previous);await tab.waitForLoadState('load');
    assert.equal(await tab.evaluate(()=>JSON.parse(sessionStorage.getItem('rabbit-hole-session')).visited.length),1);
    const fresh=await context.newPage();await fresh.goto(origin+'/0-about/ideas.html');
    assert.equal(await fresh.locator('.rabbit-hole-nav:visible').count(),1);
    assert.equal(await fresh.evaluate(()=>JSON.parse(sessionStorage.getItem('rabbit-hole-session')).visited.length),0);await fresh.close();
    const memory=await tab.evaluate(()=>sessionStorage.getItem('rabbit-hole-session'));
    await tab.goto(origin+'/resident-inventor/histories/porpoise/');
    assert.equal(await tab.evaluate(()=>sessionStorage.getItem('rabbit-hole-session')),memory);
    // Last unvisited is current: restart without tracking that manual arrival.
    await tab.evaluate(ids=>sessionStorage.setItem('rabbit-hole-session',JSON.stringify({version:2,visited:ids.filter(id=>id!=='porpoise'),previous:'oei',pending:null})),registry.map(entry=>entry.id));
    await tab.reload();const current=tab.url();await tab.locator('.rabbit-hole-nav').click();
    await tab.waitForURL(url=>url.href!==current);await tab.waitForLoadState('load');
    assert.equal(await tab.evaluate(()=>JSON.parse(sessionStorage.getItem('rabbit-hole-session')).visited.length),1);
    console.log('PASS browser: 18-destination cycle, both entry controls, refresh, reset, rapid clicks, fresh-tab unlock, manual browsing unchanged, current-only remainder');

    fs.mkdirSync(artifacts,{recursive:true});let historyChecks=0,controlChecks=0;
    for(const width of [1440,768,390]){
      await tab.setViewportSize({width,height:900});
      for(const entry of registry){
        assert.equal((await tab.goto(origin+entry.url)).status(),200);
        assert.equal(await tab.locator('.rabbit-hole-nav:visible').count(),1,entry.url);
        assert.equal(await tab.locator('script[src$="/static/js/rabbit-hole.js"]').count(),1);
        const row=tab.locator('.header-actions, .rabbit-hole-access').first();
        const boxes=[];
        for(const control of await row.locator('a,button').all()){
          if(!await control.isVisible())continue;const box=await control.boundingBox();
          assert.ok(box.x>=-1&&box.x+box.width<=width+1,entry.url+' outside viewport');
          for(const other of boxes)assert.ok(!overlap(box,other),entry.url+' overlapping controls');boxes.push(box);
        }
        if(entry.id==='job-search-timeline'){
          assert.equal(await tab.locator('.entry').count(),13);
          await tab.locator('.pin-btn').last().click();assert.ok(await tab.locator('#entry-13').isVisible());
        }
        if(entry.id==='job-search-lessons')assert.equal(await tab.locator('.commandment').count(),10);
        if(entry.id==='ingles-rebelde'){
          await tab.locator('.language-toggle').click();assert.equal(await tab.locator('html').getAttribute('lang'),'en');
          await tab.reload();assert.equal(await tab.locator('html').getAttribute('lang'),'en');
          await tab.locator('.language-toggle').click();
        }
        controlChecks++;
      }
      for(const theme of ['dark','light']){
        for(const history of histories){
          const entry=registry.find(entry=>entry.id===history.id);
          await tab.goto(origin+entry.url);
          await tab.evaluate(theme=>{localStorage.setItem('theme',theme);document.documentElement.setAttribute('data-theme',theme);},theme);
          const article=tab.locator('.ri-history-page');
          assert.equal(await article.locator('h1').innerText(),history.title);
          assert.equal(await article.locator('.ri-node').count(),history.loops.reduce((n,loop)=>n+loop.nodes.length,0));
          assert.equal(await article.locator('.ri-loop').count(),history.loops.length);
          const sequence=article.locator('.ri-sequence').first();
          assert.equal(await sequence.evaluate(el=>getComputedStyle(el).display),width<=650?'block':'grid');
          assert.ok(await sequence.isVisible());await sequence.focus();await tab.keyboard.press('ArrowRight');
          if(width>650){
            await sequence.evaluate(el=>{el.scrollLeft=el.scrollWidth;});
            await tab.waitForFunction(()=>document.querySelector('.ri-sequence-shell').classList.contains('is-at-end'));
            assert.equal(await article.locator('.ri-scroll-hint').first().innerText(),'End of this path');
          }else assert.equal(await article.locator('.ri-scroll-hint').first().isVisible(),false);
          assert.ok(await tab.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow '+entry.url);
          if(['oei','ech','inventors-lab'].includes(history.id)){
            await sequence.evaluate(el=>{el.scrollLeft=0;});await tab.evaluate(()=>scrollTo(0,0));
            await tab.screenshot({path:path.join(artifacts,width+'-'+theme+'-'+history.id+'.png'),animations:'disabled'});
          }
          historyChecks++;
        }
        await tab.goto(origin+'/0-about/resident-inventor.html');
        await tab.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
        assert.equal(await tab.locator('#invention-paths .ri-history-directory a').count(),9);
        await tab.screenshot({path:path.join(artifacts,width+'-'+theme+'-index.png'),animations:'disabled'});
      }
    }
    console.log('PASS browser: '+historyChecks+' direct-history/theme/viewport checks and '+controlChecks+' exhibit-control/viewport checks');
    await tab.goto(origin+'/resident-inventor/histories/operational-entropy-index/');
    await tab.locator('.ri-branch-control').click();await tab.waitForURL('**/histories/entropy-compatible-hiring/');
    await tab.goBack();assert.equal(await tab.locator('.ri-history-page').getAttribute('data-history-id'),'oei');
    await tab.goForward();assert.equal(await tab.locator('.ri-history-page').getAttribute('data-history-id'),'ech');
    await tab.locator('.ri-breadcrumb a').click();await tab.waitForURL('**/0-about/resident-inventor.html');
    await tab.locator('#invention-paths a').filter({hasText:'Dream Machine'}).click();await tab.waitForURL('**/histories/dream-machine/');
    await tab.goto(origin+'/0-about/ideas.html');
    await tab.goto(origin+'/0-about/resident-inventor.html?history=oei#oei-loop-5');
    await tab.waitForURL('**/histories/operational-entropy-index/#oei-loop-5');
    await tab.goBack();assert.equal(new URL(tab.url()).pathname,'/0-about/ideas.html');
    await tab.goto(origin+'/0-about/resident-inventor.html?history=porpoise#the-field');
    await tab.waitForURL('**/histories/porpoise/');assert.equal(new URL(tab.url()).hash,'');
    for(const id of ['base','unknown']){
      await tab.goto(origin+'/0-about/resident-inventor.html?history='+id);
      assert.equal(new URL(tab.url()).pathname,'/0-about/resident-inventor.html');
    }
    await tab.emulateMedia({reducedMotion:'reduce'});
    await tab.goto(origin+'/resident-inventor/histories/oei/').catch(()=>{});
    await tab.goto(origin+'/resident-inventor/histories/operational-entropy-index/');
    assert.equal(await tab.locator('.ri-sequence').first().evaluate(el=>getComputedStyle(el).scrollBehavior),'auto');
    assert.deepEqual(errors,[],'Browser runtime errors');

    const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:900}});
    await noJS.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const reader=await noJS.newPage();
    for(const history of histories){
      await reader.goto(origin+registry.find(entry=>entry.id===history.id).url);
      assert.equal(await reader.locator('.ri-node').count(),history.loops.reduce((n,loop)=>n+loop.nodes.length,0));
      assert.equal(await reader.locator('.ri-history-page h1').innerText(),history.title);
    }
    await reader.goto(origin+'/0-about/resident-inventor.html?history=oei');
    assert.equal(await reader.locator('#invention-paths a').count(),9);
    assert.equal(await reader.locator('.ri-field-environment').count(),1);
    await noJS.close();
    console.log('PASS browser: JS-disabled histories and index fallback, branch/back/forward, breadcrumbs/directory, legacy redirects and fragments, reduced motion, no runtime errors');
  }finally{if(browser)await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
