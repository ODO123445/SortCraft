// SortCraft — UI: themes, HUD, windows, containers, drag-to-craft, compendium, encounters, settings, map
(function(){
'use strict';
const SC=globalThis.SC;const UI=SC.UI={};
const $=id=>document.getElementById(id);
const h=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;return e};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
UI.esc=esc;
const G=()=>SC.G;const game=()=>SC.game;

// ---------- themes ----------
const TH=[['Seidr','#1b1410','#6e5530','#e0a845','#6a4a18','#5a2418','#2a1f17'],['Seidr Ember','#1c1410','#8a5428','#f08a3a','#7a3a10','#5a2418','#2a1c14'],
 ['DhakhaR','#1c0f0e','#5a2a22','#e04a3a','#a01010','#5a1a1a','#2a1512'],['Raaka','#15131f','#3a3560','#f0a050','#8a2a6a','#6a1e2e','#2a2540'],['ashenius','#1e1418','#5a3040','#e05a80','#7a1a3a','#8a3020','#2e2228'],
 ['JereKuusela','#10141c','#303848','#f08070','#2a8a3a','#7a2020','#20242e'],['Searica','#1a1614','#5a3a2a','#e07a4a','#b0582a','#7a2a1e','#2e2622'],['Wackymole','#12161e','#2a3a5a','#e0a040','#8a7a20','#6a1e2a','#2a3a5e'],
 ['ninebyte','#1a0c10','#6a1a24','#ff3a4a','#e01040','#8a3a10','#2e1416'],['JPValheim','#0c1420','#203050','#e0c040','#5a3a5a','#6a2030','#1a2840'],['Haloa','#1a1c20','#707880','#50d0d0','#4a7a80','#7a3a2a','#3a4048'],
 ['Zeall','#14120e','#3a3020','#f0c040','#3a4a8a','#7a3a2a','#2a2420'],['MrBungles','#141618','#3a4040','#c8c8c8','#4a5050','#5a2a2a','#2a2e30'],['Cooties','#101418','#2a3a3a','#60d0b0','#2a6a5a','#7a1a30','#203040'],
 ['Arbby','#0e1210','#202a20','#f0e040','#8a8a10','#6a1e1e','#1e2a28'],['Fire','#1a0e1e','#4a1a4a','#f07a6a','#b02a5a','#8a2a1a','#3a1a40'],['BriGamesAU','#121218','#6a2a5a','#f050e0','#1a8a8a','#b02a5a','#2a1a28'],
 ['Hobo','#141414','#909090','#50d080','#2a6a40','#7a2a2a','#2a3a3a'],['AvatarOfKu','#1a1210','#5a3020','#f08020','#a04010','#7a2a1a','#2e1e18']];
UI.THEMES=TH.map(t=>({n:t[0],bg:t[1],line:t[2],gold:t[3],accept:t[4],close:t[5],btn:t[6],panel:SC.mix(t[1],t[2],.12),panel2:SC.mix(t[1],t[2],.2),ink:'#ece4d4',muted:SC.mix('#ece4d4',t[1],.38)}));
UI.applyTheme=function(name){const t=UI.THEMES.find(x=>x.n===name)||UI.THEMES[0];const r=document.documentElement.style;
 for(const k of ['bg','panel','panel2','line','gold','ink','muted','accept','close','btn'])r.setProperty('--'+k,t[k])};

// ---------- settings ----------
const HUDKEYS=[['vitals','Health & magic','Health, magic, gold and active buffs (top left).'],['party','Party','Other players in your world, with their health.'],['biome','Realm banner','The realm name and danger level when you enter a new biome.'],
 ['mini','Minimap','Round map of explored land around you.'],['menu','Menu buttons','Shortcut buttons for bag, compendium, skills, map and settings.'],['log','Event log','Loot, experience and story messages.'],
 ['chat','Chat','Messages from other players. Press T to type.'],['hot','Action bar','Interact, Dig, Blink, Bamf, Quaff, quick slots 4–8, Tent and Spellbook.'],['prompt','Interaction prompt','Tells you what Space will do right now.']];
UI.DEF={theme:'Seidr',hud:{vitals:'show',party:'show',biome:'auto',mini:'show',menu:'show',log:'auto',chat:'auto',hot:'show',prompt:'show'},
 feat:{daynight:true,lights:true,fog:true,dmg:true,names:true,autopick:true,keycheck:true,blood:true},zoom:1,autosave:true};
UI.S=JSON.parse(JSON.stringify(UI.DEF));
UI.loadSettings=function(){try{const s=JSON.parse(localStorage.getItem('sc.settings')||'null');if(s){UI.S=Object.assign(JSON.parse(JSON.stringify(UI.DEF)),s);UI.S.hud=Object.assign({},UI.DEF.hud,s.hud||{});UI.S.feat=Object.assign({},UI.DEF.feat,s.feat||{})}}catch(e){}UI.applyTheme(UI.S.theme);UI.applyHud()};
UI.saveSettings=function(){try{localStorage.setItem('sc.settings',JSON.stringify(UI.S))}catch(e){}};

// ---------- HUD ----------
const poked={};
UI.poke=k=>{poked[k]=performance.now();const e=document.querySelector(`[data-hud="${k}"]`);if(e)e.classList.remove('faded')};
UI.applyHud=function(){for(const [k] of HUDKEYS){const e=document.querySelector(`[data-hud="${k}"]`);if(!e)continue;const m=UI.S.hud[k];e.classList.toggle('off',m==='hide');if(m!=='auto')e.classList.remove('faded');else UI.poke(k)}};
UI.hudTick=function(){const now=performance.now();for(const [k] of HUDKEYS){if(UI.S.hud[k]!=='auto')continue;const e=document.querySelector(`[data-hud="${k}"]`);if(e&&!e.matches(':hover')&&!(k==='chat'&&document.activeElement===$('chatIn'))&&now-(poked[k]||0)>3000)e.classList.add('faded')}};
UI.initHud=function(){['hudVitals','hudParty','hudMini','hudChat','hudHot','hudPrompt','hudMenu'].forEach(id=>$(id).classList.add('hpanel'));
 const hot=$('hudHot');hot.innerHTML='';
 const slots=[['act','Space','⚔','Act'],['dig','1','⛏','Dig'],['blink','2','✧','Blink'],['bamf','3','✺','Bamf'],['potion','Q','⚗','Quaff'],['q0','4','',''],['q1','5','',''],['q2','6','',''],['q3','7','',''],['q4','8','',''],['tent','G','⛺','Tent'],['book','B','📖','Spells']];
 for(const s of slots){const b=h('div','hs'+(s[0][0]==='q'&&s[0].length===2?' quick':''));b.dataset.a=s[0];b.innerHTML=`<span class="k">${s[1]}</span><span class="g">${s[2]}</span><span class="c"></span><span class="nm">${s[3]}</span><i class="cdv"></i>`;b.addEventListener('click',()=>game().action(s[0]));hot.appendChild(b)}
 const menu=$('hudMenu');menu.innerHTML='';[['Bag','inv','I'],['Compendium','comp','J'],['Skills','skills','K'],['Spells','book','B'],['Tent','tent','G'],['Map','map','M'],['⚙','settings','Esc']].forEach(m=>{const b=h('button','btn',m[0]);b.title=m[0]+' ('+m[2]+')';b.onclick=()=>UI.toggle(m[1]);menu.appendChild(b)});
 $('chatForm').addEventListener('submit',e=>{e.preventDefault();const v=$('chatIn').value.trim();if(v)game().say(v);$('chatIn').value='';$('chatIn').blur()});
 $('chatIn').addEventListener('focus',()=>UI.poke('chat'));
};
UI.abIcon=function(k){return ({appraise:'⚖',smithing:'⚒',salvage:'♻',gemcutter:'◇',reforge:'🔨',masterwork:'✪',runesmith:'ᚱ',alloying:'⚗',satchel:'🎒',legendforge:'★',floralore:'❦',forager:'🌿',poultice:'✚',senseflora:'❀',masterdyer:'🎨',thornward:'✣',verdant:'➶',seedcall:'🌱',lifebloom:'❤',ancientherb:'❧',beastlore:'🐾',tracker:'👁',skinning:'🔪',bleed:'🩸',fleetfoot:'»',mark:'◎',ambush:'⚡',volley:'➹',apex:'🐺',beastlord:'♛',stonelore:'◆',prospector:'✦',stoneskin:'⛰',richveins:'⛏',gemfinder:'💎',tunnel:'⛏',seismic:'〰',transmute:'⟳',quake:'✸',mountainheart:'⛰',elementlore:'☉',steadyhands:'✋',distill:'⚗',potionlore:'⚕',flask:'💥',transmutation:'⇧',elixirmastery:'⌛',philosopher:'☤',catalyst:'✲',quicksilver:'☿',blink:'✧',bamf:'✺',heal:'✚',tentcraft:'⛺',mending:'❋',bolt:'➳',ward:'⛨',chain:'ϟ',timeslip:'⧖',starfall:'☄'})[k]||'✶'};
UI.updateHot=function(){const g=G();if(!g||!g.me)return;const m=g.me;for(const b of document.querySelectorAll('.hs')){const qa=b.dataset.a;if(/^q\d$/.test(qa)){const q=(m.quick||[])[+qa[1]]||'';let ic='',nm='',mp=0,cd=0,lock=false;
   if(q.startsWith('sp:')){const sp=m.spells[+q.slice(3)];if(sp){ic='✶';nm=sp.n;mp=SC.P.spellCost(sp);cd=SC.P.cdLeft('sp'+q.slice(3))}}else if(SC.ABI[q]){const A=SC.ABI[q];ic=UI.abIcon(q);nm=A.n;mp=A.mp;cd=SC.P.cdLeft(q);lock=!SC.hasAb(m.sk,q)}
   b.querySelector('.g').textContent=ic;b.querySelector('.nm').textContent=nm;b.querySelector('.c').textContent=mp?mp+' MP':'';b.classList.toggle('locked',lock||!q);b.title=nm||'Empty: assign from the Skills or Spellbook window';const cv=b.querySelector('.cdv');cv.style.height=cd>0?Math.min(100,cd/((SC.ABI[q]||{cd:2.5}).cd*1000)*100)+'%':'0';continue}
  const a=SC.ACTIONS.find(x=>x.k===qa);if(!a){b.classList.remove('locked');continue}
 const lv=a.sk?g.me.sk[SC.SKI[a.sk]]:99;const ok=lv>=a.lv;b.classList.toggle('locked',!ok);b.title=a.n+': '+a.d+(ok?'':` Unlocks at ${SC.SKILLS[SC.SKI[a.sk]].n} ${a.lv}.`);b.querySelector('.c').textContent=a.mp?a.mp+' MP':''}};
let lastVit='';
UI.updateVitals=function(){const g=G(),m=g.me;const key=[Math.ceil(m.hp),m.mhp,Math.floor(m.mp),m.mmp,m.gold,m.sk.join(),m.buffs.length,g.name,m.ward|0,(m.quick||[]).join(),Math.floor(performance.now()/250)].join('|');if(key===lastVit)return;lastVit=key;
 $('hvHp').style.width=Math.max(0,m.hp/m.mhp*100)+'%';$('hvHpT').textContent=Math.ceil(m.hp)+' / '+m.mhp;$('hvMp').style.width=Math.max(0,m.mp/m.mmp*100)+'%';$('hvMpT').textContent=Math.floor(m.mp)+' / '+m.mmp;
 $('hvGold').textContent=m.gold;$('hvLv').textContent=m.sk.reduce((a,b)=>a+b,0);$('hvName').textContent=g.name;
 $('hvBuffs').textContent=m.buffs.map(b=>b.atk?'⚔+'+b.atk:b.arm?'⛨+'+b.arm:b.stealth?'☾':b.xp?'✦xp':b.speed?'»':b.thorns?'✣':b.light?'☀':'').join(' ')+(m.ward>0?' ⛨'+Math.round(m.ward):'')+(m.hots&&m.hots.length?' ❋':'');UI.updateHot()};
UI.log=function(msg,cls){const L=$('hudLog');const d=h('div',cls||'');d.textContent=msg;L.appendChild(d);while(L.children.length>7)L.firstChild.remove();UI.poke('log');setTimeout(()=>{d.style.opacity='.0';d.style.transition='opacity 1s'},9000);setTimeout(()=>d.remove(),10200)};
UI.chat=function(name,text,col){const L=$('chatLines');const d=h('div');const b=h('b');b.style.color=col||'var(--gold)';b.textContent=name?name+': ':'';d.append(b,document.createTextNode(text));L.appendChild(d);while(L.children.length>60)L.firstChild.remove();L.scrollTop=L.scrollHeight;UI.poke('chat')};
let partyKey='';
UI.updateParty=function(list){const key=list.map(p=>p.n+p.hp+'/'+p.mhp+p.col).join('|');if(key===partyKey)return;partyKey=key;const P=$('hudParty');P.innerHTML='';
 for(const p of list){const d=h('div','pm');const sw=h('span','sw');sw.style.background=SC.PCOL[p.col%8][0];const n=h('span','',esc(p.n)+(p.host?' ★':''));const mi=h('span','mini');const i=h('i');i.style.width=Math.max(0,p.hp/Math.max(1,p.mhp)*100)+'%';mi.appendChild(i);d.append(sw,n,mi);P.appendChild(d)}UI.poke('party')};
UI.setBiome=function(b,lvl){$('hbName').textContent=b.name;$('hbSub').textContent=`${b.sub} · Danger ${lvl}`;UI.poke('biome')};
let lastPrompt='';UI.prompt=function(html){if(html===lastPrompt)return;lastPrompt=html;$('hudPrompt').innerHTML=html;if(html)UI.poke('prompt')};

// minimap
UI.drawMini=function(){const g=G();if(!g.world)return;const cv=$('mini'),c=cv.getContext('2d');const R=30,S=3,px=g.me.x,py=g.me.y;
 if(!UI._mimg)UI._mimg=c.createImageData(R*2,R*2);const img=UI._mimg,d=img.data;
 for(let j=0;j<R*2;j++)for(let i=0;i<R*2;i++){const x=px-R+i,y=py-R+j,o=(j*R*2+i)*4;if(!g.fog.isExp(x,y)){d[o]=8;d[o+1]=6;d[o+2]=5;d[o+3]=255;continue}
  const col=SC.rgb(g.world.miniColor(x,y));d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=255}
 if(!UI._mcv){UI._mcv=document.createElement('canvas');UI._mcv.width=UI._mcv.height=R*2}UI._mcv.getContext('2d').putImageData(img,0,0);
 c.imageSmoothingEnabled=false;c.clearRect(0,0,180,180);c.drawImage(UI._mcv,0,0,180,180);
 const dot=(x,y,col,r)=>{c.fillStyle='#000';c.fillRect(90+(x-px)*S-r-1,90+(y-py)*S-r-1,r*2+2,r*2+2);c.fillStyle=col;c.fillRect(90+(x-px)*S-r,90+(y-py)*S-r,r*2,r*2)};
 for(const p of g.peerList)if(!p.me)dot(p.x,p.y,SC.PCOL[p.col%8][0],2);
 const sk=g.me.sk;if(SC.hasAb(sk,'tracker'))for(const m of g.mons.values())dot(m.tx,m.ty,'#e04040',1);
 const seis=performance.now()<(g.seismicUntil||0),fl=SC.hasAb(sk,'senseflora');if(seis||fl)for(const po of g.world.nearbyPois(px,py,R)){if(fl&&po.k==='col'&&SC.ITEMS[po.id].cat==='flora')dot(po.x,po.y,'#7fe08a',1);if(seis&&(po.k==='ore'||po.k==='dig'&&!g.world.deltas.get(po.key)))dot(po.x,po.y,po.k==='ore'?'#c0c8d4':'#ffe070',1)}
 for(const t of g.world.tents.values())dot(t.x,t.y,'#e8d8b0',2);
 if(Math.abs(px)<R&&Math.abs(py)<R)dot(0,0,'#ffd060',2);
 dot(px,py,'#ffffff',2);$('hmCoord').textContent=`${px}, ${-py} · ${Math.round(SC.dist(px,py))} from the Tree`};

// ---------- windows ----------
const WINS={};
function makeWin(id,title,opts){opts=opts||{};const w=h('div','win frame hidden');w.id=id;w.innerHTML=`<div class="wtitle"><span class="rule"></span>◆<h2>${title}</h2>◆<span class="rule"></span></div><button class="btn sm x" title="Close">✕</button><div class="wbody"></div>${opts.foot?'<div class="wfoot"></div>':''}`;
 $('wins').appendChild(w);w.querySelector('.x').onclick=()=>UI.close(opts.key||id);
 // drag by title
 const t=w.querySelector('.wtitle');let sx,sy,ox,oy;t.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=w.getBoundingClientRect();sx=e.clientX;sy=e.clientY;ox=r.left;oy=r.top;w.style.transform='none';w.style.left=ox+'px';w.style.top=oy+'px';w.style.bottom='auto';t.setPointerCapture(e.pointerId);
  const mv=e2=>{w.style.left=Math.max(0,Math.min(innerWidth-80,ox+e2.clientX-sx))+'px';w.style.top=Math.max(0,Math.min(innerHeight-40,oy+e2.clientY-sy))+'px'};const up=()=>{t.removeEventListener('pointermove',mv);t.removeEventListener('pointerup',up)};
  t.addEventListener('pointermove',mv);t.addEventListener('pointerup',up)});
 if(opts.pos)Object.assign(w.style,opts.pos);
 w.addEventListener('pointerdown',()=>{document.querySelectorAll('.win').forEach(x=>x.style.zIndex=1);w.style.zIndex=2});
 return {root:w,body:w.querySelector('.wbody'),foot:w.querySelector('.wfoot')}}
UI.isOpen=k=>WINS[k]&&!WINS[k].root.classList.contains('hidden');
UI.open=function(k){const W=WINS[k];if(!W)return;W.root.classList.remove('hidden');document.querySelectorAll('.win').forEach(x=>x.style.zIndex=1);W.root.style.zIndex=2;if(W.render)W.render()};
UI.close=function(k){const W=WINS[k];if(!W)return;W.root.classList.add('hidden');if(W.onclose)W.onclose();UI.tipHide()};
UI.toggle=k=>UI.isOpen(k)?UI.close(k):UI.open(k);
UI.closeTop=function(){for(const k of ['enc','map','settings','book','tent','chest','comp','skills','inv'])if(UI.isOpen(k)&&k!=='enc'){UI.close(k);return true}return false};
UI.refresh=function(){for(const k of ['inv','chest','comp','skills','tent'])if(UI.isOpen(k))WINS[k].render()};

// ---------- item slot rendering ----------
UI.slotEl=function(it,src,opts){opts=opts||{};const s=h('div','slot');s._src=src;if(opts.lbl){s.classList.add('eqs');s.dataset.lbl=opts.lbl}
 if(it){const g=G();const img=h('img');img.src=SC.iconURL(it,48);img.alt='';s.appendChild(img);const rb=h('span','rb');rb.style.borderColor=it.r?SC.RARCOL[it.r]+'aa':'transparent';s.appendChild(rb);
  if(it.k>1){s.appendChild(h('span','n',it.k))}if(SC.known(it,g.me.sk)===0){s.classList.add('unk');s.appendChild(h('span','u','?'))}s._it=it}
 return s};
UI.statsHTML=function(it,full){const g=G(),sk=g.me.sk;const B=SC.ITEMS[it.b]||{};const s=SC.stats(it);const kn=SC.known(it,sk);const name=SC.dispName(it,sk);
 const rows=[];const R=(a,b)=>rows.push(`<div class="st"><b>${a}</b><span>${b}</span></div>`);
 const cat={weapon:'Weapon',armor:'Armour · '+(SC.ARMORS[B.slot]||{}).n,flora:'Flora',fauna:'Fauna specimen',mineral:'Mineral',gem:'Gem',rare:'Rare element',ore:'Ore',ingot:'Ingot',pattern:'Smithing pattern',potion:'Potion',relic:'Relic',misc:'Supplies'}[B.cat]||'';
 R('Rarity',`<span style="color:${SC.RARCOL[it.r|0]}">${SC.RARITY[it.r|0]}</span>`);
 const hide=kn===0;
 R('Attack',hide?'?':s.atk||'—');R('Armour',hide?'?':s.arm||'—');R('Magic cost',hide?'?':(s.mc?s.mc+' MP':'—'));
 const appr=(sk[0]|0)>=1||kn>0;R('Gold value',appr?Math.round(s.val*(1+(sk[0]|0)*.03))+' g':'?');
 if(B.cat==='weapon'||B.cat==='armor'){R('Metal',(SC.METALS[it.m||1]||{}).n);R('Gem',s.gem||'none set');if(s.magic)R('Magic power',s.magic);if(s.mp)R('Max magic','+'+s.mp);if(s.hp)R('Max health','+'+s.hp);if(s.find)R('Fortune','+'+s.find);if(s.light)R('Light','+'+s.light)}
 if(B.cat==='gem'||B.cat==='rare'){const f=B.fx;R('When set',Object.keys(f).map(k=>({atk:'ATK',arm:'ARM',mp:'MP',hp:'HP',magic:'Magic',find:'Fortune',light:'Light'}[k])+' +'+f[k]).join(', '))}
 if(B.cat==='potion'){const fx=SC.potionFx(it);R('Effect',Object.entries(fx).filter(([k])=>k!=='buff').map(([k,v])=>({hp:'Heal',mp:'Magic',atk:'ATK',arm:'ARM',reveal:'Reveal',stealth:'Stealth s',xp:'XP boost'}[k]||k)+' '+(k==='xp'?'+'+Math.round(v*100)+'%':(v>0?'+':'')+v)).join(', '))}
 if(B.el){const al=(sk[4]|0)>=1&&kn>0;R('Elements',al?B.el.map(e=>`<span class="elchip" style="background:${SC.ELCOL[e]}">${SC.ELEMENTS[e]}</span>`).join(''):'?<span class="muted"> (Alchemist 1)</span>')}
 if(B.pot&&kn>0)R('Potency',B.pot);
 if(B.bi!==undefined)R('Origin',SC.BIOMES[B.bi].name);
 if(B.latin)R('Latin',kn>=2?`<i>${B.latin}</i>`:'?');
 if(B.idSk)R('Identify',`${SC.SKILLS[SC.SKI[B.idSk]].n} ${B.idLvl}${kn<2?' (full at '+(B.idLvl+2)+')':''}`);
 if(B.cat==='weapon'||B.cat==='armor'||it.c)R('Creator',it.c?esc(it.c)+(it.cl?' 🔒':''):'unknown');
 return {name,cat,rows:rows.join(''),desc:B.desc||'',s}};
// tooltip
UI.tip=function(it,x,y){if(!it||UI.drag)return;const t=$('tip');const S=UI.statsHTML(it);t.innerHTML=`<h4 style="color:${SC.RARCOL[it.r|0]}">${esc(S.name)}</h4><div class="muted" style="font-size:12px;margin-bottom:4px">${S.cat}${it.k>1?' · ×'+it.k:''}</div>${S.rows}`;
 t.classList.remove('hidden');const r=t.getBoundingClientRect();t.style.left=Math.min(innerWidth-r.width-8,x+16)+'px';t.style.top=Math.min(innerHeight-r.height-8,y+12)+'px'};
UI.tipHide=()=>$('tip').classList.add('hidden');

// ---------- drag, drop, craft ----------
UI.drag=null;
let lastClick={t:0,el:null};
function bindSlot(s){
 s.addEventListener('pointerenter',e=>{if(s._it)UI.tip(s._it,e.clientX,e.clientY)});s.addEventListener('pointerleave',UI.tipHide);
 s.addEventListener('contextmenu',e=>{e.preventDefault();if(s._it)game().use(s._src)});
 s.addEventListener('pointerdown',e=>{if(e.button!==0||!s._it)return;e.preventDefault();const sx=e.clientX,sy=e.clientY;let moved=false;
  if(e.shiftKey){game().quick(s._src);return}
  const mv=e2=>{if(!moved&&Math.hypot(e2.clientX-sx,e2.clientY-sy)>5){moved=true;startDrag(s,e2)}if(moved)dragMove(e2)};
  const up=e2=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);
   if(moved)endDrag(e2);else{const now=performance.now();if(lastClick.el===s._src.c+s._src.i&&now-lastClick.t<330){game().use(s._src);lastClick={t:0,el:null}}else{lastClick={t:now,el:s._src.c+s._src.i};UI.select(s._src)}}};
  addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up)})}
function startDrag(s,e){UI.tipHide();UI.drag={src:s._src,it:s._it,hover:null,t0:0,combo:null};const gh=$('ghost');gh.querySelector('img').src=SC.iconURL(s._it,52);gh.classList.remove('hidden');s.style.opacity='.35';UI.drag.el=s;dragMove(e)}
function targetAt(x,y){const el=document.elementFromPoint(x,y);if(!el)return null;const s=el.closest('.slot');if(s&&s._src)return {el:s,src:s._src};
 if(el.closest('.tentdye'))return {el:el.closest('.tentdye'),src:{c:'tentdye',i:0}};if(el.closest('.tentslot'))return {el:el.closest('.tentslot'),src:{c:'tentslot',i:+el.closest('.tentslot').dataset.k}};
 if(el.closest('#compWin'))return {el:document.querySelector('#compWin .cdrop'),src:{c:'comp',i:null}};if(el.closest('#invWin .grid'))return {el:null,src:{c:'inv',i:-1}};return null}
let fxEl=null;
function craftFx(show,rect,kind,p,err){if(!show){if(fxEl){fxEl.remove();fxEl=null}return}
 if(!fxEl){fxEl=h('div','craftfx');document.body.appendChild(fxEl)}
 if(err){fxEl.innerHTML=`<span class="lbl" style="color:#ff8a7a">${esc(err)}</span>`}
 else if(kind==='dye'){fxEl.innerHTML=`<span class="lbl" style="font-size:22px">🎨</span><span class="lbl">Dyeing… ${Math.round(p*100)}%</span>`}
 else if(kind==='cauldron'){const sz=10+36*p;fxEl.innerHTML=`<span class="pot" style="width:${sz}px;height:${sz*.8}px"></span><span class="lbl">Brewing… ${Math.round(p*100)}%</span>`}
 else{const ang=p*360;const icon=kind==='forge'?'🔥':'⚒';fxEl.innerHTML=`<span class="lbl" style="font-size:22px">${icon}</span><span class="lbl">${kind==='forge'?'Smelting':'Forging'}… ${Math.round(p*100)}%</span>`}
 fxEl.style.left=(rect.left+rect.width/2)+'px';fxEl.style.top=(rect.bottom-4)+'px'}
function dragMove(e){const D=UI.drag;if(!D)return;const gh=$('ghost');gh.style.left=e.clientX+'px';gh.style.top=e.clientY+'px';
 const t=targetAt(e.clientX,e.clientY);document.querySelectorAll('.slot.drop,.cdrop.hot').forEach(x=>x.classList.remove('drop','hot'));
 if(t&&t.el){t.el.classList.add(t.el.classList.contains('cdrop')?'hot':'drop')}
 const key=t&&t.src?t.src.c+':'+t.src.i:null;
 if(key!==D.hover){D.hover=key;D.t0=performance.now();D.combo=null;D.tgt=t;
  if(t&&t.src&&t.src.c==='inv'&&D.src.c==='inv'&&t.src.i!==D.src.i&&t.src.i>=0){const b=G().me.inv[t.src.i];if(b)D.combo=SC.combine(D.it,b,G().me.sk,G().name)}
  if(t&&t.src&&t.src.c==='eq'&&D.src.c==='inv'){const b=G().me.eq[t.src.i];const B=SC.ITEMS[D.it.b];if(b&&(SC.ORGANIC.includes(B.cat)||B.cat==='gem'||B.cat==='rare'))D.combo=SC.combine(D.it,b,G().me.sk,G().name)}
  if(t&&t.src&&t.src.c==='tentdye'&&D.src.c==='inv'){D.combo={kind:'dye',tent:true,make:()=>null}}}
 tickCraft()}
function tickCraft(){const D=UI.drag;if(!D||!D.combo||!D.tgt||!D.tgt.el){craftFx(false);return}
 const r=D.tgt.el.getBoundingClientRect();if(D.combo.err){craftFx(true,r,D.combo.kind,0,D.combo.err);return}
 const p=Math.min(1,(performance.now()-D.t0)/2000);craftFx(true,r,D.combo.kind,p);
 if(p>=1){const src=D.src,dst=D.tgt.src,combo=D.combo;cancelDrag();if(combo.tent){SC.P.dyeInterior(src.i);UI.refresh();return}game().craft(src,dst,combo)}}
UI.tickCraft=tickCraft;
function cancelDrag(){const D=UI.drag;if(!D)return;$('ghost').classList.add('hidden');if(D.el)D.el.style.opacity='';UI.drag=null;craftFx(false);document.querySelectorAll('.slot.drop,.cdrop.hot').forEach(x=>x.classList.remove('drop','hot'))}
function endDrag(e){const D=UI.drag;if(!D)return;const t=targetAt(e.clientX,e.clientY);const src=D.src;cancelDrag();if(t&&t.src){if(t.src.c==='tentslot'&&src.c==='inv'){tentSel[t.src.i]=src.i;WINS.tent.render();return}game().drop(src,t.src)}}

// ---------- inventory window ----------
UI.sel=null;
UI.select=function(src){UI.sel=src;if(UI.isOpen('inv'))WINS.inv.renderDetails();document.querySelectorAll('.slot.sel').forEach(x=>x.classList.remove('sel'))};
function buildInv(){const W=makeWin('invWin','Inventory',{key:'inv',pos:{left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(1060px,98vw)'}});WINS.inv=W;
 W.render=function(){const g=G(),m=g.me;const b=W.body;b.innerHTML='';const wrap=h('div','invwrap');
  // equipment
  const left=h('div');left.appendChild(h('div','muted','<b style="color:var(--gold);font-weight:400;font-family:var(--tfont)">Equipped</b>'));
  const eg=h('div','eqgrid');const LBL={weapon:'Weapon',head:'Head',body:'Body',legs:'Legs',shield:'Shield',cloak:'Cloak',trinket:'Trinket'};
  for(const sl of SC.EQSLOTS){const s=UI.slotEl(m.eq[sl],{c:'eq',i:sl},{lbl:m.eq[sl]?'':LBL[sl]});bindSlot(s);eg.appendChild(s)}left.appendChild(eg);
  const D=g.derived;left.appendChild(h('div','note',`ATK ${D.atk}${D.magic?' (+'+D.magic+' magic)':''}<br>ARM ${D.arm}<br>Health ${m.mhp} · Magic ${m.mmp}<br>Sight ${D.sight} · Fortune ${D.find}`));
  wrap.appendChild(left);
  // grid
  const mid=h('div');const sb=h('div','bar2');sb.innerHTML='<span class="muted" style="align-self:center">Sort:</span>';
  [['type','Type'],['rarity','Rarity'],['value','Value'],['realm','Realm'],['name','Name']].forEach(([k,l])=>{const bt=h('button','btn sm',l);bt.onclick=()=>game().sortInv(k);sb.appendChild(bt)});
  const tc=h('button','btn sm','→ Compendium');tc.title='Move every small collectable into your compendium';tc.onclick=()=>game().allToComp();sb.appendChild(tc);mid.appendChild(sb);
  const gr=h('div','grid');gr.style.setProperty('--cols',8);m.inv.forEach((it,i)=>{const s=UI.slotEl(it,{c:'inv',i});if(UI.sel&&UI.sel.c==='inv'&&UI.sel.i===i)s.classList.add('sel');bindSlot(s);gr.appendChild(s)});mid.appendChild(gr);
  if(m.over.length){const ov=h('div','note',`Overflow (${m.over.length}): your bag is full. `);const bt=h('button','btn sm','Retry');bt.onclick=()=>game().retryOverflow();ov.appendChild(bt);mid.appendChild(ov)}
  mid.appendChild(h('div','note','Drag one item onto another and hold for 2 seconds to craft. Hold a gem over gear to set it; hold a plant or animal specimen over gear (even worn gear) to dye it. Double-click or right-click to use. Shift-click to move.'));
  wrap.appendChild(mid);const det=h('div','card details');W.det=det;wrap.appendChild(det);b.appendChild(wrap);W.renderDetails()};
 W.renderDetails=function(){const d=W.det;if(!d)return;const it=UI.sel?game().itemAt(UI.sel):null;if(!it){d.innerHTML='<div class="muted">Select an item to see its details.</div>';return}
  const S=UI.statsHTML(it,true);d.innerHTML=`<img class="big" src="${SC.iconURL(it,72)}"><h3 style="color:${SC.RARCOL[it.r|0]}">${esc(S.name)}</h3><div class="sub">${S.cat}${it.k>1?' · ×'+it.k:''}${S.s.sub?'<br>'+esc(S.s.sub):''}</div>${S.rows}<div class="desc">${esc(S.desc)}</div>`;
  const acts=h('div','bar2');const B=SC.ITEMS[it.b];
  const add=(l,f,cls)=>{const bt=h('button','btn sm'+(cls?' '+cls:''),l);bt.onclick=f;acts.appendChild(bt)};
  if(UI.sel.c==='inv'){if(B.slot)add('Equip',()=>game().use(UI.sel));if(B.cat==='potion'||it.b==='misc.bread'||it.b==='misc.mead')add('Use',()=>game().use(UI.sel));if(it.b==='misc.chest')add('Place',()=>game().use(UI.sel));
   if(SC.SMALLCATS.includes(B.cat))add('To compendium',()=>game().quick(UI.sel));const sk=G().me.sk;
   if((B.cat==='weapon'||B.cat==='armor')&&SC.hasAb(sk,'salvage'))add('Salvage',()=>game().salvage(UI.sel));if((B.cat==='weapon'||B.cat==='armor')&&SC.hasAb(sk,'reforge'))add('Reforge',()=>game().reforge(UI.sel));
   if(SC.isStone(it)&&SC.hasAb(sk,'transmute'))add('Transmute',()=>game().transmute(UI.sel));if(it.k>1)add('Split',()=>game().split(UI.sel));add('Discard',()=>game().discard(UI.sel),'danger')}
  if(UI.sel.c==='eq'){add('Unequip',()=>game().use(UI.sel));if(SC.hasAb(G().me.sk,'reforge'))add('Reforge',()=>game().reforge(UI.sel))}
  if(it.h!==undefined)d.appendChild(h('div','note',`Dyed <span style="display:inline-block;width:12px;height:12px;border:1px solid #000;background:${SC.gearCol(it)[0]}"></span>`));
  if((B.cat==='weapon'||B.cat==='armor')&&it.c!==undefined&&!it.cl&&(UI.sel.c==='inv'||UI.sel.c==='eq')){const row=h('div','bar2');const inp=h('input');inp.value=it.c||G().name;inp.maxLength=20;inp.style.flex='1';const bt=h('button','btn sm accept','Inscribe');
   bt.title='Set the creator name. This can be done once, then it is locked forever.';bt.onclick=()=>game().inscribe(UI.sel,inp.value);row.append(inp,bt);d.appendChild(h('div','note','Creator name can be inscribed once, then never changed.'));d.appendChild(row)}
  d.appendChild(acts)}}

// ---------- chest window ----------
function buildChest(){const W=makeWin('chestWin','Chest',{key:'chest',pos:{left:'calc(50% + 330px)',top:'50%',transform:'translate(-50%,-50%)'}});WINS.chest=W;
 W.onclose=()=>game().closeChest();
 W.render=function(){const g=G();const b=W.body;b.innerHTML='';const items=g.chest&&g.chest.items;
  b.appendChild(h('div','info',g.chest&&g.chest.storage?'A storage chest. Anyone in this world can open it. Drag items in and out.':'Treasure! Drag items to your bag, or shift-click them.'));
  if(!items){b.appendChild(h('div','muted','Opening…'));return}
  const gr=h('div','grid');gr.style.setProperty('--cols',6);items.forEach((it,i)=>{const s=UI.slotEl(it,{c:'chest',i});bindSlot(s);gr.appendChild(s)});b.appendChild(gr);
  const bar=h('div','bar2');const ta=h('button','btn sm accept','Take all');ta.onclick=()=>game().takeAll();bar.appendChild(ta);
  const so=h('button','btn sm','Sort');so.onclick=()=>game().pushReq(['csort',g.chest.x,g.chest.y,'type']);bar.appendChild(so);
  if(g.chest.storage&&!items.some(Boolean)){const pu=h('button','btn sm','Pick up chest');pu.onclick=()=>{game().pushReq(['pickup',g.chest.x,g.chest.y]);UI.close('chest')};bar.appendChild(pu)}
  b.appendChild(bar)}}

// ---------- compendium ----------
let compTab='flora',compRealm='all';
function buildComp(){const W=makeWin('compWin','Compendium',{key:'comp',pos:{left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(880px,96vw)'}});WINS.comp=W;
 W.render=function(){const g=G(),m=g.me;const b=W.body;b.innerHTML='';
  const total=SC.SPECIES.length+SC.GEMS.length+SC.HYBRIDS.length;const have=Object.keys(m.comp).length;
  b.appendChild(h('div','info',`A naturalist's journal. Drop small collectables (flora, fauna, minerals, gems, rare elements) here and they file themselves by species. ${have} of ${total} entries found (${Math.round(have/total*100)}%).`));
  const tabs=h('div','ctabs');[['flora','Flora'],['fauna','Fauna'],['mineral','Minerals'],['gem','Gems & Rare']].forEach(([k,l])=>{const bt=h('button','btn sm'+(k===compTab?' accept':''),l);bt.onclick=()=>{compTab=k;W.render()};tabs.appendChild(bt)});
  const sel=h('select');sel.innerHTML='<option value="all">All realms</option>'+SC.BIOMES.map((B,i)=>`<option value="${i}">${esc(B.name)}</option>`).join('');sel.value=compRealm;sel.onchange=()=>{compRealm=sel.value;W.render()};tabs.appendChild(sel);b.appendChild(tabs);
  b.appendChild(h('div','cdrop','Drop collectables here'));
  const sec=(title,ids)=>{const got=ids.filter(id=>m.comp[id]).length;const s=h('div','biomesec');s.appendChild(h('h4','',`${esc(title)} <span>${got} / ${ids.length}</span>`));
   const gr=h('div','grid');gr.style.setProperty('--cols',Math.min(12,Math.max(8,ids.length)));
   for(const id of ids){const it=m.comp[id];if(it){const sl=UI.slotEl(it,{c:'comp',i:id});bindSlot(sl);gr.appendChild(sl)}else{const sl=h('div','slot ghosted');sl.title='Not yet found';gr.appendChild(sl)}}
   s.appendChild(gr);b.appendChild(s)};
  if(compTab==='gem'){sec('Gems',SC.GEMS.map(x=>'gem.'+x[0]));sec('Rare elements',SC.HYBRIDS.map((x,i)=>'rare.'+i))}
  else SC.BIOMES.forEach((B,bi)=>{if(compRealm!=='all'&&+compRealm!==bi)return;const ids=SC.SPECIES_BY_BIOME[bi].filter(id=>SC.ITEMS[id].cat===compTab);if(ids.length)sec(B.name,ids)})}}

// ---------- skills & abilities ----------
let skTab=0;
function buildSkills(){const W=makeWin('skillWin','Skills',{key:'skills',pos:{left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(820px,96vw)'}});WINS.skills=W;
 W.render=function(){const m=G().me;const b=W.body;b.innerHTML='';b.appendChild(h('div','info','Skills rise as you use them. Each has ten abilities; every effect grows with its skill level. Assign active abilities to quick slots 4–8.'));
  const tabs=h('div','ctabs');SC.SKILLS.forEach((S,i)=>{const bt=h('button','btn sm'+(i===skTab?' accept':''),`${S.ic} ${S.n} ${m.sk[i]}`);bt.onclick=()=>{skTab=i;W.render()};tabs.appendChild(bt)});b.appendChild(tabs);
  const S=SC.SKILLS[skTab],L=m.sk[skTab],xp=m.xp[skTab],need=SC.xpFor(L);
  const top=h('div','skill');top.innerHTML=`<div class="si">${S.ic}</div><div><div style="display:flex;justify-content:space-between"><b style="font-family:var(--tfont);font-weight:400;color:var(--gold);font-size:18px">${S.n}</b><span>Level ${L}</span></div><div class="xpb"><i style="width:${Math.min(100,xp/need*100)}%"></i></div><div class="note">${S.d} · ${xp}/${need} xp</div></div>`;b.appendChild(top);
  for(const A of SC.ABILITIES.filter(a=>a.sk===S.k)){const ok=L>=A.lv;const r=h('div','card srow abrow'+(ok?'':' lockedrow'));
   r.innerHTML=`<div style="display:flex;gap:10px;align-items:center"><div class="si sm">${UI.abIcon(A.k)}</div><div><h4>${esc(A.n)} <span class="muted" style="font-weight:400;font-size:13px">· level ${A.lv} · ${A.act?'active'+(A.mp?', '+A.mp+' MP':'')+(A.cd?', '+A.cd+'s cooldown':''):'passive'}</span></h4><p>${esc(A.d(Math.max(L,A.lv)))}</p></div></div>`;
   if(ok&&A.act){const bx=h('div','bar2');const u=h('button','btn sm accept','Use');u.onclick=()=>SC.P.cast(A.k);bx.appendChild(u);
    for(let q=0;q<5;q++){const bt=h('button','btn sm'+(m.quick[q]===A.k?' accept':''),String(q+4));bt.title='Put in quick slot '+(q+4);bt.onclick=()=>{m.quick[q]=A.k;UI.updateHot();W.render()};bx.appendChild(bt)}r.appendChild(bx)}
   b.appendChild(r)}}}
// ---------- spellbook: create your own spells ----------
let draft={n:'',a:[],el:[-1,-1,-1]};
function buildBook(){const W=makeWin('bookWin','Spellbook',{key:'book',pos:{left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(820px,96vw)'}});WINS.book=W;
 W.render=function(){const g=G(),m=g.me;const b=W.body;b.innerHTML='';const Wz=m.sk[5];
  if(!SC.P.canSpellcraft()){b.appendChild(h('div','info','Spellcraft unlocks when every skill reaches level 2. Then you can weave up to three aspects into spells of your own.'));
   b.appendChild(h('div','note',SC.SKILLS.map((S,i)=>`${S.n} ${m.sk[i]}${m.sk[i]>=2?' ✓':''}`).join(' · ')));return}
  b.appendChild(h('div','info',`Weave up to three aspects into a spell. Power scales with Wizardry (${Wz}). Transmute and Chromatic act on the item selected in your bag.`));
  if(m.spells.length){b.appendChild(h('h4','sech','Your spells'));for(let i=0;i<m.spells.length;i++){const sp=m.spells[i];const r=h('div','card srow');
    r.innerHTML=`<div><h4>✶ ${esc(sp.n)} <span class="muted" style="font-weight:400;font-size:13px">· ${SC.P.spellCost(sp)} MP</span></h4><p>${sp.a.map((k,j)=>esc(SC.ASI[k].n)+(SC.ASI[k].el&&sp.el[j]>=0?' ('+SC.ELEMENTS[sp.el[j]]+')':'')+': '+esc(SC.ASI[k].d(Wz))).join('<br>')}</p></div>`;
    const bx=h('div','bar2');const c=h('button','btn sm accept','Cast');c.onclick=()=>SC.P.castSpell(i);bx.appendChild(c);for(let q=0;q<5;q++){const bt=h('button','btn sm'+(m.quick[q]==='sp:'+i?' accept':''),String(q+4));bt.onclick=()=>{m.quick[q]='sp:'+i;UI.updateHot();W.render()};bx.appendChild(bt)}
    const del=h('button','btn sm danger','Forget');del.onclick=()=>{m.spells.splice(i,1);m.quick=m.quick.map(q=>q==='sp:'+i?'':q.startsWith('sp:')&&+q.slice(3)>i?'sp:'+(+q.slice(3)-1):q);W.render();UI.updateHot()};bx.appendChild(del);r.appendChild(bx);b.appendChild(r)}}
  b.appendChild(h('h4','sech','Weave a new spell'));const card=h('div','card');
  const nm=h('input');nm.placeholder='Spell name';nm.maxLength=20;nm.value=draft.n;nm.oninput=()=>draft.n=nm.value;card.appendChild(nm);
  const grid=h('div','aspgrid');for(const A of SC.ASPECTS){const i=draft.a.indexOf(A.k);const bt=h('button','btn sm asp'+(i>=0?' accept':''),`${esc(A.n)}`);bt.title=A.d(Wz);
   bt.onclick=()=>{const j=draft.a.indexOf(A.k);if(j>=0){draft.a.splice(j,1);draft.el.splice(j,1);draft.el.push(-1)}else if(draft.a.length<3)draft.a.push(A.k);W.render()};grid.appendChild(bt)}card.appendChild(grid);
  const prev=h('div','note');draft.a.forEach((k,j)=>{const A=SC.ASI[k];const row=h('div');row.innerHTML=`<b>${esc(A.n)}</b>: ${esc(A.d(Wz))} `;
   if(A.el){const s=h('select');s.innerHTML='<option value="-1">Pure</option>'+SC.ELEMENTS.map((e,i)=>`<option value="${i}">${e}</option>`).join('');s.value=draft.el[j];s.onchange=()=>draft.el[j]=+s.value;row.appendChild(s)}prev.appendChild(row)});
  if(draft.a.length)prev.appendChild(h('div','',`Cost: ${SC.P.spellCost(draft)} MP`));card.appendChild(prev);
  const mk=h('button','btn accept','Inscribe spell');mk.disabled=!draft.a.length||m.spells.length>=8;mk.onclick=()=>{m.spells.push({n:(draft.n||draft.a.map(k=>SC.ASI[k].n).join(' ')).slice(0,20),a:draft.a.slice(),el:draft.el.slice(0,3)});draft={n:'',a:[],el:[-1,-1,-1]};G().me.xp[5]+=5;UI.log('A new spell is written into your book.','xp');W.render()};
  card.appendChild(mk);if(m.spells.length>=8)card.appendChild(h('div','note','Your book is full (8 spells).'));b.appendChild(card)}}
// ---------- tent ----------
let tentSel={c:-1,o:-1};
function buildTent(){const W=makeWin('tentWin','Tent',{key:'tent',pos:{left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(620px,94vw)'}});WINS.tent=W;
 W.render=function(){const g=G(),m=g.me,T=m.tent;const b=W.body;b.innerHTML='';const t=SC.P.myTent();
  b.appendChild(h('div','info',`Your tent is ${T.size}×${T.size}. ${t?`It stands at ${t.x}, ${-t.y}.`:'It is packed away.'} Inside, monsters can't reach you and you recover four times as fast.`));
  const r1=h('div','card srow');r1.innerHTML='<div><h4>'+(t?'Pack up':'Pitch tent')+'</h4><p>'+(t?'Instantly packs your tent away.':`Pitches it in front of you. It needs clear ground ${T.size}×${T.size}.`)+'</p></div>';
  const bt=h('button','btn accept',t?'Pack up':'Pitch');bt.onclick=()=>{t?SC.P.pack():SC.P.pitch();setTimeout(()=>W.render(),400)};r1.appendChild(bt);b.appendChild(r1);
  const r2=h('div','card srow');r2.innerHTML=`<div><h4>Interior colour</h4><p>Hold a plant or animal specimen over the swatch for 2 seconds to dye the inside of the tent.</p></div>`;
  const sw=h('div','tentdye');sw.style.background=SC.hsl(T.hue,.38,.42);sw.title='Drop an organic item here';r2.appendChild(sw);b.appendChild(r2);
  const r3=h('div','card srow');r3.innerHTML='<div><h4>Light level</h4><p>Brightness of the lanterns inside.</p></div>';const rg=h('input');rg.type='range';rg.min=0;rg.max=100;rg.value=T.light;const lv=h('span','',T.light+'%');
  rg.oninput=()=>{SC.P.setLight(+rg.value);lv.textContent=rg.value+'%'};const wr=h('div');wr.style.display='flex';wr.style.gap='8px';wr.append(rg,lv);r3.appendChild(wr);b.appendChild(r3);
  const r4=h('div','card');const Wz=m.sk[5];
  if(!SC.hasAb(m.sk,'tentcraft')){r4.innerHTML='<h4 style="margin:0">Enlarge</h4><p class="note">Tentcraft unlocks at Wizardry 6. It enlarges the tent using one consumable and one ore; rarer consumables from later biomes and higher-tier ore make bigger tents.</p>';b.appendChild(r4);return}
  r4.innerHTML=`<h4 style="margin:0 0 6px">Enlarge (Tentcraft)</h4><p class="note">Drop one consumable (potion, food, plant or animal specimen) and one ore. Size depends on ore tier + the consumable's rarity + how far out its biome is. Your Wizardry allows up to ${SC.P.tentCap()}×${SC.P.tentCap()}.</p>`;
  const row=h('div','bar2');[['c','Consumable'],['o','Ore']].forEach(([k,l])=>{const i=tentSel[k];const it=i>=0?m.inv[i]:null;const s=UI.slotEl(it,{c:'tentslot',i:k});s.classList.add('tentslot');s.dataset.k=k;s.title=l;if(!it){s.classList.add('eqs');s.dataset.lbl=l}row.appendChild(s)});
  const pv=SC.P.enlargePreview(tentSel.c,tentSel.o);const info=h('div','note',pv?`→ ${pv.size}×${pv.size}${pv.size<=T.size?' (no bigger than now)':''}`:'');row.appendChild(info);
  const go=h('button','btn accept','Enlarge');go.disabled=!pv||pv.size<=T.size;go.onclick=()=>{SC.P.enlarge(tentSel.c,tentSel.o);tentSel={c:-1,o:-1};W.render()};row.appendChild(go);r4.appendChild(row);b.appendChild(r4)}}
// ---------- encounter ----------
function buildEnc(){const w=h('div','win frame hidden enc');w.id='encWin';w.innerHTML='<div class="wbody"></div>';$('wins').appendChild(w);WINS.enc={root:w,body:w.querySelector('.wbody')}}
UI.showEnc=function(e){const W=WINS.enc;const b=W.body;const g=G();const key=e.id+':'+e.res;if(W.key===key&&UI.isOpen('enc'))return;W.key=key;b.innerHTML='';
 const top=h('div','enctop');const por=h('canvas','encpor');por.width=por.height=16;try{game().portrait(por,e)}catch(err){}
 const txt=h('div');txt.style.flex='1';const po=g.world.poi(e.x,e.y)||{};const dsc=(po.desc||[]).map(i=>SC.DESCRIPTORS[i].w);
 const dc={friendly:'#6fdc8c',neutral:'#e8dcc0',hostile:'#ff7060'}[po.disp]||'#e8dcc0';
 txt.innerHTML=`<h3 style="color:${dc}">${esc(e.title)}</h3><div class="tags muted">${dsc.map(esc).join(' · ')}${po.disp?' · <span style="color:'+dc+'">'+po.disp+'</span>':''}${po.lvl?' · level '+po.lvl:''}</div><div class="scn">${esc(e.text)}</div><div class="intent">${esc(e.intent)}</div>`;
 top.append(por,txt);b.appendChild(top);
 if(!e.res){const o=h('div','opts');for(const op of e.opts){const bt=h('button','btn opt');bt.innerHTML=`<span>${esc(op[1])}${op[3]?'<span class="skt">✦ '+esc(op[3])+'</span>':''}</span><span class="ch">${op[2]}%</span>`;bt.onclick=()=>{game().pushReq(['choose',e.id,op[0]]);o.querySelectorAll('button').forEach(x=>x.disabled=true)};o.appendChild(bt)}b.appendChild(o)}
 else{const r=h('div','res '+(e.ok>0?'ok':'bad'));r.textContent=e.res;b.appendChild(r);const bt=h('button','btn','Continue');bt.style.marginTop='8px';bt.onclick=()=>{g.encDismissed.add(e.id);UI.close('enc')};b.appendChild(bt)}
 UI.open('enc')};

// ---------- map ----------
let mapState={cx:0,cy:0,scale:3,bamf:false};
function buildMap(){const W=makeWin('mapWin','World Map',{key:'map',pos:{left:'50%',top:'50%',transform:'translate(-50%,-50%)'}});WINS.map=W;
 W.body.innerHTML='<div class="mapwrap"><canvas id="mapCv"></canvas><div class="mapleg" id="mapLeg"></div></div>';const cv=W.body.querySelector('#mapCv');
 W.render=function(){const g=G();if(!mapState.keep){mapState.cx=g.me.x;mapState.cy=g.me.y}mapState.keep=false;drawMap()};W.onclose=()=>{mapState.bamf=false};
 let drag=null;cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,cx:mapState.cx,cy:mapState.cy,moved:false};cv.setPointerCapture(e.pointerId)});
 cv.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;const r=cv.getBoundingClientRect(),sc=mapState.scale*cv.width/r.width;mapState.cx=drag.cx-dx*(cv.width/r.width)/mapState.scale;mapState.cy=drag.cy-dy*(cv.height/r.height)/mapState.scale;drawMap()});
 cv.addEventListener('pointerup',e=>{if(drag&&!drag.moved&&mapState.bamf){const r=cv.getBoundingClientRect();const x=Math.round(mapState.cx+((e.clientX-r.left)*(cv.width/r.width)-cv.width/2)/mapState.scale),y=Math.round(mapState.cy+((e.clientY-r.top)*(cv.height/r.height)-cv.height/2)/mapState.scale);
  if(game().doBamf(x,y)){mapState.bamf=false;UI.close('map')}}drag=null});
 cv.addEventListener('wheel',e=>{e.preventDefault();mapState.scale=SC.clamp(mapState.scale*(e.deltaY<0?1.25:.8),.5,10);drawMap()},{passive:false})}
const chunkImg=new Map();
function chunkCanvas(cx,cy){const g=G();const k=cx+':'+cy;const ver=g.fog.ver(cx,cy);let c=chunkImg.get(k);if(c&&c.ver===ver)return c.cv;
 const cv=c?c.cv:document.createElement('canvas');cv.width=cv.height=SC.CH;const x=cv.getContext('2d');const img=x.createImageData(SC.CH,SC.CH);
 for(let j=0;j<SC.CH;j++)for(let i=0;i<SC.CH;i++){const X=cx*SC.CH+i,Y=cy*SC.CH+j,o=(j*SC.CH+i)*4;if(!g.fog.isExp(X,Y)){img.data[o+3]=0;continue}const col=SC.rgb(g.world.miniColor(X,Y));img.data[o]=col[0];img.data[o+1]=col[1];img.data[o+2]=col[2];img.data[o+3]=255}
 x.putImageData(img,0,0);chunkImg.set(k,{ver,cv});return cv}
function drawMap(){const g=G();const cv=$('mapCv');if(!cv)return;const r=cv.getBoundingClientRect();cv.width=Math.max(200,r.width|0);cv.height=Math.max(200,r.height|0);const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
 c.fillStyle='#050403';c.fillRect(0,0,cv.width,cv.height);const S=mapState.scale,W=cv.width/S,H=cv.height/S;
 const x0=mapState.cx-W/2,y0=mapState.cy-H/2;
 for(const ck of g.fog.chunks()){const [cx,cy]=ck.split(':').map(Number);const px=(cx*SC.CH-x0)*S,py=(cy*SC.CH-y0)*S;if(px>cv.width||py>cv.height||px+SC.CH*S<0||py+SC.CH*S<0)continue;c.drawImage(chunkCanvas(cx,cy),Math.floor(px),Math.floor(py),Math.ceil(SC.CH*S),Math.ceil(SC.CH*S))}
 const P=(x,y)=>[(x-x0)*S,(y-y0)*S];
 const [tx,ty]=P(0,0);c.fillStyle='#ffd060';c.font='16px MedievalSharp, serif';c.fillText('✦ World Tree',tx-6,ty+5);
 for(const p of g.peerList){const [x,y]=P(p.x,p.y);c.fillStyle='#000';c.fillRect(x-4,y-4,8,8);c.fillStyle=p.me?'#fff':SC.PCOL[p.col%8][0];c.fillRect(x-3,y-3,6,6);c.fillStyle='#fff';c.font='13px Averia Serif Libre, serif';c.fillText(p.n,x+6,y-4)}
 $('mapLeg').innerHTML=mapState.bamf?'<b style="color:var(--gold)">Bamf:</b> click any explored place to teleport there (anyone standing next to you comes too). Esc to cancel.':'Drag to pan · scroll to zoom · only explored land is shown';}
UI.openBamf=function(){mapState.bamf=true;UI.open('map')};

// ---------- settings ----------
let setPane='overview';
function buildSettings(){const W=makeWin('setWin','SortCraft Settings',{key:'settings',foot:true,pos:{left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(1040px,96vw)'}});WINS.settings=W;
 W.foot.innerHTML='';const rs=h('button','btn','Reset');rs.onclick=()=>{const theme=UI.S.theme;UI.S=JSON.parse(JSON.stringify(UI.DEF));UI.S.theme=theme;UI.saveSettings();UI.applyHud();W.render()};const cl=h('button','btn','Close');cl.onclick=()=>UI.close('settings');W.foot.append(rs,cl);
 W.render=function(){const b=W.body;b.innerHTML='';const wrap=h('div','setwrap');const nav=h('div','nav');const pane=h('div');
  const NAV=[['Interface',[['overview','Overview'],['theme','Theme'],['hud','HUD']]],['Controls',[['keys','Keys']]],['Game',[['graphics','Graphics'],['saves','Saves'],['mp','Multiplayer']]]];
  for(const [sec,items] of NAV){nav.appendChild(h('div','sec',sec.toUpperCase()));for(const [k,l] of items){const bt=h('button',k===setPane?'on':'',l);bt.onclick=()=>{setPane=k;W.render()};nav.appendChild(bt)}}
  wrap.append(nav,pane);b.appendChild(wrap);PANES[setPane](pane)}}
const toggleEl=(on,fn)=>{const t=h('div','toggle'+(on?' on':''));t.setAttribute('role','switch');t.tabIndex=0;t.onclick=()=>{const v=!t.classList.contains('on');t.classList.toggle('on',v);fn(v)};return t};
const PANES={
 overview(p){p.appendChild(h('div','info','Switch features on or off right here.'));const g=h('div','cards2');
  const F=[['daynight','Day and night','The sky darkens and brightens over a 12-minute day. Lanterns matter at night.'],['lights','Dynamic lighting','Lanterns, campfires, lava and crystals cast real light (WebGL).'],
   ['fog','Fog of war','Unexplored land stays hidden. Explored land you can\'t currently see is shown faded.'],['dmg','Damage numbers','Floating numbers for hits, loot and level-ups.'],
   ['names','Name labels','Names over players, NPCs and monsters.'],['autopick','Auto-pickup','Walking over a collectable picks it up.'],['blood','Blood effects','Blood sprays and stains from wounds (16+). Off shows sparks only.']];
  for(const [k,t,d] of F){const c=h('div','card fcard');const top=h('div','top');top.appendChild(h('h4','',t));top.appendChild(toggleEl(UI.S.feat[k],v=>{UI.S.feat[k]=v;UI.saveSettings()}));c.append(top,h('p','',d));g.appendChild(c)}
  p.appendChild(g)},
 theme(p){p.appendChild(h('div','info','Choose a colour theme. Seidr is the default.'));const g=h('div','themes');
  for(const t of UI.THEMES){const c=h('div','tcard'+(UI.S.theme===t.n?' on':''));c.style.background=t.bg;c.style.borderColor=t.line;
   c.innerHTML=`<div class="tn" style="color:${t.gold}">${esc(t.n)}</div><div class="tp" style="border-color:${t.line};background:${t.panel}"><div style="color:${t.gold};font-weight:700">Section heading</div><div style="color:${t.ink}">Normal text</div><div style="color:${t.muted}">dim hint text</div></div><div class="tb"><span style="background:${t.btn};color:${t.ink}">Button</span><span style="background:${t.accept};color:#fff">Accept</span><span style="background:${t.close};color:#fff">Close</span></div>`;
   c.onclick=()=>{UI.S.theme=t.n;UI.applyTheme(t.n);UI.saveSettings();WINS.settings.render()};g.appendChild(c)}p.appendChild(g)},
 hud(p){p.appendChild(h('div','info','Each HUD element can be shown, set to fade after 3 seconds of no change (it returns when something changes or you hover it), or hidden.'));
  const pre=h('div','bar2');const simple=h('button','btn sm','Simple mode');simple.title='Hide or auto-fade almost everything';simple.onclick=()=>{Object.assign(UI.S.hud,{vitals:'auto',party:'hide',biome:'auto',mini:'auto',menu:'hide',log:'auto',chat:'auto',hot:'hide',prompt:'show'});UI.saveSettings();UI.applyHud();WINS.settings.render()};
  const modern=h('button','btn sm','Full RPG HUD');modern.onclick=()=>{UI.S.hud=Object.assign({},UI.DEF.hud);UI.saveSettings();UI.applyHud();WINS.settings.render()};
  const allA=h('button','btn sm','Everything auto-hides');allA.onclick=()=>{for(const [k] of HUDKEYS)UI.S.hud[k]='auto';UI.saveSettings();UI.applyHud();WINS.settings.render()};pre.append(simple,modern,allA);p.appendChild(pre);
  for(const [k,t,d] of HUDKEYS){const r=h('div','card srow');const l=h('div');l.innerHTML=`<h4>${t}</h4><p>${d}</p>`;const seg=h('div','seg');
   [['show','Show'],['auto','Hide after 3s'],['hide','Hidden']].forEach(([v,lbl])=>{const bt=h('button',UI.S.hud[k]===v?'on':'',lbl);bt.onclick=()=>{UI.S.hud[k]=v;UI.saveSettings();UI.applyHud();WINS.settings.render()};seg.appendChild(bt)});r.append(l,seg);p.appendChild(r)}},
 keys(p){p.appendChild(h('div','info','Keyboard controls. On touch screens, use the on-screen pad.'));const K=[['WASD / Arrows','Move'],['Space or E','Talk, attack, open, mine, pick up'],['1','Dig (Geologist 1)'],['2','Blink (Wizardry 2)'],['3','Bamf (Wizardry 4)'],['Q','Drink best healing potion'],['4–8','Quick slots (abilities and spells)'],['G','Tent'],['B','Spellbook'],['I','Inventory'],['J','Compendium'],['K','Skills'],['M','Map'],['T','Chat'],['Mouse wheel, + / −','Zoom'],['Esc','Close window / settings']];
  for(const [k,d] of K){const r=h('div','card srow');r.innerHTML=`<h4>${d}</h4><span class="help"><kbd>${k}</kbd></span>`;p.appendChild(r)}},
 graphics(p){p.appendChild(h('div','info','Zoom with the mouse wheel in game. This sets the default.'));
  const r=h('div','card srow');r.innerHTML='<div><h4>Default zoom</h4><p>1.0 is the standard view. Higher values are closer.</p></div>';const inp=h('input');inp.type='range';inp.min=.35;inp.max=2.5;inp.step=.05;inp.value=UI.S.zoom;const v=h('span','',(+UI.S.zoom).toFixed(2));
  inp.oninput=()=>{UI.S.zoom=+inp.value;v.textContent=(+inp.value).toFixed(2);game().setZoom(UI.S.zoom);UI.saveSettings()};const w=h('div');w.style.display='flex';w.style.gap='10px';w.append(inp,v);r.appendChild(w);p.appendChild(r)},
 saves(p){p.appendChild(h('div','info','Your character, inventory, compendium, and the places you have explored are kept in this browser automatically. Export a save file to keep them on your disk.'));
  const r1=h('div','card srow');r1.innerHTML='<div><h4>Autosave</h4><p>Saves to this browser every 20 seconds.</p></div>';r1.appendChild(toggleEl(UI.S.autosave,v=>{UI.S.autosave=v;UI.saveSettings()}));p.appendChild(r1);
  const r2=h('div','card srow');r2.innerHTML='<div><h4>Export save file</h4><p>Downloads a .json file with your character and every explored area.</p></div>';const ex=h('button','btn accept','Export');ex.onclick=()=>game().exportSave();r2.appendChild(ex);p.appendChild(r2);
  const r3=h('div','card srow');r3.innerHTML='<div><h4>Load save file</h4><p>Replaces your character with one from a file (from the title screen).</p></div>';const im=h('button','btn','Leave world to load…');im.onclick=()=>{UI.close('settings');game().leave()};r3.appendChild(im);p.appendChild(r3);
  const r4=h('div','card srow');r4.innerHTML='<div><h4>Save now</h4><p>Write everything to this browser immediately.</p></div>';const sv=h('button','btn','Save');sv.onclick=()=>{game().saveNow();UI.log('Saved.','good')};r4.appendChild(sv);p.appendChild(r4)},
 mp(p){const g=G();p.appendChild(h('div','info','Share this code. The seed grows the same world for them; your browser runs everything that happens and streams it.'));
  const r=h('div','card srow');r.innerHTML='<div><h4>Invite code</h4><p>'+esc(game().netNote())+'</p></div>';const row=h('div');row.style.display='flex';row.style.gap='6px';const inp=h('input');inp.readOnly=true;inp.value=g.code||'';inp.style.width='260px';
  const cp=h('button','btn','Copy');cp.onclick=()=>{try{navigator.clipboard.writeText(g.code).then(()=>cp.textContent='Copied!',()=>{inp.select();cp.textContent='Ctrl+C'})}catch(e){inp.select()}};row.append(inp,cp);r.appendChild(row);p.appendChild(r);
  const lv=h('div','card srow');lv.innerHTML='<div><h4>Leave world</h4><p>Saves and returns to the title screen.'+(g.isHost?' Guests will be disconnected.':'')+'</p></div>';const lb=h('button','btn danger','Leave');lb.onclick=()=>{UI.close('settings');game().leave()};lv.appendChild(lb);p.appendChild(lv)}};

UI.build=function(){buildInv();buildChest();buildComp();buildSkills();buildBook();buildTent();buildEnc();buildMap();buildSettings();UI.initHud();
 // touch pad
 const t=h('div');t.id='touch';t.innerHTML='<div class="r"><button data-d="3">▲</button></div><div class="r"><button data-d="1">◀</button><button data-a="act">A</button><button data-d="2">▶</button></div><div class="r"><button data-d="0">▼</button></div>';document.body.appendChild(t);
 t.querySelectorAll('[data-d]').forEach(b=>{const d=+b.dataset.d;b.addEventListener('pointerdown',e=>{e.preventDefault();game().touchDir(d)});['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>game().touchDir(-1)))});
 t.querySelector('[data-a]').addEventListener('pointerdown',e=>{e.preventDefault();game().action('act')})};
SC.PCOL=[['#d8433b','#8e2720'],['#3b7fd8','#24508e'],['#3bb85a','#247538'],['#d8b33b','#8e7420'],['#9b4fd8','#62308e'],['#e07a2e','#924d1a'],['#2ec4c4','#1a7d7d'],['#e05aa0','#923a68']];
SC.PHAIR=['#5a3820','#2a2028','#c89838','#8a3020','#3a2a50','#d8d0c0','#5a3820','#2a2028'];
})();
