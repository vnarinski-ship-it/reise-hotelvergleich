/* Structured note history; raw note fields stay compatible with existing exports. */
(() => {
'use strict';
const META='_noteTimeline';
function entries(record,field,value=record?.[field]||''){
 const stored=record?.[META]?.[field];
 if(!stored||!Array.isArray(stored.entries)||typeof stored.value!=='string')return value.trim()?[{id:'legacy',text:value,createdAt:null,kind:'legacy'}]:[];
 const list=stored.entries.map(e=>({...e}));
 if(stored.value!==value&&value.trim())list.push({id:'untracked-'+(list.filter(e=>e.id.startsWith('untracked-')).length+1),text:value.startsWith(stored.value)?value.slice(stored.value.length):value,createdAt:null,kind:'legacy'});
 return list.filter(e=>e.text.trim());
}
function tracker(source,collect){
 let baseline=new Map(),active=new Map();
 function reset(next){baseline=new Map(collect(next).map(row=>[row.key,row.value]));active.clear();}
 reset(source);
 function stage(next,session,at=new Date().toISOString()){
  const patches=new Map();
  for(const row of collect(next)){
   const before=baseline.get(row.key)||'';if(before===row.value)continue;
   let edit=active.get(row.key);
   if(!edit||edit.session!==session){edit={session,base:session?.compose?'':before,id:crypto.randomUUID(),createdAt:null};active.set(row.key,edit);}
   let list=entries(row.record,row.field,before).filter(e=>e.id!==edit.id);
   const addition=row.value===edit.base?'':edit.base&&row.value.startsWith(edit.base)?row.value.slice(edit.base.length).replace(/^[\r\n]+/,''):row.value;
   if(addition.trim()){if(!edit.createdAt)edit.createdAt=at;list.push({id:edit.id,text:addition,createdAt:edit.createdAt,kind:edit.base&&!row.value.startsWith(edit.base)?'revision':'addition'});}
   if(!patches.has(row.record))patches.set(row.record,row.record[META]);
   row.record[META]={...row.record[META],[row.field]:{value:row.value,entries:list}};
  }
  return {commit(){baseline=new Map(collect(next).map(row=>[row.key,row.value]));},rollback(){for(const [record,old]of patches){if(old===undefined)delete record[META];else record[META]=old;}}};
 }
 return {stage,reset};
}
function validate(record){if(record?.[META]===undefined)return;if(!record[META]||typeof record[META]!=='object'||Array.isArray(record[META]))throw new Error('Ungültiger Notizverlauf');
 for(const history of Object.values(record[META])){if(!history||typeof history.value!=='string'||!Array.isArray(history.entries))throw new Error('Ungültiger Notizverlauf');const ids=new Set();for(const entry of history.entries){if(!entry||typeof entry.id!=='string'||!entry.id||ids.has(entry.id)||typeof entry.text!=='string'||!(entry.createdAt===null||(typeof entry.createdAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(entry.createdAt)&&Number.isFinite(Date.parse(entry.createdAt)))))throw new Error('Ungültiger Notizeintrag');ids.add(entry.id);}}
}
globalThis.NoteTimelineCore={entries,tracker,validate};
})();
