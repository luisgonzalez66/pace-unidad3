'use strict';
/* PACE UACh · SCORM 1.2 modular (v7)
 * Navegación: Inicio > Unidad > Estación.
 * Datos generados desde archivos independientes unidad_XX.json.
 * Porcentaje = hitos COMPLETADOS, no dominio matemático.
 * Estado por identificador estable de estación, compatible con avances v4/v5.
 */
// Contenido generado desde unidades/unidad_XX.json. Evitar modificar este motor.
const BUILD=(typeof PACE_BUILD!=='undefined'&&PACE_BUILD)?PACE_BUILD:{scope:'curso_completo',showWeek4:true};
const KEY=BUILD.scope==='curso_completo'?'pace_uach_modular_v7':'pace_uach_modular_v7_'+String(BUILD.scope||'preview').replace(/[^a-zA-Z0-9_-]/g,'_');
const PREVIOUS_KEY='pace_uach_modular_v6';
const LEGACY_KEY='pace_uach_scorm_v4_demo';
// SORTEO (draw): practice = banco; el estudiante ve solo `draw` preguntas, elegidas con su semilla personal.
const drawCount=s=>{const n=(s.practice||[]).length,d=s.draw;return Number.isInteger(d)&&d>=1&&d<n?d:n;};
const checkBank=s=>[s.check].concat(Array.isArray(s.checks)?s.checks:[]);
const checkCount=s=>{const n=checkBank(s).length,d=s.drawCheck;return Number.isInteger(d)&&d>=1&&d<n?d:n;};
const milestoneCount=s=>1+drawCount(s)+checkCount(s);
const hasDraw=s=>drawCount(s)<(s.practice||[]).length||checkCount(s)<checkBank(s).length;
function hashStr(t){let h=2166136261;for(const c of String(t)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const roundOf=s=>Object.hasOwn(state.rd,s.id)?state.rd[s.id]:0;
function windowIdx(s,n,d,salt,round){
 const idx=[...Array(n).keys()];
 if(d>=n)return idx;
 if(Number.isInteger(state.seed)){const r=rng((state.seed^hashStr(s.id+salt))>>>0);for(let i=n-1;i>0;i--){const j=Math.floor(r()*(i+1));[idx[i],idx[j]]=[idx[j],idx[i]];}}
 const start=(round*d)%n,out=[];for(let k=0;k<d;k++)out.push(idx[(start+k)%n]);
 return out.sort((x,y)=>x-y);}
const drawnIndices=s=>windowIdx(s,s.practice.length,drawCount(s),'',roundOf(s));
const drawnChecks=s=>windowIdx(s,checkBank(s).length,checkCount(s),'#c',roundOf(s));
function ensureSeed(){if(!Number.isInteger(state.seed)&&STATIONS.some(hasDraw))state.seed=Math.floor(Math.random()*1073741824);}
const COUNT=STATIONS.reduce((v,s)=>v+milestoneCount(s),0);
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rich=v=>PACEText.html(v);
function typesetMath(el){if(window.MathJax&&MathJax.typesetPromise)MathJax.typesetPromise([el]).catch(()=>{});}
function renderMedia(items){return items.map(m=>{const cap=m.caption?'<figcaption>'+esc(m.caption)+'</figcaption>':'';if(m.type==='image')return '<figure class="media-box"><img loading="lazy" src="'+esc(m.src)+'" alt="'+esc(m.caption||'Imagen del contenido')+'">'+cap+'</figure>';if(m.type==='video_file')return '<figure class="media-box"><video controls preload="metadata" src="'+esc(m.src)+'"></video>'+cap+'</figure>';if(m.type==='pdf')return '<div class="media-link">📄 <a href="'+esc(m.src)+'" target="_blank" rel="noopener noreferrer">Abrir PDF</a> '+esc(m.caption||'')+'</div>';if(m.type==='video_url')return '<div class="media-link">▶ <a href="'+esc(m.src)+'" target="_blank" rel="noopener noreferrer">Ver video</a> '+esc(m.caption||'')+'</div>';return '';}).join('');}
const emptyState=()=>({v:7,p:Object.create(null),last:null,tab:'learn',seed:null,rd:Object.create(null),dn:Object.create(null)});
let state=emptyState();
let api=null,connected=false,mode='local',writeBlocked=false,restored=false,closed=false;
let view='home',selectedUnit=0,stationIndex=0,activeTab='learn',activeGroup=-1;
const ownStations=u=>STATIONS.map((s,i)=>({s,i})).filter(({s})=>s.unit===u);
const stationBits=i=>{const size=milestoneCount(STATIONS[i]),id=STATIONS[i]?.id;return (Object.hasOwn(state.p,id)?state.p[id]:'').padEnd(size,'0').slice(0,size);};
const rawDone=i=>[...stationBits(i)].filter(c=>c==='1').length;
const stationDone=i=>Object.hasOwn(state.dn,STATIONS[i].id)?milestoneCount(STATIONS[i]):rawDone(i);
const percent=(done,total)=>!total?0:done===total?100:Math.min(99,Math.round(100*done/total));
const stationPercent=i=>percent(stationDone(i),milestoneCount(STATIONS[i]));
const stepDone=(i,j)=>stationBits(i)[j]==='1';
const doneCount=()=>STATIONS.reduce((n,s,i)=>n+stationDone(i),0);
const overall=()=>percent(doneCount(),COUNT);
const unitPct=u=>{const a=ownStations(u);return percent(a.reduce((n,x)=>n+stationDone(x.i),0),a.reduce((n,x)=>n+milestoneCount(x.s),0));};
const unitDone=u=>ownStations(u).filter(x=>stationDone(x.i)===milestoneCount(x.s)).length;
const completedStations=()=>STATIONS.filter((s,i)=>stationDone(i)===milestoneCount(s)).length;
const completed=()=>COUNT>0&&doneCount()===COUNT;
const progressClass=p=>p===100?'completed':p>0?'progress':'pending';
function updateStep(i,j){const id=STATIONS[i].id;let bits=stationBits(i);state.p[id]=bits.slice(0,j)+'1'+bits.slice(j+1);}
function checkState(d){return !!(d&&[6,7].includes(d.v)&&d.p&&typeof d.p==='object'&&!Array.isArray(d.p)&&Object.entries(d.p).every(([k,v])=>typeof k==='string'&&/^[01]{2,80}$/.test(v))&&(d.last===null||typeof d.last==='string')&&['learn','practice','check'].includes(d.tab)&&(d.seed===undefined||d.seed===null||(Number.isInteger(d.seed)&&d.seed>=0&&d.seed<1073741824))&&(d.rd===undefined||(d.rd&&typeof d.rd==='object'&&Object.values(d.rd).every(x=>Number.isInteger(x)&&x>=0&&x<1000)))&&(d.dn===undefined||(d.dn&&typeof d.dn==='object'&&Object.values(d.dn).every(x=>x===1))));}
function oldMarksValid(m){return Array.isArray(m)&&m.length===12&&m.every(r=>Array.isArray(r)&&r.length===4&&r.every(x=>typeof x==='boolean'));}
function migrateBits(m,last,tab){
 const n=emptyState();for(let i=0;i<Math.min(12,LEGACY_STATION_IDS.length);i++){
  if(m.slice(i*4,i*4+4).length!==4)continue;
  if(STATIONS.some(s=>s.id===LEGACY_STATION_IDS[i]))n.p[LEGACY_STATION_IDS[i]]=m.slice(i*4,i*4+4);
 }
 if(Number.isInteger(last)&&last>=0&&last<LEGACY_STATION_IDS.length&&STATIONS.some(s=>s.id===LEGACY_STATION_IDS[last]))n.last=LEGACY_STATION_IDS[last];
 n.tab=['learn','practice','check'].includes(tab)?tab:'learn';return n;
}
// P8 conserva IDs completos. 80 filas de 44+1+4 caracteres y separadores,
// más cabecera de 50: como máximo 4049 bytes ASCII (<4096 SCORM 1.2).
const BITS64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function serializeState(){
 const rows=STATIONS.filter(s=>Object.hasOwn(state.p,s.id)||Object.hasOwn(state.dn,s.id)).map(s=>{
  const bits=(Object.hasOwn(state.p,s.id)?state.p[s.id]:'').padEnd(milestoneCount(s),'0').slice(0,milestoneCount(s));let packed='';
  for(let i=0;i<bits.length;i+=6)packed+=BITS64[parseInt(bits.slice(i,i+6).padEnd(6,'0'),2)];
  return s.id+':'+packed+(roundOf(s)?':r'+roundOf(s):'')+(Object.hasOwn(state.dn,s.id)?':d':'');
 });
 const last=STATIONS.some(s=>s.id===state.last)?state.last:'';
 return 'P8|'+last+'|'+['learn','practice','check'].indexOf(state.tab)+(Number.isInteger(state.seed)?'|'+state.seed.toString(36):'')+'\n'+rows.join('\n');
}
function restoreCompact(raw){
 const lines=raw.split('\n'),head=/^P8\|([A-Za-z0-9_-]{2,44}|)\|([012])(?:\|([0-9a-z]{1,7}))?$/.exec(lines.shift());
 if(!head||lines.length>PACEContract.maxCourseStations)return null;
 const n=emptyState();n.last=head[1]||null;n.tab=['learn','practice','check'][+head[2]];if(head[3]){const sd=parseInt(head[3],36);if(sd>=0&&sd<1073741824)n.seed=sd;}
 for(const line of lines){if(!line)continue;const row=/^([A-Za-z0-9_-]{2,44}):([A-Za-z0-9_-]{1,4})(?::r([0-9]{1,3}))?(:d)?$/.exec(line);if(!row||Object.hasOwn(n.p,row[1]))return null;
  n.p[row[1]]=[...row[2]].map(c=>BITS64.indexOf(c).toString(2).padStart(6,'0')).join('');if(row[3])n.rd[row[1]]=+row[3];if(row[4])n.dn[row[1]]=1;
 }return {val:n,migrated:false};
}
function restore(raw){
 if(typeof raw==='string'&&raw.startsWith('P8|'))return restoreCompact(raw);
 try{
 const d=JSON.parse(raw);
 if(checkState(d))return {val:{...d,p:Object.assign(Object.create(null),d.p),rd:Object.assign(Object.create(null),d.rd||{}),dn:Object.assign(Object.create(null),d.dn||{}),seed:Number.isInteger(d.seed)?d.seed:null,v:7},migrated:d.v!==7};
 if(d.v===4&&typeof d.m==='string'&&/^[01]{48}$/.test(d.m))return {val:migrateBits(d.m,d.last,d.tab),migrated:true};
 if(d.version===3&&oldMarksValid(d.marks))return {val:migrateBits(d.marks.flat().map(x=>x?'1':'0').join(''),-1,'learn'),migrated:true};
 if([1,2].includes(d.version)&&Array.isArray(d.answers)&&d.answers.length===3){
  const n=emptyState();for(let i=0;i<3;i++)for(let j=0;j<2;j++)if(d.answers[i]?.[j]){
   let id=LEGACY_STATION_IDS[i],bits=n.p[id]||'0000',idx=j+1;n.p[id]=bits.slice(0,idx)+'1'+bits.slice(idx+1);
  }return {val:n,migrated:true};
 }
 }catch(e){}
 return null;
}
function findApi(w){let p=w;for(let n=0;n<15;n++){try{if(p.API&&typeof p.API.LMSInitialize==='function')return p.API;}catch(e){}try{if(p.parent===p)break;p=p.parent;}catch(e){break;}}return null;}
function locateApi(){let a=findApi(window);if(a)return a;try{if(window.opener)a=findApi(window.opener);}catch(e){}return a||null;}
function get(k){try{return String(api.LMSGetValue(k)||'');}catch(e){return '';}}
function set(k,v){try{return String(api.LMSSetValue(k,String(v))).toLowerCase()==='true';}catch(e){return false;}}
function commit(){try{return String(api.LMSCommit('')).toLowerCase()==='true';}catch(e){return false;}}
function lastError(){try{return String(api.LMSGetLastError());}catch(e){return 'desconocido';}}
function sync(msg,kind){$('syncIndicator').textContent=msg;$('syncIndicator').className='sync-chip '+kind;}
function tracking(msg){$('trackingDetails').textContent=msg;}
function init(){
 api=locateApi();
 if(api){
  try{connected=String(api.LMSInitialize('')).toLowerCase()==='true';}catch(e){connected=false;}
  if(!connected){mode='error';sync('⚠ SCORM no pudo iniciar','error');tracking('Sin conexión válida: avance deshabilitado');return;}
  mode='scorm';let raw=get('cmi.suspend_data'),previousScore=get('cmi.core.score.raw');
  if(raw){let result=restore(raw);if(!result){writeBlocked=true;sync('⚠ Datos no reconocidos','error');tracking('Datos previos conservados; no se sobrescriben');return;}state=result.val;restored=true;}
  else if(previousScore!==''&&Number.isFinite(Number(previousScore))&&Number(previousScore)>0){writeBlocked=true;sync('⚠ Faltan datos detallados','error');tracking('Hay calificación previa sin detalle; escritura bloqueada');return;}
  ensureSeed();save();return;
 }
 mode='local';
 try{
  const probe='pace_storage_test';localStorage.setItem(probe,'1');localStorage.removeItem(probe);
  const raw=localStorage.getItem(KEY)||(BUILD.scope==='curso_completo'?(localStorage.getItem(PREVIOUS_KEY)||localStorage.getItem(LEGACY_KEY)):null);
  if(raw){const res=restore(raw);if(res){state=res.val;restored=true;}}
 }catch(e){mode='preview';}
ensureSeed();
 if(mode==='preview'){
  sync('Vista previa · sin guardado permanente','local');
  tracking('Vista previa: el progreso es temporal');
 }else{
  sync('Vista local · sin SiveducMD','local');
  tracking(restored?'Progreso de demostración recuperado del navegador':'Vista local: avance guardado solo en este navegador');
 }
}
function save(){
 if(mode==='error'||writeBlocked)return false;
 if(mode==='scorm'&&connected){
  let score=overall();
  const encoded=serializeState();
  if(new TextEncoder().encode(encoded).length>PACEContract.maxSuspendBytes){sync('⚠ Límite de progreso SCORM','error');tracking('El progreso supera los 4096 bytes de cmi.suspend_data');return false;}
  const a=[set('cmi.suspend_data',encoded),set('cmi.core.score.min','0'),set('cmi.core.score.max','100'),set('cmi.core.score.raw',score),set('cmi.core.lesson_status',completed()?'completed':'incomplete'),set('cmi.core.exit','suspend')];
  let ok=commit();if(a.some(x=>!x)||!ok){sync('⚠ Guardado no confirmado','error');tracking('SCORM: error '+lastError());return false;}
  sync('✓ Progreso guardado en SiveducMD','online');tracking('Moodle: '+get('cmi.core.score.raw')+'/100 · '+get('cmi.core.lesson_status')+(restored?' · sesión recuperada':''));return true;
 }
 if(mode==='preview')return true;
 try{localStorage.setItem(KEY,JSON.stringify(state));return true;}
 catch(e){mode='preview';sync('Vista previa · avance temporal','local');tracking('El navegador no permite guardar en esta vista previa');return true;}
}
function canChange(){return mode==='local'||mode==='preview'||(mode==='scorm'&&connected&&!writeBlocked);}
function shutdown(){if(closed||!connected)return;save();try{api.LMSFinish('');}catch(e){}closed=true;connected=false;}
function showOnly(next){for(let id of ['homeView','mapView','stationView'])$(id).classList.toggle('hidden',id!==next+'View');view=next;window.scrollTo({top:0,behavior:'instant'});}
function breadcrumbs(){
 let segments=[{label:'Inicio',action:()=>openHome()}];
 if(view!=='home')segments.push({label:'Unidad '+UNITS[selectedUnit].roman,action:()=>openMap(selectedUnit)});
 if(view==='station')segments.push({label:STATIONS[stationIndex].title});
 $('breadcrumbs').innerHTML=segments.map((s,i)=>i===segments.length-1?`<span class="current">${esc(s.label)}</span>`:`<button type="button" data-bread="${i}">${esc(s.label)}</button><span aria-hidden="true">›</span>`).join('');
 $('breadcrumbs').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>segments[Number(b.dataset.bread)].action()));
}
function openHome(){showOnly('home');renderHome();breadcrumbs();}
function unitStatus(){let p=overall();return p===100?'completed':p>0?'progress':'available';}
function renderHome(){
 const p=overall();$('homePct').textContent=p+'%';$('homeFill').style.width=p+'%';
 $('homeCount').textContent=completedStations()+' / '+STATIONS.length+' estaciones completadas';
 $('homeDisc').style.setProperty('--pct',p+'%');
 const last=state.last?STATIONS.findIndex(s=>s.id===state.last):-1;
 const first=STATIONS.findIndex((s,i)=>stationDone(i)<milestoneCount(s));
 const chosen=last>=0?last:Math.max(0,first);
 $('resumeTitle').textContent=STATIONS[chosen]?.title||'Por definir';
 $('resumeDescription').textContent=STATIONS[chosen]?'Unidad '+UNITS[STATIONS[chosen].unit].roman+' · '+stationPercent(chosen)+'% de avance':'';
 $('resumeBtn').disabled=!STATIONS.length;
 $('resumeBtn').onclick=()=>{if(STATIONS.length)openStation(chosen,state.last===STATIONS[chosen].id?state.tab:'learn');};
 $('unitsGrid').innerHTML=UNITS.map((u,i)=>{
  const avail=ownStations(i).length>0;
  const pct=unitPct(i);const status=!avail?'upcoming':pct===100?'completed':pct>0?'progress':'available';
  const note=avail?(pct===100?'Completada':pct>0?pct+'% de avance':'Lista para explorar'):'En preparación';
  const signs=UNITS.map(u=>u.icon||'◇');
  return `<button class="unit-card theme-${i} ${status}" type="button" data-unit="${i}" aria-label="Unidad ${u.roman}, ${u.title}. ${note}. Abrir mapa">
   <div class="unit-top"><span class="unit-number">UNIDAD ${u.roman}</span><span class="unit-bubble" aria-hidden="true">${signs[i]}</span></div>
   <div class="unit-main"><h3>${esc(u.title)}</h3><p>${avail?ownStations(i).length+' estaciones · '+Math.round(ownStations(i).reduce((n,x)=>n+(x.s.minutes||0),0)/60*10)/10+' h previstas':'Contenido por definir'}</p></div>
   <div class="unit-bottom"><span class="unit-status">${esc(note)}</span><strong>Ver mapa <span aria-hidden="true">↗</span></strong></div>
  </button>`;
 }).join('')+(BUILD.showWeek4?'<div class="unit-card theme-3 upcoming week4" aria-label="Semana 4 pendiente de definición"><div class="unit-top"><span class="unit-number">SEMANA 4</span><span class="unit-bubble">✦</span></div><div class="unit-main"><h3>Etapa final</h3><p>Por definir · cierre o refuerzo</p></div><div class="unit-bottom"><span class="unit-status">Sin actividades aún</span></div></div>':'');
 $('unitsGrid').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>openMap(Number(b.dataset.unit))));
}
function openMap(unit,group){
 if(selectedUnit!==unit)activeGroup=-1;
 selectedUnit=unit;
 if(Number.isInteger(group)&&group>=0&&group<UNITS[unit].groups.length)activeGroup=group;
 showOnly('map');renderMap();breadcrumbs();
}
function renderMap(){
 const u=UNITS[selectedUnit];const groups=u.groups||[];const unitItems=ownStations(selectedUnit);$('mapUnitLabel').textContent='UNIDAD '+u.roman;
 $('mapTitle').innerHTML=esc(u.title)+(u.ready?'<span>.</span>':'');
 $('mapEyebrow').textContent=u.ready?'UNIDAD '+u.roman+' · MAPA DE APRENDIZAJE':'UNIDAD '+u.roman+' · EN PREPARACIÓN';
 $('mapSubtitle').textContent=u.ready?'Elige una estación.':'Contenidos pendientes de planificación.';
 $('mapSummary').classList.toggle('hidden',!u.ready);
 $('mapLegend').classList.toggle('hidden',!u.ready);
 $('mapFinish').classList.toggle('hidden',!u.ready);
 document.querySelector('.map-section-label').classList.toggle('hidden',!u.ready);
 $('mapGroupTabs').classList.toggle('hidden',!u.ready);
 if(!u.ready){
  $('route').className='route placeholder-route';
  $('route').innerHTML='<div class="soon-panel"><span class="soon-symbol" aria-hidden="true">✳</span><h2>Próximamente</h2><p>La unidad se incorporará cuando su temario esté definido.</p><span>Vuelve a las unidades para continuar.</span></div>';
  return;
 }
 const p=unitPct(selectedUnit);$('mapPercent').textContent=p+'%';$('mapCount').textContent=unitDone(selectedUnit)+' de '+unitItems.length+' completadas';$('mapFill').style.width=p+'%';
 document.querySelector('.map-section-count').textContent=groups.length+' bloques · '+unitItems.length+' estaciones';
 $('mapGroupTabs').innerHTML=`<button type="button" class="group-tab ${activeGroup===-1?'active':''}" data-group="-1" aria-pressed="${activeGroup===-1}"><span class="group-name">Mapa completo</span><span class="group-count">${unitItems.length}</span></button>`+groups.map((group,g)=>{
   const indices=unitItems.filter(x=>x.s.group===g);
   const count=indices.filter(x=>stationDone(x.i)===milestoneCount(x.s)).length;
   const active=activeGroup===g;
   return `<button type="button" class="group-tab ${active?'active':''} group-theme-${g}" data-group="${g}" aria-pressed="${active}"><span class="group-sequence">${String(g+1).padStart(2,'0')}</span><span class="group-name">${esc(group.title)}</span><span class="group-count">${count}/${indices.length}</span></button>`;
 }).join('');
 $('mapGroupTabs').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
  activeGroup=Number(b.dataset.group);renderMap();
 }));
 const items=unitItems.filter(x=>activeGroup<0||x.s.group===activeGroup);
 if(activeGroup===-1){
   const rows=items.map(({s,i},k)=>{const val=stationPercent(i),cls=progressClass(val),g=groups[s.group]||{title:''};
     return `<div class="canva-map-row ${k%2?'right':'left'}"><div class="canva-center-dot ${cls}" aria-hidden="true"></div><button type="button" class="canva-map-card ${cls}" data-index="${i}" aria-label="${esc(s.title)}. ${val}% completado. Entrar"><span class="canva-number">${String(k+1).padStart(2,'0')}</span><span class="canva-copy"><small>BLOQUE ${String(s.group+1).padStart(2,'0')} · ${esc(g.title)}</small><strong>${esc(s.title)}</strong><span>${esc(s.subtitle)}</span><em>Explorar →</em></span><span class="canva-progress" style="--value:${val}%"><b>${val===100?'✓':val+'%'}</b></span></button></div>`;}).join('');
   $('route').className='route canva-map';$('route').innerHTML=rows||'<p class="hint">Esta unidad todavía no contiene estaciones.</p>';
   $('route').querySelectorAll('button[data-index]').forEach(b=>b.addEventListener('click',()=>openStation(Number(b.dataset.index))));
   $('finishCounter').textContent=unitDone(selectedUnit)+'/'+unitItems.length;
   $('finishTitle').textContent=p===100?'¡Unidad completada!':'Desafío integrador';
   $('finishDescription').textContent='Se incorporará con los contenidos definitivos.';
   return;
 }
 const group=groups[activeGroup]||{title:'Contenido',subtitle:''};
 const groupNum=String(activeGroup+1).padStart(2,'0');
 let html=`<div class="current-group group-theme-${activeGroup}"><div class="group-heading"><span class="group-square">${groupNum}</span><div><span class="eyebrow">BLOQUE ${groupNum}</span><h2>${esc(group.title)}</h2></div><span class="group-ratio">${items.filter(x=>stationDone(x.i)===milestoneCount(x.s)).length}/${items.length} completas</span></div><div class="station-list">`;
 for(const {s,i} of items){
  const pct=stationPercent(i),cls=progressClass(pct),circ=2*Math.PI*20;
  html+=`<button type="button" class="route-card ${cls}" data-index="${i}" aria-label="${esc(s.title)}. ${pct} por ciento. Entrar a la estación">
    <span class="route-marker" aria-hidden="true"><b>${String(i+1).padStart(2,'0')}</b></span>
    <span class="route-copy"><strong>${esc(s.title)}</strong><small>${esc(s.subtitle)}</small></span>
    <span class="route-status"><span class="mini-ring"><svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="20" fill="none" stroke="#dce5ea" stroke-width="5"/><circle class="arc" cx="26" cy="26" r="20" fill="none" stroke-width="5" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ*(1-pct/100)}"/></svg><b>${pct===100?'✓':pct+'%'}</b></span></span>
    <span class="route-arrow" aria-hidden="true">↗</span>
  </button>`;
 }
 html+='</div>';
 const hints=u.hints||[];
 if(hints[activeGroup])html+=`<div class="concept-bridge"><span aria-hidden="true">↗</span>${esc(hints[activeGroup])}</div>`;
 html+='</div>';
 $('route').className='route';$('route').innerHTML=html;
 $('route').querySelectorAll('button[data-index]').forEach(b=>b.addEventListener('click',()=>openStation(Number(b.dataset.index))));
 $('finishCounter').textContent=unitDone(selectedUnit)+'/'+unitItems.length;
 $('finishTitle').textContent=p===100?'¡Unidad completada!':'Desafío integrador';
 $('finishDescription').textContent='Se incorporará con los contenidos definitivos.';
}
function openStation(i,tab='learn'){
 selectedUnit=STATIONS[i].unit;stationIndex=i;activeTab=['learn','practice','check'].includes(tab)?tab:'learn';
 state.last=STATIONS[i].id;state.tab=activeTab;save();
 showOnly('station');renderStation();breadcrumbs();
}
function selectTab(tab){activeTab=tab;state.tab=tab;save();renderStation();}
function renderStation(){
 let s=STATIONS[stationIndex],p=stationPercent(stationIndex);
 $('stationNo').textContent=String(stationIndex+1).padStart(2,'0');$('stationTitle').textContent=s.title;$('stationSub').textContent=s.subtitle;
 $('stationBlock').textContent='BLOQUE '+String(s.group+1).padStart(2,'0')+' · '+(UNITS[s.unit].groups[s.group]?.title||'');
 $('stationPct').textContent=p+'%';$('stationPct').className='station-pct '+progressClass(p);
 $('stationCount').textContent=Object.hasOwn(state.dn,s.id)?'Repaso · ronda '+(roundOf(s)+1)+': '+rawDone(stationIndex)+' de '+milestoneCount(s)+' actividades (tu avance ya está completo)':stationDone(stationIndex)+' de '+milestoneCount(s)+' actividades completadas';$('stationFill').style.width=p+'%';
 $('learnTick').textContent=stepDone(stationIndex,0)?'✓':'';
 $('practiceTick').textContent=Array.from({length:drawCount(s)}).every((q,j)=>stepDone(stationIndex,1+j))?'✓':'';
 $('checkTick').textContent=Array.from({length:checkCount(s)}).every((q,j)=>stepDone(stationIndex,1+drawCount(s)+j))?'✓':'';
 $('stationTabs').querySelectorAll('button').forEach(b=>{let active=b.dataset.tab===activeTab;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});
 $('stationFeedback').textContent='';
 if(activeTab==='learn'){
  const done=stepDone(stationIndex,0);
  $('stationContent').innerHTML=`<span class="eyebrow">01 / APRENDE · LECTURA BREVE</span><h2>La idea esencial</h2><p class="math-content">${rich(s.concept)}</p><div class="example"><span>EJEMPLO</span><p class="math-content">${rich(s.example)}</p></div>${renderMedia(s.media||[])}<div class="learn-finish"><button class="primary-btn" type="button" id="learnDone" ${done?'disabled':''}>${done?'✓ Explicación revisada':'Marcar como revisado'}</button><small>Actividad de muestra</small></div>`;
  if(!done)$('learnDone').addEventListener('click',()=>mark(0));
 }else if(activeTab==='practice'){
  $('stationContent').innerHTML=`<span class="eyebrow">02 / PRACTICA</span><h2>Resuelve los ejercicios</h2><p>Elige una respuesta. Puedes volver a intentarlo.</p>${drawnIndices(s).map((bi,j)=>renderQuiz(s.practice[bi],j+1,'EJERCICIO '+(j+1))).join('')}`;
 }else{
  $('stationContent').innerHTML=`<span class="eyebrow">03 / APLICA · CIENCIAS</span><h2>Aplica lo aprendido</h2><p>Resuelve una situación en contexto.</p>${drawnChecks(s).map((bi,j)=>renderQuiz(checkBank(s)[bi],1+drawCount(s)+j,checkCount(s)>1?'DESAFÍO '+(j+1):'DESAFÍO')).join('')}`;
 }
 if(activeTab!=='learn'&&canRedo(stationIndex)){$('stationContent').insertAdjacentHTML('beforeend','<div class="learn-finish"><button class="primary-btn" type="button" id="redoBtn">↻ Repetir con ejercicios nuevos</button><small>Te saldrán otros ejercicios del banco. Tu avance ya logrado se mantiene.</small></div>');$('redoBtn').addEventListener('click',redo);}
 $('stationContent').querySelectorAll('button[data-answer]').forEach(b=>b.addEventListener('click',()=>answer(b)));$('stationContent').querySelectorAll('.typed').forEach(bindTyped);typesetMath($('stationContent'));
}
function renderQuiz(q,step,label){let done=stepDone(stationIndex,step);if(q&&q.type==='input')return renderTyped(q,step,label,done);return `<article class="quiz ${done?'done':''}" data-step="${step}"><div class="quiz-head"><span>${esc(label)}</span><span>${done?'✓ Resuelto':'Por resolver'}</span></div><h3 class="math-content">${rich(q.q)}</h3><div class="choices">${q.options.map((o,k)=>`<button type="button" data-answer="${k}" class="${done&&k===q.correct?'correct':''}" ${done?'disabled':''}>${rich(o)}</button>`).join('')}</div><p class="feedback ${done?'correct':''}" role="status" aria-live="polite">${done?'✓ '+rich(q.why):''}</p></article>`;}
function questionAt(step){const st=STATIONS[stationIndex],dp=drawCount(st);return step>dp?checkBank(st)[drawnChecks(st)[step-dp-1]]:st.practice[drawnIndices(st)[step-1]];}
function renderTyped(q,step,label,done){
 const T=PACETyped;let body;
 if(done){let t='';try{t=T.answerTex(q);}catch(e){}body=`<div class="typed-done"><span>Respuesta:</span> <b class="math-content">${rich('\\('+t+'\\)')}</b></div>`;}
 else body=`<div class="typed" data-kind="${esc(q.kind)}"><div class="typed-row"><input class="typed-input" type="text" inputmode="none" enterkeyhint="done" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Escribe tu respuesta" placeholder="Escribe tu respuesta"><button type="button" class="primary-btn typed-check">Comprobar</button></div><div class="typed-preview math-content" aria-hidden="true"></div><div class="keypad" role="group" aria-label="Teclado matemático">${T.keys(q.kind).map(k=>`<button type="button" class="key${k[1]==='@del'?' key-del':''}" data-key="${esc(k[1]||k[0])}"${k[1]==='@del'?' aria-label="Borrar"':''}>${esc(k[0])}</button>`).join('')}</div><small class="typed-hint">${esc(T.hint(q))}</small></div>`;
 return `<article class="quiz typed-quiz ${done?'done':''}" data-step="${step}"><div class="quiz-head"><span>${esc(label)}</span><span>${done?'✓ Resuelto':'Por resolver'}</span></div><h3 class="math-content">${rich(q.q)}</h3>${body}<p class="feedback ${done?'correct':''}" role="status" aria-live="polite">${done?'✓ '+rich(q.why):''}</p></article>`;}
function typedInsert(inp,k){const a=inp.selectionStart==null?inp.value.length:inp.selectionStart,b=inp.selectionEnd==null?a:inp.selectionEnd;
 if(k==='@del'){if(a!==b)inp.setRangeText('',a,b,'end');else if(a>0)inp.setRangeText('',a-1,a,'end');}else inp.setRangeText(k,a,b,'end');}
function bindTyped(box){
 const art=box.closest('.quiz'),inp=box.querySelector('.typed-input'),prev=box.querySelector('.typed-preview'),pad=box.querySelector('.keypad'),kind=box.dataset.kind;let tm=null;
 const upd=()=>{clearTimeout(tm);tm=setTimeout(()=>{const t=PACETyped.previewTex(kind,inp.value);
  if(window.MathJax&&MathJax.typesetClear)MathJax.typesetClear([prev]);
  if(t===''||t===null){prev.textContent=t===null?inp.value:'';prev.classList.toggle('bad',t===null);}
  else{prev.classList.remove('bad');prev.innerHTML='\\('+t+'\\)';typesetMath(prev);}},120);};
 inp.addEventListener('input',upd);
 pad.addEventListener('mousedown',e=>e.preventDefault());
 pad.addEventListener('click',e=>{const b=e.target.closest('button[data-key]');if(!b)return;typedInsert(inp,b.dataset.key);inp.focus();upd();});
 box.querySelector('.typed-check').addEventListener('click',()=>checkTyped(art,inp));
 inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();checkTyped(art,inp);}});}
function checkTyped(art,inp){const step=Number(art.dataset.step);if(stepDone(stationIndex,step))return;
 const q=questionAt(step),r=PACETyped.check(q,inp.value);
 if(r.state==='ok'){mark(step);return;}
 const el=art.querySelector('.feedback');el.textContent=r.msg;el.className='feedback incorrect';inp.focus();}
function answer(b){const box=b.closest('.quiz');let step=Number(box.dataset.step);if(stepDone(stationIndex,step))return;
 const q=questionAt(step);
 if(Number(b.dataset.answer)===q.correct)mark(step);
 else{let el=box.querySelector('.feedback');el.textContent='Todavía no. Revisa el procedimiento e inténtalo nuevamente.';el.className='feedback incorrect';}
}
const canRedo=i=>hasDraw(STATIONS[i])&&rawDone(i)===milestoneCount(STATIONS[i]);
function redo(){const s=STATIONS[stationIndex];if(!canRedo(stationIndex))return;
 if(!canChange()){$('stationFeedback').textContent='La conexión SCORM no está disponible. No se puede iniciar otra ronda.';return;}
 const bits=stationBits(stationIndex);state.dn[s.id]=1;state.rd[s.id]=roundOf(s)+1;state.p[s.id]=bits[0]+'0'.repeat(milestoneCount(s)-1);
 activeTab='practice';state.tab='practice';const ok=save();renderStation();$('stationFeedback').textContent=ok?'↻ Nueva ronda con ejercicios distintos.':'⚠ No se confirmó el guardado del progreso.';window.scrollTo({top:0,behavior:'instant'});}
function mark(step){
 if(stepDone(stationIndex,step))return;
 if(!canChange()){$('stationFeedback').textContent='La conexión SCORM no está disponible. No se registra avance.';return;}
 updateStep(stationIndex,step);let ok=save();renderStation();$('stationFeedback').textContent=ok?'✓ Avance actualizado.':'⚠ No se confirmó el guardado del progreso.';
}
$('backHome').addEventListener('click',openHome);
$('bottomHome').addEventListener('click',openHome);
$('backMap').addEventListener('click',()=>openMap(STATIONS[stationIndex].unit));
$('returnToMap').addEventListener('click',()=>{save();openMap(STATIONS[stationIndex].unit);});
$('stationTabs').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.tab)));
window.addEventListener('pagehide',shutdown);window.addEventListener('beforeunload',shutdown);
init();openHome();
