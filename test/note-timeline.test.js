import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../note-timeline-core.js';
const core=globalThis.NoteTimelineCore;
const rows=records=>records.map(r=>({key:r.id,record:r,field:'text',value:r.text}));
const at='2026-11-24T10:00:00.000Z',later='2026-11-24T11:00:00.000Z';
test('old notes retain unknown provenance; typing updates one draft and timestamps stay stable',()=>{
 const records=[{id:'a',text:'Bisherig'}],tracker=core.tracker(records,rows),session={};
 records[0].text='Bisherig\nErgänzung';tracker.stage(records,session,at).commit();assert.deepEqual(core.entries(records[0],'text').map(e=>[e.text,e.createdAt]),[['Bisherig',null],['Ergänzung',at]]);
 const id=core.entries(records[0],'text')[1].id;records[0].text='Bisherig\nErgänzung weiter';tracker.stage(records,session,later).commit();const entries=core.entries(records[0],'text');assert.equal(entries.length,2);assert.equal(entries[1].id,id);assert.equal(entries[1].createdAt,at);assert.equal(entries[1].text,'Ergänzung weiter');
});
test('later edits, explicit additions and blank drafts cannot erase earlier entries',()=>{
 const records=[{id:'a',text:''}],tracker=core.tracker(records,rows);records[0].text='A';tracker.stage(records,{},at).commit();const initial=structuredClone(core.entries(records[0],'text'));
 records[0].text='B';tracker.stage(records,{compose:true},later).commit();assert.deepEqual(core.entries(records[0],'text')[0],initial[0]);assert.equal(core.entries(records[0],'text')[1].kind,'addition');records[0].text='';tracker.stage(records,{},later).commit();assert.deepEqual(core.entries(records[0],'text').map(e=>e.text),['A','B']);
});
test('failed writes roll back metadata and retries retain the same entry timestamp',()=>{
 const records=[{id:'a',text:'A'}],tracker=core.tracker(records,rows),session={};records[0].text='B';const staged=tracker.stage(records,session,at);staged.rollback();assert.equal(records[0]._noteTimeline,undefined);tracker.stage(records,session,later).commit();assert.equal(core.entries(records[0],'text')[1].createdAt,at);
});
test('restore retains exact history and malformed dates or duplicate IDs are rejected',()=>{
 const records=[{id:'a',text:''}],tracker=core.tracker(records,rows);records[0].text='A';tracker.stage(records,{},at).commit();const snapshot=structuredClone(records);core.validate(snapshot[0]);tracker.reset(snapshot);tracker.stage(snapshot,{},later).commit();assert.deepEqual(snapshot,records);snapshot[0]._noteTimeline.text.entries[0].createdAt='invalid';assert.throws(()=>core.validate(snapshot[0]));
});
test('changes made by older clients stay visible with unknown dates',()=>{
 const records=[{id:'a',text:'A'}],tracker=core.tracker(records,rows);records[0].text='AB';tracker.stage(records,{},at).commit();records[0].text='ABC';assert.equal(core.entries(records[0],'text').at(-1).createdAt,null);tracker.reset(records);records[0].text='ABCD';tracker.stage(records,{},later).commit();core.validate(records[0]);assert.deepEqual(core.entries(records[0],'text').map(e=>e.text),['A','B','C','D']);
});
