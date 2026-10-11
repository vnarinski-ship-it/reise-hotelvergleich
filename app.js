import { hotels as seedHotels } from './data.js?v=2';
import { criteria, rankHotels } from './core.js?v=2';

const STORAGE_KEY = 'reisekompass-v1';
const defaultWeights = Object.fromEntries(criteria.map(([key]) => [key, ['reef','wind','pool','couples','value'].includes(key) ? 5 : 3]));
const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
let state = { weights: {...defaultWeights, ...(saved.weights || {})}, prices: saved.prices || {} };

const $ = selector => document.querySelector(selector);
const euro = new Intl.NumberFormat('de-DE', {style:'currency', currency:'EUR', maximumFractionDigits:0});
const date = new Intl.DateTimeFormat('de-DE', {dateStyle:'short', timeStyle:'short'});
const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const hotels = () => seedHotels.map(h => ({...h, prices: state.prices[h.id] || []}));
const query = () => ({ maxPrice:$('#maxPrice').value, operator:$('#operatorFilter').value, departureAfter:$('#departureAfter').value, returnBefore:$('#returnBefore').value, dateFrom:$('#dateFrom').value, dateTo:$('#dateTo').value, duration:$('#duration').value });

function renderWeights() {
  $('#weights').innerHTML = criteria.map(([key,label]) => `<label><span>${label}</span><output for="w-${key}">${state.weights[key]}</output><input id="w-${key}" data-weight="${key}" type="range" min="0" max="5" value="${state.weights[key]}"></label>`).join('');
  document.querySelectorAll('[data-weight]').forEach(input => input.addEventListener('input', event => {
    state.weights[event.target.dataset.weight] = Number(event.target.value);
    event.target.previousElementSibling.value = event.target.value;
    persist(); renderHotels();
  }));
}

function renderHotels() {
  let ranked = rankHotels(hotels(), state.weights, query());
  if ($('#onlyPrices').checked) ranked = ranked.filter(h => h.price);
  const sort = $('#sort').value;
  ranked.sort(sort === 'price' ? (a,b) => (a.price?.amount ?? Infinity)-(b.price?.amount ?? Infinity) : sort === 'rating' ? (a,b) => b.rating-a.rating : (a,b) => b.score-a.score);
  $('#resultCount').textContent = ranked.length;
  $('#emptyState').hidden = ranked.length > 0;
  $('#hotelList').innerHTML = ranked.map((hotel,index) => hotelCard(hotel,index)).join('');
  document.querySelectorAll('[data-detail]').forEach(button => button.addEventListener('click', () => showDetail(button.dataset.detail)));
  document.querySelectorAll('[data-add-price]').forEach(button => button.addEventListener('click', () => openPriceDialog(button.dataset.addPrice)));
}

function hotelCard(hotel,index) {
  const score = Math.round(hotel.score * 10);
  const storedCount = hotel.prices.length;
  const source = hotel.price
    ? `<div class="price"><small>${hotel.price.source} · ${hotel.price.operator}</small><strong>${euro.format(hotel.price.amount)}</strong><span>gesamt für 2 · Stand ${new Date(hotel.price.savedAt).toLocaleDateString('de-DE')}</span></div>`
    : storedCount
      ? `<div class="price filtered"><small>${storedCount} Preisstand${storedCount === 1 ? '' : 'e'} gespeichert</small><strong>Durch Filter ausgeblendet</strong><button class="text-button" data-detail="${hotel.id}">Preisstand ansehen →</button></div>`
      : `<div class="price missing"><small>Noch kein Angebot</small><strong>Preis fehlt</strong><button class="text-button" data-add-price="${hotel.id}">Jetzt eintragen →</button></div>`;
  return `<article class="hotel-card card">
    <div class="rank ${index < 3 ? 'top' : ''}">${index+1}</div>
    <div class="hotel-main"><div class="hotel-meta"><span>${'★'.repeat(hotel.stars)}</span> ${hotel.area}</div><h3>${hotel.name}</h3><p>${hotel.summary}</p><div class="tags">${hotel.tags.map(t=>`<span>${t}</span>`).join('')}</div></div>
    <div class="match"><div class="score-ring" style="--score:${score}"><span>${score}</span><small>/100</small></div><strong>Euer Match</strong><span>Kriterien ${hotel.rating.toFixed(1)}/10</span></div>
    ${source}
    <div class="card-actions"><button class="button ghost" data-detail="${hotel.id}">Details ansehen</button><a class="button primary" target="_blank" rel="noopener noreferrer" href="${searchLink('check24', hotel.name)}">Bei CHECK24 suchen ↗</a></div>
  </article>`;
}

function searchLink(source, hotel) {
  const term = encodeURIComponent(`${hotel} ${$('#dateFrom').value || ''} ${$('#duration').value} Nächte Nürnberg`);
  return source === 'check24' ? `https://urlaub.check24.de/suche?q=${term}` : `https://www.ab-in-den-urlaub.de/search?search=${term}`;
}

function showDetail(id) {
  const hotel = hotels().find(h => h.id === id);
  $('#detailContent').innerHTML = `<div class="dialog-head"><div><p class="eyebrow dark">${hotel.area} · ${hotel.stars} Sterne</p><h2>${hotel.name}</h2></div><button class="icon-button" onclick="this.closest('dialog').close()" aria-label="Schließen">×</button></div><p class="detail-summary">${hotel.summary}</p><div class="rating-grid">${criteria.map(([key,label])=>`<div><span>${label}</span><strong>${hotel.ratings[key]}/10</strong><i><b style="width:${hotel.ratings[key]*10}%"></b></i></div>`).join('')}</div><div class="price-history"><h3>Gespeicherte Preisstände</h3>${hotel.prices.length ? hotel.prices.sort((a,b)=>b.savedAt.localeCompare(a.savedAt)).map(p=>`<div><span><strong>${p.source}</strong><small>${p.operator} · ${p.transfer || 'Transfer k. A.'}</small></span><span><strong>${euro.format(p.amount)}</strong><small>${date.format(new Date(p.outbound))} – ${date.format(new Date(p.inbound))}</small></span></div>`).join('') : '<p>Noch keine Preisstände gespeichert.</p>'}</div><div class="dialog-actions"><a class="button ghost" target="_blank" rel="noopener noreferrer" href="${searchLink('ab',hotel.name)}">ab-in-den-urlaub ↗</a><button class="button primary" data-modal-price="${hotel.id}">Preis eintragen</button></div>`;
  $('[data-modal-price]')?.addEventListener('click', () => { $('#detailDialog').close(); openPriceDialog(id); });
  $('#detailDialog').showModal();
}

function openPriceDialog(id='') {
  if (id) $('#priceHotel').value = id;
  else $('#priceHotel').selectedIndex = 0;
  $('#priceDialog').showModal();
}

function savePrice(event) {
  event.preventDefault();
  if (!$('#priceForm').reportValidity()) return;
  const id = $('#priceHotel').value;
  const entry = { id: crypto.randomUUID(), source:$('#priceSource').value, amount:Number($('#priceAmount').value), outbound:$('#outbound').value, inbound:$('#inbound').value, transfer:$('#transfer').value.trim(), operator:$('#operator').value.trim(), savedAt:new Date().toISOString() };
  state.prices[id] = [...(state.prices[id] || []), entry];
  persist(); $('#priceDialog').close(); $('#priceForm').reset(); renderHotels();
  const isVisible = rankHotels(hotels(), state.weights, query()).find(hotel => hotel.id === id)?.price;
  toast(isVisible ? 'Preisstand wurde lokal gespeichert.' : 'Preisstand gespeichert – die aktiven Suchfilter blenden ihn aus.');
}

function toast(message) { $('#toast').textContent=message; $('#toast').classList.add('show'); setTimeout(()=>$('#toast').classList.remove('show'),2800); }

$('#priceHotel').innerHTML = seedHotels.map(h=>`<option value="${h.id}">${h.name}</option>`).join('');
renderWeights(); renderHotels();
document.querySelectorAll('.filters input, .filters select, #sort').forEach(el => el.addEventListener('input', renderHotels));
$('#openPricesButton').addEventListener('click',()=>openPriceDialog());
$('#priceForm').addEventListener('submit',savePrice);
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('#resetButton').addEventListener('click',()=>{ if(confirm('Gewichtungen und gespeicherte Preise wirklich zurücksetzen?')) { localStorage.removeItem(STORAGE_KEY); location.reload(); }});
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); }));
if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));

