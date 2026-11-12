const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const { existsSync } = require('node:fs');
const { resolve, extname, sep } = require('node:path');
const root = resolve(__dirname, '..');
const KEY = 'reisekompass-hotel-notes-v1';
(async () => {
 const server = createServer(async (req, res) => {
  try { const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); const path = resolve(root, '.' + (name === '/' ? '/index.html' : name)); if (!path.startsWith(root + sep)) throw Error('Path'); const body = await readFile(path); res.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[extname(path)] || 'application/octet-stream'); res.end(body); }
  catch { res.statusCode = 404; res.end('Not found'); }
 });
 await new Promise(r => server.listen(0, '127.0.0.1', r));
 const url = `http://127.0.0.1:${server.address().port}`;
 const executablePath = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
 const browser = await chromium.launch({ executablePath, args:['--no-sandbox'] });
 try {
  const context = await browser.newContext({ viewport:{width:390,height:844}, serviceWorkers:'block' }); const p = await context.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => d.accept());
  await p.addInitScript(() => { window.speechSessions=[]; window.autoStart=true; window.SpeechRecognition=class { constructor(){ speechSessions.push(this); } start(){ if(autoStart)queueMicrotask(()=>this.onstart?.()); } stop(){this.onend?.();} abort(){this.onerror?.({error:'aborted'});this.onend?.();} }; });
  await p.goto(url); await p.waitForSelector('[data-hotel-note]');
  const ids = await p.locator('#hotelList [data-hotel-note]').evaluateAll(nodes => nodes.map(n => n.dataset.hotelNote)); assert(ids.length >= 8); const [a,b]=ids;
  await p.evaluate(({a,KEY}) => {localStorage.setItem('reisekompass-v1',JSON.stringify({weights:{reef:4},prices:{[a]:[{id:'p',source:'Test',amount:1800,operator:'Beispiel',outbound:'2026-12-01T10:00',inbound:'2026-12-08T18:00',savedAt:'2026-11-12T12:00:00Z'}]}}));localStorage.setItem('reisekompass-private-divecards-v1',JSON.stringify({padi:{'Name auf Karte':'Privater Bestand'}}));localStorage.setItem(KEY,JSON.stringify({'future-hotel':{text:'Nicht löschen'}}));}, {a,KEY});
  await p.reload(); await p.waitForSelector('[data-hotel-note]'); const before=await p.evaluate(()=>({main:localStorage.getItem('reisekompass-v1'),cards:localStorage.getItem('reisekompass-private-divecards-v1')}));
  const open=id=>p.locator(`#hotelList [data-hotel-note="${id}"]`).click();
  await open(a); await p.fill('#hotelNoteText','Vorher. Nachher.'); assert.equal(await p.evaluate(({a,KEY})=>JSON.parse(localStorage.getItem(KEY))[a].text,{a,KEY}),'Vorher. Nachher.'); await p.click('#hotelNoteDone');
  await open(b); assert.equal(await p.inputValue('#hotelNoteText'),''); await p.fill('#hotelNoteText','Eigenes Hausriff prüfen.'); await p.click('#hotelNoteDone');
  // Sorting and filtering must keep notes attached to stable hotel IDs.
  await p.selectOption('#sort','rating'); await open(a); assert.equal(await p.inputValue('#hotelNoteText'),'Vorher. Nachher.');
  await p.locator('#hotelNoteText').evaluate(el=>el.setSelectionRange(8,8)); await p.click('#hotelNoteDictate'); assert(await p.locator('#hotelNoteText').evaluate(el=>el.readOnly));
  assert.deepEqual(await p.evaluate(()=>{const s=speechSessions.at(-1);return {lang:s.lang,interim:s.interimResults};}),{lang:'de-DE',interim:true});
  const result=async(texts,final=true)=>p.evaluate(({texts,final})=>{const r=texts.map(transcript=>({transcript}));r.isFinal=final;speechSessions.at(-1).onresult({results:[r]});},{texts,final});
  await result(['Vorschau'],false); assert.equal(await p.inputValue('#hotelNoteText'),'Vorher. Nachher.'); await result(['Riff direkt am Strand.','Hausriff direkt am Strand.']); await p.evaluate(()=>speechSessions.at(-1).onend()); await p.selectOption('#hotelNoteAlternatives select','Hausriff direkt am Strand.'); assert.equal(await p.inputValue('#hotelNoteText'),'Vorher. Hausriff direkt am Strand. Nachher.');
  await p.fill('#hotelNoteText','Manuell bearbeitet'); assert.equal(await p.locator('#hotelNoteAlternatives select').count(),0);
  await p.click('#hotelNoteDictate'); await p.click('#hotelNoteCancel'); await result(['Späte Antwort']); assert.equal(await p.inputValue('#hotelNoteText'),'Manuell bearbeitet');
  for(const error of ['not-allowed','network','audio-capture']){await p.click('#hotelNoteDictate');await p.evaluate(error=>speechSessions.at(-1).onerror({error}),error);assert.equal(await p.inputValue('#hotelNoteText'),'Manuell bearbeitet');assert.equal(await p.locator('#hotelNoteDictate').isDisabled(),false);}
  await p.click('#hotelNoteDictate'); await result(['Fortsetzung.']); await p.click('#hotelNoteStop'); assert.equal(await p.inputValue('#hotelNoteText'),'Manuell bearbeitet Fortsetzung.');
  // Storage errors retain the draft even when closing via button, Escape or backdrop.
  await p.evaluate(KEY=>{window.realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===KEY)throw new DOMException('Full','QuotaExceededError');return realSet.call(this,k,v)};},KEY);
  await p.fill('#hotelNoteText','Nicht gespeicherter Entwurf'); await p.click('#hotelNotesClose'); assert(await p.locator('#hotelNotesDialog').isVisible()); await p.keyboard.press('Escape'); assert(await p.locator('#hotelNotesDialog').isVisible()); await p.mouse.click(2,2); assert(await p.locator('#hotelNotesDialog').isVisible()); assert((await p.innerText('#hotelNoteStatus')).includes('Nicht gespeichert'));
  await p.evaluate(()=>Storage.prototype.setItem=realSet); await p.click('#hotelNoteDone'); await open(a); assert.equal(await p.inputValue('#hotelNoteText'),'Nicht gespeicherter Entwurf');
  // Missing browser support and startup timeout leave manual typing available.
  await p.evaluate(()=>{window.savedRecognition=SpeechRecognition;window.savedWebkit=window.webkitSpeechRecognition;window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined;}); await p.click('#hotelNoteDictate'); assert((await p.innerText('#hotelNoteStatus')).includes('Handy-Tastatur')); await p.evaluate(()=>{window.SpeechRecognition=savedRecognition;window.webkitSpeechRecognition=savedWebkit;});
  await p.clock.install(); await p.evaluate(()=>autoStart=false); await p.click('#hotelNoteDictate'); await p.clock.fastForward(12001); assert((await p.innerText('#hotelNoteStatus')).includes('antwortet nicht')); await p.evaluate(()=>autoStart=true); await p.clock.resume();
  for(const width of [360,390,480]){await p.setViewportSize({width,height:844});assert(await p.evaluate(()=>{const d=document.getElementById('hotelNotesDialog');return d.scrollWidth<=d.clientWidth&&document.documentElement.scrollWidth<=innerWidth}));}
  await p.setViewportSize({width:390,height:844}); await p.screenshot({path:'/tmp/reisekompass-hotel-notes.png'}); await p.click('#hotelNoteDone');
  // Notes are also reachable from hotel details and return to the same details.
  await p.locator(`[data-detail="${a}"]`).first().click(); await p.locator(`#detailDialog [data-hotel-note="${a}"]`).click(); assert.equal(await p.inputValue('#hotelNoteText'),'Nicht gespeicherter Entwurf'); await p.click('#hotelNoteDone'); assert(await p.locator('#detailDialog').isVisible()); await p.locator('#detailDialog .icon-button').click();
  await p.reload(); await open(b); assert.equal(await p.inputValue('#hotelNoteText'),'Eigenes Hausriff prüfen.'); await p.click('#hotelNoteDone'); assert.deepEqual(await p.evaluate(()=>({main:localStorage.getItem('reisekompass-v1'),cards:localStorage.getItem('reisekompass-private-divecards-v1')})),before);
  // Corrupt note storage is never overwritten with an empty object.
  const stored=await p.evaluate(KEY=>localStorage.getItem(KEY),KEY);await p.evaluate(KEY=>localStorage.setItem(KEY,'broken'),KEY);await open(a);await p.fill('#hotelNoteText','Entwurf behalten');await p.click('#hotelNoteDone');assert.equal(await p.evaluate(KEY=>localStorage.getItem(KEY),KEY),'broken');await p.evaluate(({KEY,stored})=>localStorage.setItem(KEY,stored),{KEY,stored});await p.click('#hotelNoteDone');
  assert.equal(await p.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY))['future-hotel'].text,KEY),'Nicht löschen');assert.deepEqual(errors,[]);await context.close();
  // Verify the actual service worker caches the new notes module for offline use.
  const offline=await browser.newContext({viewport:{width:390,height:844}}),q=await offline.newPage();await q.goto(url);await q.evaluate(()=>navigator.serviceWorker.ready);await q.reload();await q.waitForSelector('[data-hotel-note]');await q.locator('[data-hotel-note]').first().click();await q.fill('#hotelNoteText','Offline verfügbar');await q.click('#hotelNoteDone');await offline.setOffline(true);await q.reload();await q.waitForSelector('[data-hotel-note]');await q.locator('[data-hotel-note]').first().click();assert.equal(await q.inputValue('#hotelNoteText'),'Offline verfügbar');await offline.close();
  console.log('PASS: per-hotel notes, autosave/reload/sort, prices/private data preserved, German dictation insertion/alternatives/errors/cancel/late results/timeouts/fallback, quota and corrupt storage guards, nested detail dialog, mobile widths and real offline service worker. Audio recognition simulated.');
 } finally {await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exit(1)});
