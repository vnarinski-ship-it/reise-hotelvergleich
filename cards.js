const STORE='reisekompass-private-divecards-v1';
const DB_NAME='reisekompass-private-media';
const DB_STORE='divecard-photos';

const templates=[
  {id:'padi',title:'PADI / EN 14153-2',kind:'Brevet / Qualifikation',fields:['Name auf Karte','Student No.','Geburtsdatum','Zertifiziert am','Instructor','Instructor No.','Dive Center','Ort','Standard']},
  {id:'ndl',title:'NDL Zertifizierung',kind:'Brevet / Qualifikation',fields:['Name auf Karte','NDL No.','Geburtsdatum','Zertifiziert am','Instructor No.','Instructor','Hinweis']},
  {id:'scubaworld',title:'Scuba World Divers',kind:'Mitgliedskarte – kein Brevet',fields:['Name auf Karte','Membership No.','Datum','Dive Center','Region']}
];

const $=s=>document.querySelector(s);
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}}
let values=read(STORE,{}),photos={};
const save=()=>localStorage.setItem(STORE,JSON.stringify(values));

function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function dbGet(key){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly');const r=tx.objectStore(DB_STORE).get(key);r.onsuccess=()=>resolve(r.result||'');r.onerror=()=>reject(r.error)})}
async function dbSet(key,value){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
async function dbDelete(key){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
async function loadPhotos(){for(const card of templates){try{photos[card.id]=await dbGet(card.id)}catch{photos[card.id]=''}}}

function esc(v=''){return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function textFor(card){const data=values[card.id]||{};return `${card.title}\n${card.kind}\n${card.fields.map(k=>`${k}: ${data[k]||''}`).join('\n')}`}
function allText(){return templates.map(textFor).join('\n\n')}
async function copy(text,msg){try{await navigator.clipboard.writeText(text)}catch{const a=document.createElement('textarea');a.value=text;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}toast(msg)}
function toast(msg){const t=$('#toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}}

function importPrivateData(){const raw=prompt('Privaten Tauchdaten-Block hier einfügen. Die Daten werden nur lokal auf diesem Gerät gespeichert:');if(!raw)return;try{const incoming=JSON.parse(raw);const clean={};templates.forEach(card=>{const src=incoming[card.id]||{};clean[card.id]={};card.fields.forEach(field=>{if(src[field]!=null)clean[card.id][field]=String(src[field])})});values=clean;save();render();toast('Private Tauchdaten importiert.')}catch{alert('Der Datenblock ist nicht gültig. Bitte vollständig kopieren und erneut versuchen.')}}

function resizePhoto(file,maxSide=1200,quality=.72){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error('Datei konnte nicht gelesen werden.'));reader.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('Bild konnte nicht geöffnet werden.'));img.onload=()=>{let {width,height}=img;const scale=Math.min(1,maxSide/Math.max(width,height));width=Math.max(1,Math.round(width*scale));height=Math.max(1,Math.round(height*scale));const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(img,0,0,width,height);resolve(canvas.toDataURL('image/jpeg',quality))};img.src=reader.result};reader.readAsDataURL(file)})}

function render(){const list=$('#diveCardsList');if(!list)return;list.innerHTML=templates.map(card=>{const data=values[card.id]||{},photo=photos[card.id];return `<article class="dive-card-item"><div class="dive-card-photo">${photo?`<img src="${photo}" alt="${esc(card.title)}">`:`<div class="dive-card-placeholder">🪪<span>Foto nur lokal auf diesem Gerät speichern</span></div>`}<div class="dive-card-photo-actions"><label class="button ghost dive-upload-button">📷 ${photo?'Foto ändern':'Foto hinzufügen'}<input type="file" accept="image/*" data-photo="${card.id}" hidden></label>${photo?`<button class="button ghost" data-remove-photo="${card.id}" type="button">Foto löschen</button>`:''}</div></div><div class="dive-card-info"><div class="dive-card-title"><div><small>${card.kind}</small><h3>${card.title}</h3></div><button class="button ghost" data-copy="${card.id}" type="button">📋 Kopieren</button></div><div class="private-fields">${card.fields.map(k=>`<label>${k}<input data-card="${card.id}" data-field="${esc(k)}" value="${esc(data[k]||'')}"></label>`).join('')}</div></div></article>`}).join('');
 document.querySelectorAll('[data-card]').forEach(i=>i.addEventListener('change',()=>{values[i.dataset.card]??={};values[i.dataset.card][i.dataset.field]=i.value.trim();save()}));
 document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>copy(textFor(templates.find(c=>c.id===b.dataset.copy)),'Kartendaten kopiert.')));
 document.querySelectorAll('[data-remove-photo]').forEach(b=>b.addEventListener('click',async()=>{await dbDelete(b.dataset.removePhoto);photos[b.dataset.removePhoto]='';render()}));
 document.querySelectorAll('[data-photo]').forEach(i=>i.addEventListener('change',async()=>{const f=i.files?.[0];if(!f)return;try{toast('Foto wird vorbereitet …');const compressed=await resizePhoto(f);await dbSet(i.dataset.photo,compressed);photos[i.dataset.photo]=compressed;render();toast('Foto verkleinert und lokal gespeichert.')}catch(err){alert((err&&err.message)||'Foto konnte nicht gespeichert werden.')}}));
}

const toolbar=document.querySelector('.dive-cards-toolbar');if(toolbar&&!$('#importDiveData')){const b=document.createElement('button');b.className='button ghost';b.id='importDiveData';b.type='button';b.textContent='🔒 Private Daten importieren';toolbar.prepend(b);b.addEventListener('click',importPrivateData)}
$('#openDiveCards')?.addEventListener('click',async()=>{$('#menuPanel').hidden=true;$('#menuButton').setAttribute('aria-expanded','false');await loadPhotos();render();$('#diveCardsDialog').showModal()});
$('#copyAllDiveData')?.addEventListener('click',()=>copy(allText(),'Alle Tauchdaten kopiert.'));
document.querySelectorAll('[data-close-dive-cards]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('#diveCardsDialog')?.addEventListener('click',e=>{if(e.target===$('#diveCardsDialog'))e.target.close()});
loadPhotos().then(render).catch(render);
