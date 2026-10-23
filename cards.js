const STORE='reisekompass-private-divecards-v1';
const PHOTO_STORE='reisekompass-private-divecard-photos-v1';

const templates=[
  {id:'padi',title:'PADI / EN 14153-2',kind:'Brevet / Qualifikation',fields:['Name auf Karte','Student No.','Geburtsdatum','Zertifiziert am','Instructor','Instructor No.','Dive Center','Ort','Standard']},
  {id:'ndl',title:'NDL Zertifizierung',kind:'Brevet / Qualifikation',fields:['Name auf Karte','NDL No.','Geburtsdatum','Zertifiziert am','Instructor No.','Instructor','Hinweis']},
  {id:'scubaworld',title:'Scuba World Divers',kind:'Mitgliedskarte – kein Brevet',fields:['Name auf Karte','Membership No.','Datum','Dive Center','Region']}
];

const $=s=>document.querySelector(s);
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}}
let values=read(STORE,{}),photos=read(PHOTO_STORE,{});
const save=()=>localStorage.setItem(STORE,JSON.stringify(values));

function esc(v=''){return String(v).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function textFor(card){const data=values[card.id]||{};return `${card.title}\n${card.kind}\n${card.fields.map(k=>`${k}: ${data[k]||''}`).join('\n')}`}
function allText(){return templates.map(textFor).join('\n\n')}

async function copy(text,msg){try{await navigator.clipboard.writeText(text)}catch{const a=document.createElement('textarea');a.value=text;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}const t=$('#toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}}

function render(){const list=$('#diveCardsList');if(!list)return;list.innerHTML=templates.map(card=>{const data=values[card.id]||{},photo=photos[card.id];return `<article class="dive-card-item"><div class="dive-card-photo">${photo?`<img src="${photo}" alt="${esc(card.title)}">`:`<div class="dive-card-placeholder">🪪<span>Foto nur lokal auf diesem Gerät speichern</span></div>`}<div class="dive-card-photo-actions"><label class="button ghost dive-upload-button">📷 ${photo?'Foto ändern':'Foto hinzufügen'}<input type="file" accept="image/*" data-photo="${card.id}" hidden></label>${photo?`<button class="button ghost" data-remove-photo="${card.id}" type="button">Foto löschen</button>`:''}</div></div><div class="dive-card-info"><div class="dive-card-title"><div><small>${card.kind}</small><h3>${card.title}</h3></div><button class="button ghost" data-copy="${card.id}" type="button">📋 Kopieren</button></div><div class="private-fields">${card.fields.map(k=>`<label>${k}<input data-card="${card.id}" data-field="${esc(k)}" value="${esc(data[k]||'')}"></label>`).join('')}</div></div></article>`}).join('');

 document.querySelectorAll('[data-card]').forEach(i=>i.addEventListener('change',()=>{values[i.dataset.card]??={};values[i.dataset.card][i.dataset.field]=i.value.trim();save()}));
 document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',()=>copy(textFor(templates.find(c=>c.id===b.dataset.copy)),'Kartendaten kopiert.')));
 document.querySelectorAll('[data-remove-photo]').forEach(b=>b.addEventListener('click',()=>{delete photos[b.dataset.removePhoto];localStorage.setItem(PHOTO_STORE,JSON.stringify(photos));render()}));
 document.querySelectorAll('[data-photo]').forEach(i=>i.addEventListener('change',()=>{const f=i.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{photos[i.dataset.photo]=r.result;try{localStorage.setItem(PHOTO_STORE,JSON.stringify(photos));render()}catch{alert('Foto zu groß. Bitte ein kleineres Foto wählen.')}};r.readAsDataURL(f)}));
}

$('#openDiveCards')?.addEventListener('click',()=>{$('#menuPanel').hidden=true;$('#menuButton').setAttribute('aria-expanded','false');render();$('#diveCardsDialog').showModal()});
$('#copyAllDiveData')?.addEventListener('click',()=>copy(allText(),'Alle Tauchdaten kopiert.'));
document.querySelectorAll('[data-close-dive-cards]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$('#diveCardsDialog')?.addEventListener('click',e=>{if(e.target===$('#diveCardsDialog'))e.target.close()});
render();
