const $=s=>document.querySelector(s);

if(!document.querySelector('link[href^="maps.css"]')){
  const css=document.createElement('link');css.rel='stylesheet';css.href='maps.css?v=1';document.head.appendChild(css);
}

const diveMaps=[
  {title:'DiveRED – Hurghada · Makadi · Safaga',badge:'Mein Tipp',text:'Moderne Übersicht mit vielen Riffen, Wänden und Wracks. Einzelne Plätze lassen sich öffnen und mit Tiefe/Briefing ansehen.',url:'https://dive-red.com/dive-sites/'},
  {title:'Scuba World – Makadi House Reef',badge:'Makadi',text:'Sehr detaillierte Riffkarte direkt für Makadi Bay mit markierten Bereichen, Einstieg und Unterwasser-Strukturen.',url:'https://www.scubaworlddivers.com/makadi-bay/dive-sites/makadi/house-reef-makadi-bay'},
  {title:'PADI – Sahl Hasheesh & Makadi Bay',badge:'Interaktiv',text:'Interaktive PADI-Karte für Tauchplätze rund um Makadi Bay und Sahl Hasheesh.',url:'https://www.padi.com/dive-sites/egypt/sahl-hasheesh-makadi-bay/'},
  {title:'Red Sea Creatures – Riffe & Wracks',badge:'Große Karte',text:'Durchsuchbare Karte des Roten Meers mit Filtern für Riffe, Wracks, Wände, Drift und Schwierigkeitsgrad.',url:'https://redseacreatures.com/diving/dive-sites'},
  {title:'Blue Water – Karten & Downloads',badge:'PDF / Download',text:'Sammlung mit Hurghada-Übersicht, kompletten Satellitenkarten des Roten Meers sowie Wrack- und Seekarten.',url:'https://www.blue-water-dive.com/en/good-to-know/downloads/'}
];

function ensureUi(){
  const menu=$('#menuPanel');
  if(menu&&!$('#openDiveMaps')){const b=document.createElement('button');b.type='button';b.id='openDiveMaps';b.textContent='🗺️ Tauchkarten';menu.appendChild(b)}
  if(!$('#diveMapsDialog')){
    const d=document.createElement('dialog');d.id='diveMapsDialog';d.className='dialog dive-maps-dialog';
    d.innerHTML='<div><div class="dialog-head"><div><p class="eyebrow dark">Rotes Meer</p><h2>🗺️ Tauchkarten</h2></div><button class="icon-button" type="button" data-close-dive-maps aria-label="Schließen">×</button></div><p class="hint">Mehrere Karten für Makadi Bay, Hurghada, Safaga sowie Riffe und Wracks. Externe Karten öffnen sich in einem neuen Tab.</p><div id="diveMapsList" class="dive-maps-list"></div></div>';
    document.body.appendChild(d)
  }
}

function renderDiveMaps(){const list=$('#diveMapsList');if(!list)return;list.innerHTML=diveMaps.map((m,i)=>`<article class="dive-map-card"><div class="dive-map-card-head"><span class="dive-map-number">${i+1}</span><div><small>${m.badge}</small><h3>${m.title}</h3></div></div><p>${m.text}</p><a class="button primary" href="${m.url}" target="_blank" rel="noopener noreferrer">🗺️ Karte öffnen ↗</a></article>`).join('')}

ensureUi();renderDiveMaps();
$('#openDiveMaps')?.addEventListener('click',()=>{$('#menuPanel').hidden=true;$('#menuButton').setAttribute('aria-expanded','false');renderDiveMaps();$('#diveMapsDialog').showModal()});
$('[data-close-dive-maps]')?.addEventListener('click',()=>$('#diveMapsDialog').close());
$('#diveMapsDialog')?.addEventListener('click',e=>{if(e.target===$('#diveMapsDialog'))e.target.close()});
