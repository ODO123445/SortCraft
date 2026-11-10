// SortCraft — host simulation. The inviter's browser runs this; everyone else sends requests.
(function(){
'use strict';
const SC=globalThis.SC;
const CH=SC.CH;
class Host{
 constructor(world){this.w=world;this.time=0;this.players=new Map();this.mons=new Map();this.monId=1;this.spawned=new Map();this.killed=new Map();
  this.chests=new Map();this.enc=new Map();this.encId=1;this.ev=[];this.evId=1;this.R=Math.random;}
 // ---------- persistence (host's world state) ----------
 save(){const ch={};for(const [k,c] of this.chests)ch[k]={t:c.type,i:c.items?c.items.map(SC.pack):null,g:c.gold?1:0};
  return {deltas:[...this.w.deltas],chests:ch,time:this.time}}
 load(s){if(!s)return;try{for(const [k,v] of s.deltas||[])this.w.deltas.set(k,v);
  for(const k in s.chests||{}){const c=s.chests[k];this.chests.set(k,{type:c.t,items:c.i?c.i.map(SC.unpack):null,gold:!!c.g,viewers:new Set()})}
  this.time=s.time||0}catch(e){console.warn('world load',e)}}
 // ---------- players ----------
 updatePlayer(id,pr){if(!pr)return;let p=this.players.get(id);
  if(!p){p={id,lastSeq:-1,seen:false};this.players.set(id,p)}
  p.name=String(pr.n||'Traveler').slice(0,16);p.x=pr.x|0;p.y=pr.y|0;p.sk=Array.isArray(pr.sk)?pr.sk.map(v=>SC.clamp(v|0,0,30)):[0,0,0,0,0,0];
  p.atk=SC.clamp(pr.atk|0,0,900);p.th=SC.clamp(pr.th|0,0,200);p.bl=pr.bl|0;p.inTent=!!pr.in;p.lvl=pr.lv|0;p.arm=SC.clamp(pr.arm|0,0,400);p.gold=Math.max(0,pr.gold|0);p.hp=pr.hp|0;p.stealth=!!pr.st;p.free=pr.free|0;p.dead=(pr.hp|0)<=0;
  const q=Array.isArray(pr.q)?pr.q:[];
  if(!p.seen){p.seen=true;p.lastSeq=q.reduce((m,a)=>Math.max(m,Array.isArray(a)?+a[0]||0:0),-1)}
  for(const a of q){if(!Array.isArray(a))continue;const s=+a[0];if(s>p.lastSeq){p.lastSeq=s;try{this.req(p,a)}catch(e){console.warn('req',a,e)}}}}
 removePlayer(id){this.players.delete(id);for(const c of this.chests.values())c.viewers&&c.viewers.delete(id);for(const [k,e] of this.enc)if(e.by===id)this.enc.delete(k)}
 send(to,pl){this.ev.push([this.evId++,to,pl,this.time])}
 msg(to,text){this.send(to,{msg:text})}
 near(p,x,y,r){return Math.max(Math.abs(p.x-x),Math.abs(p.y-y))<=r}
 // ---------- requests ----------
 req(p,a){const t=a[1];
  switch(t){
  case 'hit':{const m=this.mons.get(a[2]|0);if(!m)return;const reach=SC.clamp(a[4]|0,1,9);if(Math.abs(m.x-p.x)+Math.abs(m.y-p.y)>reach+2)return;
   const dmg=SC.clamp(a[3]|0,1,Math.max(40,p.atk*4+400));m.hp-=dmg;m.hit=this.time;this.fx(m.x,m.y,String(dmg),0);m.aggro=p.id;m.lastBy=p.id;
   if(a[5]&&a[5].b)m.bleed={dps:SC.clamp(+a[5].b,0,200),until:this.time+6000,next:this.time+1000,by:p.id};
   if(m.hp<=0)this.kill(m,p);return}
  case 'take':{const x=a[2]|0,y=a[3]|0;const po=this.w.poi(x,y);if(!po||po.k!=='col'||!this.near(p,x,y,1))return;
   this.w.setDelta(po.key,'t');const R=this.R,B=SC.ITEMS[po.id];const r=Math.max(B.rar|0,SC.rollRarity(R,SC.dist(x,y),0));
   const it=SC.mkItem(po.id,{r:Math.min(6,r),q:Math.floor(R()*100)});
   if(B.cat==='flora'&&(p.sk[1]|0)>=2&&R()<.2+(p.sk[1]|0)*.02)it.k=2;
   this.send(p.id,{it:[SC.pack(it)],xp:[[B.idSk,2+(B.rar|0)*2]]});return}
  case 'mine':{const x=a[2]|0,y=a[3]|0;const po=this.w.poi(x,y);if(!po||po.k!=='ore'||!this.near(p,x,y,1))return;
   this.w.setDelta(po.key,'m');const R=this.R,n=1+Math.floor(R()*2+(p.sk[3]|0)/4)+((p.sk[3]|0)>=6?1:0);const g=[[SC.pack(SC.mkItem('ore.'+po.tier,{k:n,q:Math.floor(R()*100)}))]];
   const extra=R()<.12+(p.sk[3]|0)*((p.sk[3]|0)>=8?.04:.02)?SC.mkItem('gem.'+SC.GEMS[Math.floor(R()*Math.min(16,4+po.tier*2))][0],{q:Math.floor(R()*100)}):null;
   this.send(p.id,{it:g.concat(extra?[SC.pack(extra)]:[]).map(x=>Array.isArray(x[0])?x[0]:x),xp:[['geologist',4+po.tier*2]]});return}
  case 'dig':{const x=a[2]|0,y=a[3]|0;if(!this.near(p,x,y,1))return;if((p.sk[3]|0)<1)return this.msg(p.id,'You need Geologist 1 to dig.');
   if(this.w.solid(x,y))return;const k=x+','+y,cur=this.w.deltas.get(k);if(cur==='d')return this.msg(p.id,'Already dug here.');
   const po=this.w.poi(x,y);if(po&&po.k!=='dig')return;
   this.w.setDelta(k,'d');const R=this.R;
   if(po&&po.k==='dig'){const items=SC.loot(R,x,y,this.w.biome(x,y),1+Math.floor(R()*2),1);this.send(p.id,{it:items.map(SC.pack),gold:3+Math.floor(R()*SC.levelAt(x,y)*4),xp:[['geologist',10]],msg:'You unearth a buried cache!'});this.fx(x,y,'Cache!',3)}
   else{const g=R()<.35?[SC.pack(SC.mkItem(SC.speciesRoll(R,this.w.biome(x,y),'mineral'),{q:Math.floor(R()*100)}))]:[];this.send(p.id,{it:g,xp:[['geologist',2]],msg:g.length?'You dig up a stone.':'Just dirt.'})}
   return}
  case 'open':{const x=a[2]|0,y=a[3]|0;const po=this.w.poi(x,y);if(!po||po.k!=='chest'||!this.near(p,x,y,1))return;
   let c=this.chests.get(po.key);if(!c){c={type:po.storage||po.camp?'s':'t',items:null,viewers:new Set()};this.chests.set(po.key,c)}
   if(!c.viewers)c.viewers=new Set();
   if(!c.items){c.items=new Array(24).fill(null);
    if(c.type==='t'){const R=SC.rng(SC.hseed(this.w.seed,'chest',po.key));const bi=this.w.biome(x,y);const items=SC.loot(R,x,y,bi,3+Math.floor(R()*4),.5);items.forEach((it,i)=>c.items[i]=it);
     const gold=5+Math.floor(R()*SC.levelAt(x,y)*8);this.send(p.id,{gold,msg:`The chest holds ${gold} gold, and more besides.`,xp:[['crafting',2]]});this.w.setDelta(po.key,'o')}}
   c.viewers.add(p.id);return}
  case 'close':{const c=this.chests.get((a[2]|0)+','+(a[3]|0));if(c&&c.viewers)c.viewers.delete(p.id);return}
  case 'ctake':{const c=this.chests.get((a[2]|0)+','+(a[3]|0));const s=a[4]|0;if(!c||!c.items||!c.viewers.has(p.id))return;const it=c.items[s];if(!it)return;c.items[s]=null;this.send(p.id,{it:[SC.pack(it)]});return}
  case 'cput':{const c=this.chests.get((a[2]|0)+','+(a[3]|0));const it=SC.unpack(a[5]);if(!it)return;
   if(!c||!c.items||!c.viewers.has(p.id)){this.send(p.id,{it:[SC.pack(it)]});return}
   let s=a[4]|0;if(s<0||s>=24||c.items[s]){if(s>=0&&s<24&&c.items[s]&&SC.canStack(c.items[s],it)){c.items[s].k+=it.k;return}s=c.items.indexOf(null)}
   if(s<0){this.send(p.id,{it:[SC.pack(it)],msg:'That chest is full.'});return}c.items[s]=it;return}
  case 'cmove':{const c=this.chests.get((a[2]|0)+','+(a[3]|0));const f=a[4]|0,to=a[5]|0;if(!c||!c.items||!c.viewers.has(p.id)||f<0||to<0||f>=24||to>=24)return;
   const A=c.items[f],B=c.items[to];if(A&&B&&SC.canStack(A,B)){B.k+=A.k;c.items[f]=null}else{c.items[f]=B;c.items[to]=A}return}
  case 'csort':{const c=this.chests.get((a[2]|0)+','+(a[3]|0));if(!c||!c.items||!c.viewers.has(p.id))return;c.items=SC.sortItems(c.items.filter(Boolean),a[4]||'type');while(c.items.length<24)c.items.push(null);return}
  case 'place':{const x=a[2]|0,y=a[3]|0;const k=x+','+y;
   if(!this.near(p,x,y,1)||this.w.solid(x,y)||this.w.poi(x,y)||SC.dist(x,y)<2||this.monAt(x,y)){this.send(p.id,{it:[SC.pack(SC.mkItem('misc.chest'))],msg:'You can\'t place a chest there.'});return}
   this.w.setDelta(k,'s');this.chests.set(k,{type:'s',items:new Array(24).fill(null),viewers:new Set()});this.msg(p.id,'Storage chest placed.');return}
  case 'pickup':{const x=a[2]|0,y=a[3]|0,k=x+','+y;if(this.w.deltas.get(k)!=='s'||!this.near(p,x,y,1))return;const c=this.chests.get(k);
   if(c&&c.items&&c.items.some(Boolean))return this.msg(p.id,'Empty the chest before picking it up.');
   this.w.setDelta(k,'-');this.chests.delete(k);this.dels.push(k);this.send(p.id,{it:[SC.pack(SC.mkItem('misc.chest'))]});return}
  case 'talk':{const x=a[2]|0,y=a[3]|0;const po=this.w.poi(x,y);if(!po||po.k!=='npc'||!this.near(p,x,y,2))return;this.startEnc(p,po);return}
  case 'choose':{this.choose(p,a[2]|0,String(a[3]));return}
  case 'tunnel':{const x=a[2]|0,y=a[3]|0;if(!this.near(p,x,y,1)||(p.sk[3]|0)<10)return;const t=this.w.tile(x,y);if(t!==SC.TK.ROCK&&!(t===SC.TK.SP&&this.w.solid(x,y)&&!this.w.poi(x,y))){this.msg(p.id,'Only rock gives way to your tunnelling.');return}
   this.w.setDelta(x+','+y,'r');this.fx(x,y,'Crack!',3);const R=this.R;if(R()<.4)this.send(p.id,{it:[SC.pack(SC.mkItem(SC.speciesRoll(R,this.w.biome(x,y),'mineral'),{q:Math.floor(R()*100)}))],xp:[['geologist',3]]});else this.send(p.id,{xp:[['geologist',3]]});return}
  case 'pitch':{const x=a[2]|0,y=a[3]|0,size=SC.clamp(a[4]|0,3,13)|1,hue=(a[5]|0)%360,light=SC.clamp(a[6]|0,0,100),cid=String(a[7]||'').slice(0,16),name=String(a[8]||'').replace(/\|/g,'').slice(0,16);const hh=(size-1)/2;
   if(!cid)return;for(let j=-hh;j<=hh;j++)for(let i=-hh;i<=hh;i++){const X=x+i,Y=y+j;const pp=this.w.poi(X,Y);if(this.w.solid(X,Y)&&!(pp&&pp.k==='tent'&&pp.cid===cid)||(pp&&!(pp.k==='tent'&&pp.cid===cid)&&pp.k!=='dig')||this.monAt(X,Y)||SC.dist(X,Y)<7){this.msg(p.id,'There isn\'t room to pitch your tent there.');return}}
   for(const t of [...this.w.tents.values()])if(t.cid===cid){this.w.setDelta(t.key,'-');(this.dels=this.dels||[]).push(t.key)}
   this.w.setDelta(x+','+y,['T',size,hue,light,cid,name].join('|'));this.send(p.id,{msg:'Tent pitched.',tent:[x,y]});return}
  case 'pack':{const k=(a[2]|0)+','+(a[3]|0);const t=this.w.tents.get(k);if(!t||t.cid!==String(a[4]))return;this.w.setDelta(k,'-');(this.dels=this.dels||[]).push(k);this.send(p.id,{msg:'Tent packed away.'});return}
  case 'tset':{const k=(a[2]|0)+','+(a[3]|0);const t=this.w.tents.get(k);if(!t||t.cid!==String(a[4]))return;this.w.setDelta(k,['T',SC.clamp(a[7]|0,3,13)|1,(a[5]|0)%360,SC.clamp(a[6]|0,0,100),t.cid,t.name].join('|'));return}
  case 'bamf':{const tx=a[2]|0,ty=a[3]|0;const ids=Array.isArray(a[4])?a[4]:[];let n=0;
   for(const id of ids){const o=this.players.get(id);if(!o||o.id===p.id)continue;if(Math.max(Math.abs(o.x-p.x),Math.abs(o.y-p.y))<=1){n++;this.send(o.id,{tp:[tx+((n%3)-1),ty+(n>2?1:0)],msg:`${p.name} bamfed you along!`})}}
   return}
  }
 }
 // ---------- monsters ----------
 monAt(x,y){for(const m of this.mons.values())if(m.x===x&&m.y===y)return m;return null}
 kill(m,p){this.mons.delete(m.id);if(m.spawn)this.killed.set(m.spawn,this.time);const R=this.R;const lvl=m.lvl;
  const gold=Math.floor(lvl*2+R()*lvl*3);const it=[];const bi=this.w.biome(m.x,m.y);
  if(R()<.4+(p.sk[2]>=4?p.sk[2]*.02:0))it.push(SC.mkItem(SC.speciesRoll(R,bi,'fauna'),{q:Math.floor(R()*100),r:SC.rollRarity(R,SC.dist(m.x,m.y),0)}));
  if(R()<.12||m.def>=1000)it.push(...SC.loot(R,m.x,m.y,bi,1,m.def>=1000?2:0));
  if(m.def>=1000&&R()<.6)it.push(SC.mkItem('rare.'+(m.def-1000-9),{q:Math.floor(R()*100)}));
  this.send(p.id,{gold,it:it.map(SC.pack),xp:[['hunter',4+lvl*2]]});this.fx(m.x,m.y,`+${gold}G`,3)}
 spawnMon(def,x,y,lvl,spawn,custom){const D=custom||SC.monDef(def);const mhp=Math.round(D.hp*(1+lvl*.32));
  const m={id:this.monId++,def,x,y,hx:x,hy:y,hp:mhp,mhp,atk:Math.round(D.atk*(1+lvl*.24)),lvl,spd:D.spd,cd:this.R()*800,acd:0,spawn,custom,hit:0};this.mons.set(m.id,m);return m}
 blockedFor(m,x,y){if(this.w.solid(x,y))return true;if(SC.dist(x,y)<8)return true;if(this.monAt(x,y))return true;for(const p of this.players.values())if(p.x===x&&p.y===y)return true;return false}
 activeChunks(){const set=new Set();for(const p of this.players.values()){const cx=SC.cof(p.x),cy=SC.cof(p.y);for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++)set.add((cx+i)+':'+(cy+j))}return set}
 step(dt){this.time+=dt;const now=this.time;
  // spawn / despawn
  if(!this._spt||now-this._spt>500){this._spt=now;const act=this.activeChunks();
   for(const k of act){const [cx,cy]=k.split(':').map(Number);const c=this.w.chunk(cx,cy);
    for(const s of c.spawns){if(this.spawned.has(s.key))continue;const kt=this.killed.get(s.key);if(kt!==undefined&&now-kt<90000)continue;
     if([...this.players.values()].some(p=>Math.max(Math.abs(p.x-s.x),Math.abs(p.y-s.y))<6))continue;
     const m=this.spawnMon(s.mon,s.x,s.y,SC.levelAt(s.x,s.y),s.key);this.spawned.set(s.key,m.id)}}
   for(const m of [...this.mons.values()]){const k=SC.cof(m.hx)+':'+SC.cof(m.hy);if(!act.has(k)){this.mons.delete(m.id);if(m.spawn)this.spawned.delete(m.spawn)}}
   for(const [k,id] of this.spawned)if(!this.mons.has(id)){this.spawned.delete(k)}
   // hostile NPCs confront nearby players
   for(const p of this.players.values()){if(p.dead||[...this.enc.values()].some(e=>e.by===p.id&&!e.res))continue;
    for(const po of this.w.nearbyPois(p.x,p.y,2))if(po.k==='npc'&&po.disp==='hostile'&&!this.w.deltas.get(po.key)&&![...this.enc.values()].some(e=>e.key===po.key)){this.startEnc(p,po);break}}
   // chest viewers walk away
   for(const [k,c] of this.chests){if(!c.viewers)continue;const [x,y]=k.split(',').map(Number);for(const id of [...c.viewers]){const p=this.players.get(id);if(!p||!this.near(p,x,y,3))c.viewers.delete(id)}}
  }
  // monster AI
  for(const m of [...this.mons.values()]){if(m.bleed&&this.time>=m.bleed.next){if(this.time>m.bleed.until)m.bleed=null;else{m.bleed.next+=1000;const d=Math.max(1,Math.round(m.bleed.dps));m.hp-=d;this.fx(m.x,m.y,String(d),0);if(m.hp<=0){const k=this.players.get(m.bleed.by)||[...this.players.values()][0];if(k){this.kill(m,k);continue}}}}}
  for(const m of this.mons.values()){m.cd-=dt;m.acd-=dt;
   let tgt=null,bd=99;for(const p of this.players.values()){if(p.dead||p.stealth||p.inTent||(p.bl&&m.lvl<=p.bl-5))continue;const d=Math.abs(p.x-m.x)+Math.abs(p.y-m.y);if(d<bd){bd=d;tgt=p}}
   if(tgt&&bd===1){if(m.acd<=0){m.acd=1100;const dmg=Math.max(1,m.atk-Math.floor(tgt.arm/2)+Math.floor(this.R()*3)-1);this.send(tgt.id,{hp:-dmg,from:m.id});this.fx(tgt.x,tgt.y,String(dmg),1);if(tgt.th){m.hp-=tgt.th;this.fx(m.x,m.y,String(tgt.th),0);if(m.hp<=0){this.kill(m,tgt);continue}}}continue}
   if(m.cd>0)continue;m.cd=m.spd*(0.8+this.R()*0.4);let mx=0,my=0;
   if(tgt&&bd<=6){const ax=tgt.x-m.x,ay=tgt.y-m.y;const o=Math.abs(ax)>Math.abs(ay)?[[Math.sign(ax),0],[0,Math.sign(ay)]]:[[0,Math.sign(ay)],[Math.sign(ax),0]];
    for(const [a,b] of o)if((a||b)&&!this.blockedFor(m,m.x+a,m.y+b)){mx=a;my=b;break}}
   else if(this.R()<.5){const d=(this.R()*4)|0,a=SC.DX[d],b=SC.DY[d];if(Math.abs(m.x+a-m.hx)<=7&&Math.abs(m.y+b-m.hy)<=7&&!this.blockedFor(m,m.x+a,m.y+b)){mx=a;my=b}}
   m.x+=mx;m.y+=my}
  // encounters expire
  for(const [k,e] of this.enc){if(e.res&&now-e.rt>9000)this.enc.delete(k);else if(!e.res&&now-e.t>90000)this.enc.delete(k)}
  this.ev=this.ev.filter(e=>now-e[3]<4000);
  if(this.fxl)this.fxl=this.fxl.filter(f=>now-f[4]<1200);
 }
 fx(x,y,text,c){(this.fxl||(this.fxl=[])).push([this.evId++,x,y,text,this.time,c])}
 // ---------- encounters ----------
 traitsOf(po){const t={};if(!po.desc)return t;for(const di of po.desc)for(const tr of SC.DESCRIPTORS[di].t)t[tr]=(t[tr]||0)+1;return t}
 skillFor(r,po){if(r.sk==='study')return po.t==='cre'?'hunter':po.t==='str'?'geologist':'crafting';if(r.sk==='inspect')return po.t==='str'?'geologist':'crafting';return r.sk||null}
 chance(r,po,p,tr){let c=r.b;for(const k in r.aff)if(tr[k])c+=r.aff[k]*tr[k];const sk=this.skillFor(r,po);const lv=sk?(p.sk[SC.SKI[sk]]|0):0;c+=lv*.07;
  c-=Math.max(0,po.lvl-1)*.012;c+=p.sk.reduce((a,b)=>a+b,0)*.004;if(po.disp==='friendly')c+=.1;if(po.disp==='hostile')c-=.08;
  if(r.k==='duel')c+=SC.clamp((p.atk-po.lvl*4)/60,-.2,.2);if(r.k==='attack')c+=SC.clamp((p.atk-po.lvl*3)/50,-.2,.25);
  return SC.clamp(c,.05,.95)}
 startEnc(p,po){if([...this.enc.values()].some(e=>(e.key===po.key)||(e.by===p.id&&!e.res)))return;if(this.w.deltas.get(po.key)==='n')return this.msg(p.id,`${po.name} has nothing more to say.`);
  const R=this.R,tc=po.t==='cre'?'c':po.t==='str'?'s':'h',tr=this.traitsOf(po);
  const realm=SC.BIOMES[this.w.biome(po.x,po.y)].name;
  const bi=this.w.biome(po.x,po.y);const plant=SC.ITEMS[SC.speciesRoll(R,bi,'flora')].name.toLowerCase(),mineral=SC.ITEMS[SC.speciesRoll(R,bi,'mineral')].name.toLowerCase();
  const fill=s=>s.replace(/\{name\}/g,po.name).replace(/\{realm\}/g,realm).replace(/\{plant\}/g,plant).replace(/\{mineral\}/g,mineral)
   .replace(/\{weapon\}/g,SC.pick(R,['axe','spear','sword','hammer','staff'])).replace(/\{creature\}/g,SC.pick(R,['wolf','bear','troll','elk','wyrm']));
  let text,intent;
  if(po.special==='sapling'){text='The Elder Sapling rustles. Its bark splits into a weathered, ancient face, sap weeping from old axe-scars.';intent='It offers guidance to any who would walk out into the wild realms.'}
  else{text=fill(SC.pick(R,SC.SCEN[po.t]||SC.SCEN.hum));intent=fill(po.t==='str'?SC.pick(R,SC.INTENT.str):SC.pick(R,SC.INTENT[po.disp]))}
  // choose 4 responses
  const pool=SC.RESPONSES.filter(r=>r.f.includes(tc));const chosen=[];const has=k=>chosen.some(c=>c.k===k);
  const safe=pool.filter(r=>r.k==='avoid'||r.k==='flee');if(safe.length)chosen.push(SC.pick(R,safe));
  if(po.disp==='hostile'){const ag=pool.filter(r=>(r.k==='attack'||r.k==='intimidate'||r.k==='duel')&&!has(r.k));if(ag.length)chosen.push(SC.pick(R,ag))}
  const skilled=pool.filter(r=>r.sk&&!has(r.k)).map(r=>({r,lv:p.sk[SC.SKI[this.skillFor(r,po)]]|0})).sort((a,b)=>b.lv-a.lv+(R()-.5)*.8);
  if(skilled.length)chosen.push(skilled[0].r);
  const rest=SC.shuffle(R,pool.filter(r=>!has(r.k))).map(r=>({r,s:Object.keys(r.aff).reduce((a,k)=>a+Math.abs(r.aff[k])*(tr[k]||0),0)+R()*.5})).sort((a,b)=>b.s-a.s);
  for(const x of rest){if(chosen.length>=4)break;if(!has(x.r.k))chosen.push(x.r)}
  const opts=SC.shuffle(R,chosen).slice(0,4).map(r=>{const sk=this.skillFor(r,po);const lv=sk?p.sk[SC.SKI[sk]]|0:0;
   let label=r.l;if(r.k==='bribe')label+=` (${po.lvl*4+5}g)`;if(r.k==='trade')label+=` (${po.lvl*6+10}g)`;if(r.cost==='mp')label+=' (6 MP)';
   return [r.k,label,Math.round(this.chance(r,po,p,tr)*100),sk&&lv>0?`${SC.SKILLS[SC.SKI[sk]].n} ${lv}`:'']});
  const e={id:this.encId++,by:p.id,key:po.key,x:po.x,y:po.y,title:po.title||po.name,text,intent,opts,res:'',ok:0,t:this.time,po};
  this.enc.set(e.id,e)}
 choose(p,id,k){const e=this.enc.get(id);if(!e||e.by!==p.id||e.res)return;const o=e.opts.find(o=>o[0]===k);if(!o)return;const r=SC.RESPONSES[SC.RESI[k]];const po=e.po;const R=this.R;
  const g={xp:[]};
  if(r.k==='bribe'||r.k==='trade'){const cost=r.k==='bribe'?po.lvl*4+5:po.lvl*6+10;if(p.gold<cost){e.res='You don\'t have enough gold.';e.ok=-1;e.rt=this.time;return}g.gold=-cost}
  if(r.cost==='mp')g.mp=-6;
  const win=R()*100<o[2];const fx=win?r.win:r.lose;const bi=this.w.biome(po.x,po.y);const lvl=po.lvl;const sk=this.skillFor(r,po);
  const lines=[(SC.OUTCOME[k]||['Done.','Hm.'])[win?0:1].replace(/\{name\}/g,po.name)];
  let hostile=false;
  for(const f of fx){switch(f){
   case 'dmg':g.hp=(g.hp||0)-Math.round(3+lvl*1.5);break;
   case 'fight':hostile=true;break;
   case 'first':g.first=1;break;
   case 'item':(g.it=g.it||[]).push(...SC.loot(R,po.x,po.y,bi,1,0).map(SC.pack));break;
   case 'rareitem':(g.it=g.it||[]).push(...SC.loot(R,po.x,po.y,bi,1,2.5).map(SC.pack));break;
   case 'gold':g.gold=(g.gold||0)+Math.round(lvl*3+R()*lvl*4+5);break;
   case 'loseGold':g.gold=(g.gold||0)-Math.min(p.gold,Math.round(lvl*3+5));break;
   case 'xp':g.xp.push([sk||SC.pick(R,SC.SKILLS).k,10+lvl*2]);break;
   case 'xpany':g.xp.push([SC.pick(R,SC.SKILLS).k,8+lvl*2]);break;
   case 'reveal':{const a=R()*Math.PI*2,d=15+R()*25;g.rv=[Math.round(po.x+Math.cos(a)*d),Math.round(po.y+Math.sin(a)*d),10+Math.min(12,lvl)];lines.push('The surrounding land is revealed on your map.');break}
   case 'heal':g.hp=(g.hp||0)+20;g.mp=(g.mp||0)+10;break;
   case 'buff':g.buff={atk:2+Math.floor(lvl/3),arm:2+Math.floor(lvl/4),dur:120};lines.push('You feel emboldened (+ATK, +ARM for 2 minutes).');break;
   case 'specimen':{const cat=po.t==='cre'?'fauna':po.t==='str'?'mineral':'flora';(g.it=g.it||[]).push(SC.pack(SC.mkItem(SC.speciesRoll(R,bi,cat),{q:Math.floor(R()*100),r:SC.rollRarity(R,SC.dist(po.x,po.y),1)})));break}
  }}
  if(po.special==='sapling'){hostile=false;delete g.hp;if(win||true){g.xp.push([SC.pick(R,SC.SKILLS).k,6]);lines.push('"Walk outward, little one. The farther you go, the stranger and richer the realms become."')}}
  if(hostile){const tr=this.traitsOf(po);const K=po.kind>=0?SC.NPCKINDS[po.kind]:null;const shape=K?(K.t==='hum'?'hum':K.s||'quad'):'hum';
   if(po.t==='str'){lines.push(`${po.name} shudders, and something answers from within!`);const ms=SC.monstersFor(bi);const m=this.spawnMon(SC.pick(R,ms),po.x+1,po.y,lvl+1,null);m.aggro=p.id}
   else{const m=this.spawnMon(-1,po.x,po.y,lvl+1,null,{n:po.name,s:shape,c:K?K.c:['#888','#444'],hp:14,atk:5,spd:500});if(g.first){m.hp=Math.round(m.hp*.65);this.fx(m.x,m.y,'Ambush!',0)}}
   delete g.first}
  else delete g.first;
  if(!g.xp.length)delete g.xp;
  if(po.special!=='sapling')this.w.setDelta(po.key,'n');
  e.res=lines.join(' ');e.ok=win?1:-1;e.rt=this.time;e.picked=k;
  this.send(p.id,g)}
 // ---------- what the host broadcasts ----------
 snapshot(){const ps=[...this.players.values()];const near=(x,y,r)=>ps.some(p=>Math.abs(p.x-x)<=r&&Math.abs(p.y-y)<=r);
  const m=[];for(const x of this.mons.values())if(near(x.x,x.y,16)){const a=[x.id,x.def,x.x,x.y,Math.max(0,x.hp),x.mhp,x.lvl];if(x.custom)a.push(x.custom.n,x.custom.s,x.custom.c[0],x.custom.c[1]);m.push(a)}
  const e=[];for(const x of this.enc.values())e.push([x.id,x.by,x.x,x.y,x.title,x.text,x.intent,x.opts,x.res,x.ok,x.picked||'']);
  const c={};for(const [k,ch] of this.chests)if(ch.viewers&&ch.viewers.size&&ch.items)c[k]=ch.items.map(SC.pack);
  const dl=[];for(const [k,v] of this.w.deltas){const i=k.indexOf(',');const x=+k.slice(0,i),y=+k.slice(i+1);if(near(x,y,40))dl.push([x,y,v]);if(dl.length>=150)break}
  if(this.dels&&this.dels.length){for(const k of this.dels.slice(-10)){const [x,y]=k.split(',').map(Number);dl.push([x,y,'-'])}if(this.dels.length>10)this.dels=this.dels.slice(-10)}
  return {t:Math.round(this.time),m,e,c,dl,ev:this.ev.map(v=>[v[0],v[1],v[2]]),fx:(this.fxl||[]).map(f=>[f[0],f[1],f[2],f[3],f[5]])}}
}
SC.Host=Host;
SC.sortItems=function(items,mode){const ord=['weapon','armor','potion','gem','rare','ore','ingot','pattern','relic','flora','fauna','mineral','misc'];
 const k=it=>{const B=SC.ITEMS[it.b]||{};const s=SC.stats(it);
  if(mode==='rarity')return [-(it.r|0),ord.indexOf(B.cat),s.name];if(mode==='value')return [-s.val*it.k,s.name];if(mode==='name')return [s.name];
  if(mode==='realm')return [B.bi===undefined?99:B.bi,ord.indexOf(B.cat),s.name];return [ord.indexOf(B.cat),-(it.r|0),s.name]};
 // merge stacks first
 const out=[];for(const it of items){const t=out.find(o=>SC.canStack(o,it)&&o.k<SC.MAXSTACK);if(t)t.k+=it.k;else out.push(SC.clone(it))}
 return out.sort((a,b)=>{const A=k(a),B=k(b);for(let i=0;i<A.length;i++){if(A[i]<B[i])return -1;if(A[i]>B[i])return 1}return 0})};
// fit host presence under the platform's 4 KiB limit
const enc=typeof TextEncoder!=='undefined'?new TextEncoder():null;
SC.bytes=s=>enc?enc.encode(s).length:Buffer.byteLength(s);
SC.fitPresence=function(o,limit){limit=limit||3950;let j=JSON.stringify(o);if(SC.bytes(j)<=limit)return o;o=Object.assign({},o);
 const steps=[()=>{o.dl=o.dl.slice(0,Math.floor(o.dl.length/2))},()=>{o.fx=o.fx.slice(-3)},()=>{o.m=o.m.slice(0,Math.floor(o.m.length*.7))},
  ()=>{o.e=o.e.map(e=>{e=e.slice();e[5]=String(e[5]).slice(0,120);e[6]=String(e[6]).slice(0,90);e[8]=String(e[8]).slice(0,160);return e})},
  ()=>{const ks=Object.keys(o.c);if(ks.length>1){const c={};c[ks[0]]=o.c[ks[0]];o.c=c}},()=>{o.dl=[]},()=>{o.m=o.m.slice(0,6)},()=>{o.ev=o.ev.slice(-Math.max(1,Math.floor(o.ev.length/2)))},()=>{o.c={}}];
 for(const s of steps){s();j=JSON.stringify(o);if(SC.bytes(j)<=limit)return o}
 return o};
})();
