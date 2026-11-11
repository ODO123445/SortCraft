// SortCraft — UI part 2: target portrait, appearance editor, companions + creature editor, read/edit/sign, audio settings
(function(){
'use strict';
const SC=globalThis.SC,UI=SC.UI;const $=id=>document.getElementById(id);
const G=()=>SC.G,game=()=>SC.game;
let h,makeWin,WINS;const esc=s=>UI.esc(s);

// ---------- target portrait (HUD) ----------
let tKey='';
UI.setTarget=function(e){const el=$('hudTarget');if(!el)return;if(!e){if(tKey){tKey='';el.classList.add('emptyT');el.style.visibility='hidden'}return}
 const D=e.custom||SC.monDef(e.def)||{s:'blob',c:['#888','#444'],n:'?'};const key=e.id+':'+e.hp+':'+e.mhp;if(key===tKey)return;tKey=key;el.style.visibility='visible';
 const tamable=!e.owner&&e.hp<=e.mhp*.5&&(G().rules.tameAll||!(SC.isHumanoidShape(D.s)||D.s==='wisp'||e.def>=1000||e.custom));
 const owner=e.owner?(e.owner===G().myId?'Your companion':'Companion of '+UI.esc((G().peers.get(e.owner)||{presence:{}}).presence.n||'someone')):`Level ${e.lvl}`;
 el.innerHTML=`<img src="${SC.portraitURL(D.s,D.c[0],D.c[1],112)}"><div><div class="tn">${esc(e.pname||D.n)}</div><div class="tl">${owner}${tamable?' · <b style="color:#8af0a0">[R] Tame</b>':''}</div><div class="vbar hp"><i style="width:${Math.max(0,e.hp/e.mhp*100)}%"></i><span>${e.hp} / ${e.mhp}</span></div></div>`;UI.poke('target')};

// ---------- shared pixel editor ----------
// opts: {size (paint grid), cell (px per pixel), base(draw fn on 32px canvas, given view), region:{x0,y0}, draft (cust), views:[...], onchange}
function pixelEditor(opts){const wrap=h('div','editor');const cv=h('canvas','paintcv');const N=opts.size,Z=opts.cell;cv.width=cv.height=N*Z;wrap.appendChild(cv);const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
 const st={view:opts.views[0],tool:'paint',col:'#c83a3a',down:false};
 const tools=h('div','tools');
 const draw=()=>{const t=document.createElement('canvas');t.width=t.height=32;const tg=t.getContext('2d',{willReadFrequently:true});opts.base(tg,st.view);
  if(opts.paint!==false)SC.applyCust(tg,32,opts.draft,st.view,{x0:opts.region.x0,y0:opts.region.y0,n:N});else SC.applyCust(tg,32,Object.assign({},opts.draft,{px:{}}),st.view,{x0:0,y0:0,n:0});SC.outlineSize(tg,32);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){ctx.fillStyle=(x+y)%2?'#1a1510':'#14100c';ctx.fillRect(x*Z,y*Z,Z,Z)}
  ctx.drawImage(t,opts.region.x0,opts.region.y0,N,N,0,0,N*Z,N*Z);
  ctx.strokeStyle='rgba(255,255,255,.05)';for(let i=0;i<=N;i++){ctx.beginPath();ctx.moveTo(i*Z+.5,0);ctx.lineTo(i*Z+.5,N*Z);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*Z+.5);ctx.lineTo(N*Z,i*Z+.5);ctx.stroke()}
  if(opts.inner){ctx.strokeStyle='rgba(224,168,69,.55)';ctx.setLineDash([4,4]);ctx.strokeRect(opts.inner[0]*Z+.5,opts.inner[1]*Z+.5,opts.inner[2]*Z,opts.inner[3]*Z);ctx.setLineDash([])}
  if(opts.onchange)opts.onchange()};
 const at=e=>{const r=cv.getBoundingClientRect();return [Math.floor((e.clientX-r.left)/r.width*N),Math.floor((e.clientY-r.top)/r.height*N)]};
 const apply=e=>{if(opts.paint===false)return;const [x,y]=at(e);if(x<0||y<0||x>=N||y>=N)return;const k=st.view+':'+x+','+y;const px=opts.draft.px;
  if(st.tool==='paint')px[k]=st.col;else if(st.tool==='erase')px[k]='-';else if(st.tool==='restore')delete px[k];else if(st.tool==='pick'){const d=ctx.getImageData(x*Z+Z/2,y*Z+Z/2,1,1).data;st.col=SC.hex(d[0],d[1],d[2]);colIn.value=st.col;st.tool='paint';syncTools()}draw()};
 cv.addEventListener('pointerdown',e=>{st.down=true;cv.setPointerCapture(e.pointerId);apply(e)});cv.addEventListener('pointermove',e=>{if(st.down)apply(e)});cv.addEventListener('pointerup',()=>st.down=false);
 if(opts.views.length>1){const vr=h('div','row2');opts.views.forEach(v=>{const b=h('button','btn sm',{d:'Front',u:'Back',s:'Side'}[v]);b.dataset.v=v;b.onclick=()=>{st.view=v;syncTools();draw()};vr.appendChild(b)});tools.appendChild(vr)}
 const sl=(lbl,key,min,max,mul)=>{const l=h('label');const v=h('span','',Math.round((opts.draft[key]??(key==='h'?0:1))*mul));const r=h('input');r.type='range';r.min=min;r.max=max;r.value=Math.round((opts.draft[key]??(key==='h'?0:1))*mul);
  r.oninput=()=>{opts.draft[key]=+r.value/mul;v.textContent=r.value;draw()};l.append(document.createTextNode(lbl),r,v);tools.appendChild(l)};
 sl('Hue','h',-180,180,1);sl('Saturation %','s',0,200,100);sl('Brightness %','b',0,200,100);
 let colIn=null;
 if(opts.paint!==false){const tr=h('div','row2');[['paint','✎ Paint'],['erase','⌫ Erase'],['restore','↺ Restore'],['pick','◉ Pick']].forEach(([k,l])=>{const b=h('button','btn sm',l);b.dataset.t=k;b.onclick=()=>{st.tool=k;syncTools()};tr.appendChild(b)});tools.appendChild(tr);
  colIn=h('input');colIn.type='color';colIn.value=st.col;colIn.oninput=()=>{st.col=colIn.value;st.tool='paint';syncTools()};const cr=h('div','row2');cr.append(colIn);
  const sw=h('div','swatches');['#140e0a','#ffffff','#c83a3a','#e0a845','#3b7fd8','#3bb85a','#9b4fd8','#f0c8a0','#5a3820','#8a8f98'].forEach(c=>{const b=h('button');b.style.background=c;b.onclick=()=>{st.col=c;colIn.value=c;st.tool='paint';syncTools()};sw.appendChild(b)});cr.appendChild(sw);tools.appendChild(cr);
  const cl=h('button','btn sm','Clear painting on this view');cl.onclick=()=>{for(const k of Object.keys(opts.draft.px))if(k[0]===st.view)delete opts.draft.px[k];draw()};tools.appendChild(cl);
  tools.appendChild(h('div','note','Paint up to 3 pixels past the sprite edge (dashed box). Erase cuts pixels away; Restore puts the original back.'))}
 const syncTools=()=>{tools.querySelectorAll('[data-t]').forEach(b=>b.classList.toggle('accept',b.dataset.t===st.tool));tools.querySelectorAll('[data-v]').forEach(b=>b.classList.toggle('accept',b.dataset.v===st.view))};
 wrap.appendChild(tools);syncTools();setTimeout(draw,0);return {el:wrap,redraw:draw,st}}

// ---------- appearance (character) ----------
let lookDraft=null,lookCol=0;
function buildLook(){const W=makeWin('lookWin','Appearance',{key:'look',foot:true,pos:{left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(760px,96vw)'}});WINS.look=W;
 W.render=function(){const m=G().me;lookDraft=JSON.parse(JSON.stringify(m.cust||SC.custBlank()));lookCol=G().col;const b=W.body;b.innerHTML='';
  b.appendChild(h('div','info','Shift your colours, or paint pixel by pixel on the front, back and side views. Your equipped gear is shown; paint sits on top of it. Everyone in your world sees the result.'));
  const cr=h('div','row2');cr.style.marginBottom='8px';cr.appendChild(h('span','muted','Tunic: '));const sw=h('div','swatches');SC.PCOL.forEach((c,i)=>{const bt=h('button',i===lookCol?'on':'');bt.style.background=c[0];bt.onclick=()=>{lookCol=i;sw.querySelectorAll('button').forEach((x,j)=>x.classList.toggle('on',j===i));ed.redraw()};sw.appendChild(bt)});cr.appendChild(sw);b.appendChild(cr);
  const size=h('div','note');
  const ed=pixelEditor({size:26,cell:13,region:{x0:3,y0:6},inner:[3,3,20,20],views:['d','u','s'],draft:lookDraft,
   base:(g,v)=>{const t=document.createElement('canvas');t.width=t.height=20;SC.paintChar(t.getContext('2d'),SC.lookFromEq(m.eq,lookCol),v==='d'?0:v==='u'?3:2,0,true);g.drawImage(t,6,9)},
   onchange:()=>{const n=SC.custPack(lookDraft).length;size.textContent=`${Object.keys(lookDraft.px).length} painted pixels · ${n} / 1600 bytes`;size.style.color=n>1600?'#ff8a7a':''}});
  b.appendChild(ed.el);b.appendChild(size)};
 W.foot.innerHTML='';const rs=h('button','btn','Reset all');rs.onclick=()=>{G().me.cust=SC.custBlank();game().recompute();W.render()};
 const sv=h('button','btn accept','Save');sv.onclick=()=>{if(SC.custPack(lookDraft).length>1600){UI.log('Too much painting to share (over 1600 bytes). Erase a little.','bad');return}G().me.cust=lookDraft;G().col=lookCol;game().recompute();game().saveNow();UI.log('Appearance saved.','good');UI.close('look')};
 const cl=h('button','btn','Cancel');cl.onclick=()=>UI.close('look');W.foot.append(rs,cl,sv)}

// ---------- companions + creature editor ----------
let petEdit=-1,petDraft=null;
function buildPets(){const W=makeWin('petWin','Companions',{key:'pets',pos:{left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(720px,96vw)'}});WINS.pets=W;
 W.render=function(){const m=G().me;const b=W.body;b.innerHTML='';
  b.appendChild(h('div','info',`Wound a creature below half health, face it and press R to tame it. Hunter skill raises your odds. ${G().rules.tameAll?'In this world every creature can be tamed.':'In this world only beasts can be tamed.'} One companion follows you at a time.`));
  if(!m.pets.length){b.appendChild(h('div','muted','No companions yet.'));return}
  if(petEdit>=0&&m.pets[petEdit]){const pt=m.pets[petEdit];const D=SC.P.petShape(pt);const card=h('div','card');card.appendChild(h('h4','sech','Customise '+esc(pt.pn||pt.n)));
   const nm=h('input');nm.value=pt.pn||pt.n;nm.maxLength=20;const nr=h('div','row2');nr.append(h('span','muted','Name '),nm);card.appendChild(nr);
   const locked=!UI.S.secretPaint;
   const ed=pixelEditor({size:22,cell:12,region:{x0:5,y0:9},inner:[3,3,16,16],views:['s'],draft:petDraft,paint:!locked,
    base:(g)=>{const t=SC.G;const R=null;if(D.s==='hum'){const c=document.createElement('canvas');c.width=c.height=20;SC.paintChar(c.getContext('2d'),{skin:D.c[0],hair:D.c[1],tunic:D.c[0],tunic2:D.c[1],trousers:D.c[1]},2,0,true);g.drawImage(c,6,9)}
     else if(D.s==='wisp'){const gr=g.createRadialGradient(16,20,1,16,20,8);gr.addColorStop(0,'#fff');gr.addColorStop(.35,D.c[0]);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(8,12,16,16)}
     else if(!SC.paintCreature(g,D.s,D.c[0],D.c[1],8,12))SC.paintPx(g,SC.PX[D.s]||SC.PX.blob,{k:'#140e0a',c:D.c[0],d:D.c[1],e:'#ffe040',l:SC.shade(D.c[0],60),w:'#ffffff',t:'#e8a030'},false,8,12)}});
   card.appendChild(ed.el);
   const bar=h('div','bar2');const sv=h('button','btn accept','Save');sv.onclick=()=>{pt.pn=nm.value.replace(/[^\w \-']/g,'').slice(0,20)||pt.n;pt.cu=SC.custIsPlain(petDraft)?'':SC.custPack(petDraft).slice(0,1600);petEdit=-1;if(m.pets[m.pet]===pt)SC.P.summon();game().saveNow();W.render()};
   const cn=h('button','btn','Back');cn.onclick=()=>{petEdit=-1;W.render()};bar.append(cn,sv);card.appendChild(bar);b.appendChild(card);return}
  m.pets.forEach((pt,i)=>{const D=SC.P.petShape(pt);const c=h('div','card petcard'+(i===m.pet?' on':''));c.style.marginBottom='8px';
   c.innerHTML=`<img src="${SC.portraitURL(D.s,D.c[0],D.c[1],144)}"><div><h4 style="margin:0">${esc(pt.pn||pt.n)} <span class="muted" style="font-weight:400;font-size:13px">· ${esc(pt.n)} · level ${pt.lvl}</span></h4></div>`;
   const bar=h('div','bar2');const s=h('button','btn sm'+(i===m.pet?' accept':''),i===m.pet?'Following (dismiss)':'Summon');s.onclick=()=>SC.P.setPet(i);
   const cu=h('button','btn sm','Customise');cu.onclick=()=>{petEdit=i;petDraft=SC.custUnpack(pt.cu||'');W.render()};
   const rl=h('button','btn sm danger','Release');rl.onclick=()=>{if(rl.dataset.c){SC.P.release(i)}else{rl.dataset.c=1;rl.textContent='Release forever?'}};bar.append(s,cu,rl);c.lastChild.appendChild(bar);b.appendChild(c)})}}

// ---------- read / edit / sign ----------
let readSrc=null,readMode='read';
UI.openRead=function(src){readSrc=src;readMode='read';UI.open('read')};
function buildRead(){const W=makeWin('readWin','Read',{key:'read',foot:true,pos:{left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(720px,96vw)'}});WINS.read=W;W.root.classList.add('readwin');
 W.render=function(){const it=readSrc?game().itemAt(readSrc):null;const b=W.body,f=W.foot;b.innerHTML='';f.innerHTML='';if(!it||!SC.hasRead(it)){b.textContent='Nothing to read.';return}
  W.root.querySelector('.wtitle h2').textContent=SC.stats(it).name;const r=SC.readText(it.t);const mine=readSrc.c==='inv'||readSrc.c==='eq';
  if(readMode==='edit'&&!r.signed){const tb=h('div','bar2');const ta=h('textarea');ta.value=r.text;ta.maxLength=SC.TEXTMAX;
   const wrapSel=(a,z)=>{const s=ta.selectionStart,e=ta.selectionEnd;ta.setRangeText(a+ta.value.slice(s,e)+z,s,e,'end');ta.focus();cnt()};
   const col=h('input');col.type='color';col.value='#e0a845';const cb=h('button','btn sm','Colour');cb.onclick=()=>wrapSel(`[c=${col.value}]`,'[/c]');
   const bb=h('button','btn sm','B');bb.onclick=()=>wrapSel('[b]','[/b]');const ib=h('button','btn sm','I');ib.onclick=()=>wrapSel('[i]','[/i]');const hb=h('button','btn sm','Heading');hb.onclick=()=>wrapSel('[h]','[/h]');
   const br=h('button','btn sm','Line break');br.onclick=()=>wrapSel('[br]','');const counter=h('span','muted');const cnt=()=>counter.textContent=`${ta.value.length} / ${SC.TEXTMAX}`;ta.oninput=cnt;
   const pv=h('button','btn sm','Preview');const prev=h('div','readtext card hidden');pv.onclick=()=>{prev.classList.toggle('hidden');prev.innerHTML=SC.richText(ta.value)};
   tb.append(col,cb,bb,ib,hb,br,pv,counter);b.append(tb,ta,prev);cnt();
   b.appendChild(h('div','note','Tags: [c=#ff8800]colour[/c] or [c=red]…[/c], [b]bold[/b], [i]italic[/i], [h]heading[/h], [br] or a new line.'));
   const cl=h('button','btn','Cancel');cl.onclick=()=>{readMode='read';W.render()};const sv=h('button','btn accept','Save');sv.onclick=()=>{game().setText(readSrc,ta.value);readMode='read';W.render()};f.append(cl,sv);return}
  const body=h('div','readtext');body.innerHTML=r.text?SC.richText(r.text):'<span class="muted">(blank)</span>';b.appendChild(body);
  if(r.signed)b.appendChild(h('div','seal'+(r.valid?'':' bad'),r.valid?`✒ Signed by ${esc(r.by)}. The seal is unbroken.`:`⚠ The seal by ${esc(r.by)} is broken; these words may have been altered.`));
  if(mine&&!r.signed){const ed=h('button','btn','Edit');ed.onclick=()=>{readMode='edit';W.render()};f.appendChild(ed);
   if(r.text){const sg=h('button','btn','Sign');sg.title='Seal the text forever under your name. It can never be edited again.';sg.onclick=()=>{if(!sg.dataset.c){sg.dataset.c=1;sg.textContent='Seal forever? Click again';sg.classList.add('danger');return}game().signText(readSrc);W.render()};f.appendChild(sg)}}
  const cl=h('button','btn accept','Close');cl.onclick=()=>UI.close('read');f.appendChild(cl)}}

// ---------- settings panes ----------
function panes(){const P=UI._PANES;
 P.audio=function(p){p.appendChild(h('div','info','Each biome has its own ambient music, crossfading as you travel.'));
  const r=h('div','card srow');r.innerHTML='<div><h4>Music volume</h4><p>Default 15%. Biome tracks crossfade over about 20 seconds.</p></div>';const rg=h('input');rg.type='range';rg.min=0;rg.max=100;rg.value=Math.round(UI.S.vol*100);const v=h('span','',rg.value+'%');
  rg.oninput=()=>{UI.S.vol=+rg.value/100;v.textContent=rg.value+'%';if(SC.Music)SC.Music.setVolume(UI.S.vol);UI.saveSettings()};const w=h('div');w.style.display='flex';w.style.gap='8px';w.append(rg,v);r.appendChild(w);p.appendChild(r);
  const r2=h('div','card srow');r2.innerHTML='<div><h4>Mute music</h4></div>';r2.appendChild(UI._toggle(UI.S.mute,on=>{UI.S.mute=on;if(SC.Music)SC.Music.muted=on;UI.saveSettings()}));p.appendChild(r2);
  const r3=h('div','card srow');r3.innerHTML=`<div><h4>Now playing</h4><p>${SC.Music&&SC.Music.cur?esc(SC.trackTitle(SC.Music.cur)):'(nothing yet: music starts after your first click)'} · Ars Sonor</p></div>`;p.appendChild(r3)};
 P.about=function(p){p.appendChild(h('div','info','SortCraft · version 0.4 · rated 16+ for fantasy violence and blood.'));
  const c=h('div','card');c.innerHTML='<h4 style="margin:0 0 6px">Credits</h4><p class="note">Music: <b>Ars Sonor</b>. Tracks are used as biome ambience; titles appear under Audio → Now playing.</p><p class="note">Fonts: Averia Serif Libre and MedievalSharp (Google Fonts). Multiplayer: PeerJS / WebRTC.</p>';p.appendChild(c)}}

UI.build2=function(){h=UI._h;makeWin=UI._makeWin;WINS=UI._WINS;buildLook();buildPets();buildRead();panes();
 const t=document.createElement('div');t.id='hudTarget';t.className='hudel hpanel';t.dataset.hud='target';t.style.visibility='hidden';$('hud').appendChild(t);
 const old=UI.closeTop;UI.closeTop=function(){for(const k of ['read','look','pets'])if(UI.isOpen(k)){UI.close(k);return true}return old()};
 const oldRef=UI.refresh;UI.refresh=function(){oldRef();for(const k of ['pets'])if(UI.isOpen(k)&&petEdit<0)WINS[k].render()}};
})();
