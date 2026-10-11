import test from 'node:test';
import assert from 'node:assert/strict';
import { weightedRating, bestPrice, rankHotels } from '../core.js';

test('berechnet eine gewichtete Bewertung', () => {
  const ratings={reef:10,beach:5,wind:0,pool:0,couples:0,food:0,rooms:0,service:0,distance:0,allInclusive:0,value:0};
  assert.equal(weightedRating(ratings,{reef:3,beach:1}),8.75);
});

test('filtert und wählt den günstigsten Preisstand', () => {
  const prices=[
    {amount:2400,operator:'TUI',outbound:'2026-12-01T07:00',inbound:'2026-12-15T18:00'},
    {amount:2100,operator:'DERTOUR',outbound:'2026-12-01T05:00',inbound:'2026-12-15T20:00'}
  ];
  assert.equal(bestPrice(prices,{departureAfter:'06:00',duration:14}).amount,2400);
  assert.equal(bestPrice(prices,{operator:'dertour'}).amount,2100);
});

test('belohnt bei gleicher Hotelwertung den günstigeren Preis', () => {
  const ratings=Object.fromEntries(['reef','beach','wind','pool','couples','food','rooms','service','distance','allInclusive','value'].map(k=>[k,8]));
  const hotels=[{id:'a',ratings,prices:[{amount:2000,operator:'TUI',outbound:'2026-12-01T07:00',inbound:'2026-12-15T18:00'}]},{id:'b',ratings,prices:[{amount:3000,operator:'TUI',outbound:'2026-12-01T07:00',inbound:'2026-12-15T18:00'}]}];
  const ranked=rankHotels(hotels,{reef:5});
  assert.ok(ranked[0].score>ranked[1].score);
});
