// SortCraft — abilities, custom spells, tents (with interiors), blood effects
(function(){
'use strict';
const SC=globalThis.SC;const P=SC.P={};
const G=()=>SC.G,g=()=>SC.game,UI=()=>SC.UI;
const now=()=>performance.now();
const lv=k=>G().me.sk[SC.SKI[k]]|0;
const has=k=>SC.hasAb(G().me.sk,k);
P.cd={};
P.cdLeft=k=>Math.max(0,(P.cd[k]||0)-now());

// ---------- movement speed ----------
P.speed=function(m){let s=1+(m.permSpeed||0);if(SC.hasAb(m.sk,'verdant'))s+=.1;if(SC.hasAb(m.sk,'fleetfoot'))s+=.1;if(SC.hasAb(m.sk,'quicksilver'))s+=.15;
 for(const b of m.buffs)if(b.speed&&b.until>now())s+=b.speed;return s};

// ---------- helpers ----------
function monsIn(cx,cy,r){const out=[];for(const m of G().mons.values())if(Math.max(Math.abs(m.tx-cx),Math.abs(m.ty-cy))<=r)out.push(m);return out}
function lineMon(range){const m=G().me;for(let k=1;k<=range;k++){const x=m.x+SC.DX[m.d]*k,y=m.y+SC.DY[m.d]*k;const mo=g().monAt(x,y);if(mo)return mo;if(G().world.solid(x,y))break}return null}
function hit(mo,dmg,reach,flags){if(!mo)return;dmg=Math.max(1,Math.round(dmg));g().pushReq(['hit',mo.id,dmg,Math.min(9,reach||1)].concat(flags?[flags]:[]))}
function spark(x,y,col){P.bleed(x,y,6,'spark',col)}
function buff(o,sec){G().me.buffs.push(Object.assign({until:now()+sec*1000},o));g().recompute()}
P.attackMods=function(mo,dmg){const m=G().me;let flags=null;
 if(m.bleedHits>0){m.bleedHits--;flags={b:m.bleedDps}}
 if(G().markId===mo.id&&now()<G().markUntil)dmg*=1.3;
 if(has('ambush')&&mo.hp>=mo.mhp)dmg*=2;
 return {dmg,flags}};

// ---------- abilities ----------
P.cast=function(k){const m=G().me;const A=SC.ABI[k];if(!A)return;const L=lv(A.sk);
 if(L<A.lv){UI().log(`${A.n} unlocks at ${SC.SKILLS[SC.SKI[A.sk]].n} ${A.lv}.`,'bad');return}
 if(!A.act){UI().log(`${A.n} is always active.`);return}
 if(k==='blink'||k==='bamf')return g().action(k);
 const left=P.cdLeft(k);if(left>0){UI().log(`${A.n} is ready in ${Math.ceil(left/1000)}s.`,'bad');return}
 if(m.mp<A.mp){UI().log('Not enough magic.','bad');return}
 const ok=EFFECTS[k]?EFFECTS[k](L,m):false;if(ok===false)return;
 m.mp-=A.mp;P.cd[k]=now()+A.cd*1000;g().addXP(A.sk,2+Math.round(A.mp/4));g().done()};
const EFFECTS={
 poultice(L,m){const i=m.inv.findIndex(it=>it&&SC.ITEMS[it.b].cat==='flora');if(i<0){UI().log('You need a plant in your bag.','bad');return false}g().consume(i);m.hp=Math.min(m.mhp,m.hp+6+L*3);g().float(m.x,m.y,'+'+(6+L*3),'#70f090')},
 thornward(L,m){buff({thorns:Math.ceil(L/2)},60);UI().log('Thorns bristle across your skin.','good')},
 seedcall(L,m){const R=Math.random,bi=G().world.biome(m.x,m.y);const n=2+Math.floor(R()*3);for(let i=0;i<n;i++)g().addItem(SC.mkItem(SC.speciesRoll(R,bi,'flora'),{q:Math.floor(R()*100),r:SC.rollRarity(R,SC.dist(m.x,m.y),0)}));UI().log(`${n} wild plants answer your call.`,'loot')},
 bleed(L,m){m.bleedHits=3;m.bleedDps=+(L*.8+1).toFixed(1);UI().log('Your edge is serrated: the next 3 hits will bleed.','good')},
 mark(L,m){let best=null,bd=99;for(const mo of G().mons.values()){const d=Math.abs(mo.tx-m.x)+Math.abs(mo.ty-m.y);if(d<bd){bd=d;best=mo}}if(!best||bd>10){UI().log('Nothing to mark.','bad');return false}G().markId=best.id;G().markUntil=now()+20000;g().float(best.tx,best.ty,'MARKED','#ff9040')},
 volley(L,m){const ms=monsIn(m.x,m.y,3);if(!ms.length){UI().log('Nothing in range.','bad');return false}for(const mo of ms)hit(mo,G().derived.atk*.7,4)},
 stoneskin(L){buff({arm:L},60);UI().log('Your skin hardens to granite.','good')},
 tunnel(L,m){const x=m.x+SC.DX[m.d],y=m.y+SC.DY[m.d];g().pushReq(['tunnel',x,y]);m.swingT=now()},
 seismic(L,m){G().fog.reveal(m.x,m.y,12+L);G().seismicUntil=now()+60000;G().miniDirty=true;UI().log('The ground hums. Ore and buried things show on your minimap.','good')},
 quake(L,m){const ms=monsIn(m.x,m.y,2);for(const mo of ms)hit(mo,L*2.5,3);P.bleed(m.x,m.y,10,'dust');if(!ms.length)UI().log('The earth shakes, harmlessly.')},
 flask(L,m){const i=m.inv.findIndex(it=>it&&it.b==='pot');if(i<0){UI().log('You need a potion to throw.','bad');return false}g().consume(i);const tx=m.x+SC.DX[m.d]*3,ty=m.y+SC.DY[m.d]*3;
  for(const mo of monsIn(tx,ty,2))hit(mo,8+L*3,6);P.bleed(tx,ty,14,'spark','#a0ff60');g().float(tx,ty,'Boom!','#c0ff70')},
 philosopher(L,m){m.hp=m.mhp;m.mp=m.mmp;g().float(m.x,m.y,'Restored','#ffd860')},
 heal(L,m){const n=10+L*4;m.hp=Math.min(m.mhp,m.hp+n);g().float(m.x,m.y,'+'+n,'#70f090');spark(m.x,m.y,'#a0ffb0')},
 mending(L,m){m.hots.push({per:2+L*.6,until:now()+20000,next:now()+1000});UI().log('Warm light knits your wounds.','good')},
 bolt(L,m){const mo=lineMon(7);if(!mo){UI().log('No target ahead.','bad');return false}hit(mo,8+L*3,8);spark(mo.tx,mo.ty,'#b8a0ff')},
 ward(L,m){m.ward=L*4;m.wardUntil=now()+60000;UI().log(`A ward of ${L*4} shimmers around you.`,'good')},
 chain(L,m){const ms=monsIn(m.x,m.y,5).sort((a,b)=>(Math.abs(a.tx-m.x)+Math.abs(a.ty-m.y))-(Math.abs(b.tx-m.x)+Math.abs(b.ty-m.y))).slice(0,3);if(!ms.length){UI().log('No targets.','bad');return false}
  for(const mo of ms){hit(mo,6+L*2.5,6);spark(mo.tx,mo.ty,'#a0d8ff')}},
 timeslip(L,m){buff({speed:.6},10+Math.floor(L/3));UI().log('Time thins around you.','good')},
 starfall(L,m){const tx=m.x+SC.DX[m.d]*3,ty=m.y+SC.DY[m.d]*3;for(const mo of monsIn(tx,ty,3))hit(mo,15+L*4,7);for(let i=0;i<5;i++)spark(tx+Math.round(Math.random()*4-2),ty+Math.round(Math.random()*4-2),'#fff0a0')}};

// ---------- custom spells ----------
P.canSpellcraft=()=>G().me.sk.every(v=>v>=2);
P.spellCost=function(sp){const W=lv('wizardry');let c=0;for(const a of sp.a){const A=SC.ASI[a];c+=A?A.cost:0}return Math.max(1,Math.round(c*(1+W*.03)))};
P.castSpell=function(i){const m=G().me;const sp=m.spells[i];if(!sp)return;const W=lv('wizardry');const key='sp'+i;
 if(P.cdLeft(key)>0){UI().log(`${sp.n} is ready in ${Math.ceil(P.cdLeft(key)/1000)}s.`,'bad');return}
 const cost=P.spellCost(sp);if(m.mp<cost){UI().log('Not enough magic.','bad');return}
 if(sp.a.includes('mana')&&m.hp<=4+W/2+1){UI().log('Too weak to draw aether from your own blood.','bad');return}
 m.mp-=cost;P.cd[key]=now()+2500;const sel=UI().sel?g().itemAt(UI().sel):null;
 sp.a.forEach((a,j)=>{const el=sp.el?sp.el[j]:-1;const col=el>=0?SC.ELCOL[el]:'#c0a8ff';switch(a){
  case'heal':m.hp=Math.min(m.mhp,m.hp+6+W*2);g().float(m.x,m.y,'+'+(6+W*2),'#70f090');break;
  case'mana':m.mp=Math.min(m.mmp,m.mp+4+W);m.hp-=Math.round(4+W/2);g().float(m.x,m.y,'-'+Math.round(4+W/2),'#ff6060');P.bleed(m.x,m.y,4,'red');break;
  case'bolt':{const mo=lineMon(7);if(mo){hit(mo,5+W*2,8);spark(mo.tx,mo.ty,col)}break}
  case'nova':for(const mo of monsIn(m.x,m.y,2))hit(mo,4+W*1.5,3);spark(m.x,m.y,col);break;
  case'bleed':m.bleedHits=2;m.bleedDps=+(1+W*.5).toFixed(1);break;
  case'haste':buff({speed:.2+W/100},15);if(W>=20&&(m.permSpeed||0)<.3){m.permSpeed=Math.min(.3,(m.permSpeed||0)+.01);UI().log(`Your speed is permanently +${Math.round(m.permSpeed*100)}%.`,'xp')}break;
  case'armour':buff({arm:2+W},45);break;
  case'might':buff({atk:2+Math.ceil(W/2)},45);break;
  case'veil':buff({stealth:1},20+W);break;
  case'sight':G().fog.reveal(m.x,m.y,8+W);G().miniDirty=true;break;
  case'light':buff({light:3},60+W*5);break;
  case'blink':{for(let k=3+Math.floor(W/4);k>=1;k--){const x=m.x+SC.DX[m.d]*k,y=m.y+SC.DY[m.d]*k;if(!g().blocked(x,y)){m.x=x;m.y=y;g().onStep(true);break}}break}
  case'ward':m.ward=(m.ward||0)+W*3+5;m.wardUntil=now()+60000;break;
  case'thorns':buff({thorns:1+Math.ceil(W/2)},45);break;
  case'grow':{const bi=G().world.biome(m.x,m.y);g().addItem(SC.mkItem(SC.speciesRoll(Math.random,bi,'flora'),{q:Math.floor(Math.random()*100)}));break}
  case'transmute':{if(!sel||!SC.isStone(sel)||UI().sel.c!=='inv'){UI().log('Transmute needs a selected stone, ore, mineral or gem in your bag.','bad');break}const res=SC.transmuteStone(sel,Math.random);g().consume(UI().sel.i);g().addItem(res);UI().log(`It becomes ${SC.stats(res).name}.`,'loot');break}
  case'dye':{if(!sel||!(SC.ITEMS[sel.b].cat==='weapon'||SC.ITEMS[sel.b].cat==='armor')){UI().log('Chromatic needs selected gear.','bad');break}sel.h=SC.hueOf(el>=0?SC.ELCOL[el]:'#a080ff');sel.hs=.7;break}}});
 g().addXP('wizardry',2+Math.round(cost/5));g().float(m.x,m.y,sp.n,'#c8b0ff');g().done()};
P.useQuick=function(i){const m=G().me;const q=(m.quick||[])[i];if(!q){UI().log('Empty quick slot. Assign abilities from the Skills window.');return}if(q.startsWith('sp:'))return P.castSpell(+q.slice(3));return P.cast(q)};

// ---------- per-second upkeep ----------
P.tick=function(){const m=G().me,t=now();
 for(const h of m.hots){while(t>=h.next&&h.next<=h.until){m.hp=Math.min(m.mhp,m.hp+h.per);h.next+=1000;g().float(m.x,m.y,'+'+Math.round(h.per),'#70f090')}}m.hots=m.hots.filter(h=>h.until>t);
 if(m.wardUntil&&t>m.wardUntil){m.ward=0;m.wardUntil=0}
 if(has('lifebloom'))m.hp=Math.min(m.mhp,m.hp+lv('botanist')*.15)};
P.thorns=()=>{let t=0;for(const b of G().me.buffs)if(b.thorns&&b.until>now())t+=b.thorns;return t};

// ---------- tents ----------
P.myTent=function(){const m=G().me;for(const t of G().world.tents.values())if(t.cid===m.cid)return t;return null};
P.tentCap=()=>3+2*Math.max(0,Math.floor((lv('wizardry')-2)/4));
P.tentFootprintFree=function(cx,cy,size){const W=G().world,h=(size-1)/2,mine=P.myTent();
 for(let j=-h;j<=h;j++)for(let i=-h;i<=h;i++){const x=cx+i,y=cy+j;const po=W.poi(x,y);const own=po&&po.k==='tent'&&mine&&po.cid===mine.cid;
  const mo=g().monAt(x,y);if((W.solid(x,y)&&!own)||(po&&!own&&po.k!=='dig')||(mo&&!mo.owner)||SC.dist(x,y)<7)return false}return true};
P.pitch=function(){const m=G().me,T=m.tent;const h=(T.size-1)/2;let cx=m.x,cy=m.y;
 if(m.d===3)cy=m.y-1-h;else if(m.d===0)cy=m.y+1+h;else if(m.d===1)cx=m.x-1-h;else cx=m.x+1+h;
 if(!P.tentFootprintFree(cx,cy,T.size)){UI().log(`No room: a ${T.size}×${T.size} tent needs clear, flat ground in front of you (and not inside the camp).`,'bad');return}
 g().pushReq(['pitch',cx,cy,T.size,T.hue,T.light,m.cid,G().name])};
P.pack=function(){const t=P.myTent();if(!t){UI().log('Your tent is not pitched.');return}if(G().inside&&G().inside.key===t.key)P.exit();g().pushReq(['pack',t.x,t.y,G().me.cid])};
P.sync=function(){const t=P.myTent(),T=G().me.tent;if(t)g().pushReq(['tset',t.x,t.y,G().me.cid,T.hue,T.light,T.size])};
P.dyeInterior=function(i){const m=G().me,it=m.inv[i];if(!it||!SC.ORGANIC.includes(SC.ITEMS[it.b].cat)){UI().log('Use a plant or animal specimen to dye the tent.','bad');return}
 m.tent.hue=SC.hueOf(SC.ITEMS[it.b].col[0]);g().consume(i);UI().log('The tent fabric drinks in the colour.','good');P.sync();g().done()};
P.setLight=function(v){G().me.tent.light=SC.clamp(v|0,0,100);clearTimeout(P._lt);P._lt=setTimeout(P.sync,250)};
P.isConsumable=it=>{const B=SC.ITEMS[it.b];return B&&(B.cat==='potion'||B.cat==='flora'||B.cat==='fauna'||it.b==='misc.bread'||it.b==='misc.mead')};
P.enlargePreview=function(ci,oi){const m=G().me,c=m.inv[ci],o=m.inv[oi];if(!c||!o||!P.isConsumable(c)||SC.ITEMS[o.b].cat!=='ore')return null;
 const B=SC.ITEMS[c.b];const bt=B.bi!==undefined?SC.BIOMES[B.bi].tier:0;const score=SC.ITEMS[o.b].tier+(c.r|0)+bt;const size=Math.min(13,3+2*Math.floor(score/3),P.tentCap());return {size,score}};
P.enlarge=function(ci,oi){const m=G().me;if(!has('tentcraft')){UI().log('Tentcraft unlocks at Wizardry 6.','bad');return}const pv=P.enlargePreview(ci,oi);if(!pv){UI().log('Choose one consumable and one ore.','bad');return}
 if(pv.size<=m.tent.size){UI().log(`These would only make a ${pv.size}×${pv.size} tent. Use ore from farther out, a rarer consumable from a later biome, or raise Wizardry (cap ${P.tentCap()}×${P.tentCap()}).`,'bad');return}
 const a=Math.max(ci,oi),b=Math.min(ci,oi);g().consume(a);g().consume(b);m.tent.size=pv.size;g().addXP('wizardry',10+pv.size*2);UI().log(`Your tent is now ${pv.size}×${pv.size}.`,'xp');
 const t=P.myTent();if(t)g().pushReq(['pitch',t.x,t.y,pv.size,m.tent.hue,m.tent.light,m.cid,G().name]);g().done()};
P.furn=function(I){I=I||G().inside;if(!I)return null;const t=G().world.tents.get(I.key)||I.t;return G().tentF.get(t.cid)||null};
P.interiorFree=function(x,y){const I=G().inside;if(!I)return false;const L=I.lay;if(x<1||y<1||x>=L.W-1||y>=L.H-1)return false;const k=L.t[y*L.W+x];if(!(k==='floor'||k==='rug'||k==='rugb'))return false;const F=P.furn();if(F&&F.has(x+','+y))return false;if(x===L.door[0]&&y>=L.H-2)return false;return true};
P.enter=function(t){const lay=SC.TentLayout(t.size);G().inside={key:t.key,t,lay,x:lay.door[0],y:lay.door[1]-1,rx:lay.door[0],ry:lay.door[1]-1,d:3};G().dirty=true;
 UI().setBiome({name:(t.name?t.name+'\'s ':'')+'Tent',sub:'Safe from monsters'},0);if(SC.Music){SC.Music.play(SC.MUSIC_TENT);SC.Music.duckTo=.7}UI().log('You duck inside. Rest at the bedroll (Space) to recover fully.')};
P.exit=function(){const I=G().inside;if(!I)return;G().inside=null;if(SC.Music)SC.Music.duckTo=1;if(G().chest&&G().chest.tent){UI().close('chest')}const t=I.t,h=(t.size-1)/2;const m=G().me;g().teleport(t.x,t.y+h+1);m.d=0;G().dirty=true;G().lastBiome=-1;g().onStep(true)};
P.insideStep=function(d){const I=G().inside;const nx=I.x+SC.DX[d],ny=I.y+SC.DY[d];I.d=d;const L=I.lay;if(nx<0||ny<0||nx>=L.W||ny>=L.H)return false;const k=L.t[ny*L.W+nx];
 if(k==='door'){P.exit();return true}if(L.solid(k)||k==='bed')return false;const F=P.furn(I);if(F&&F.has(nx+','+ny))return false;I.x=nx;I.y=ny;G().dirty=true;return true};
P.insideAct=function(){const I=G().inside,m=G().me;const fx=I.x+SC.DX[I.d],fy=I.y+SC.DY[I.d];const L=I.lay;const k=L.t[fy*L.W+fx];const F=P.furn(I);const t=G().world.tents.get(I.key)||I.t;
 if(F&&F.has(fx+','+fy)){const kind=F.get(fx+','+fy);const key='tent:'+t.cid+'@'+fx+','+fy;G().chest={key,tent:I.key,ix:fx,iy:fy,storage:true,kind,items:null,t0:performance.now()};g().pushReq(['open',key]);UI().open('inv');UI().open('chest');return}
 if(k==='bed'){m.hp=m.mhp;m.mp=m.mmp;g().float(m.x,m.y,'Rested','#ffd860');UI().log('You sleep a while on the bedroll, and wake restored.','good');return}
 if(k==='lamp'){UI().toggle('tent');return}if(k==='door'){P.exit()}};
P.renderInterior=function(R,t,w,h,zoom){const I=G().inside,m=G().me;const tent=G().world.tents.get(I.key)||I.t;I.t=tent;const hue=tent.hue,light=tent.light/100;
 if(tent.size!==I.lay.W-4){const L=SC.TentLayout(tent.size);I.lay=L;I.x=Math.min(I.x,L.W-2);I.y=Math.min(I.y,L.H-2)}
 const L=I.lay;const sp=16;const fit=Math.min(w/((L.W+.5)*sp),h/((L.H+1.5)*sp));zoom=Math.max(zoom*.55,Math.min(zoom,fit));const fits=fit>=zoom;
 const cx=fits?(L.W*sp)/2:I.rx*sp+8,cy=fits?(L.H*sp)/2:I.ry*sp+8;R.begin(Math.round(cx*zoom)/zoom,Math.round(cy*zoom)/zoom,zoom);
 for(let y=0;y<L.H;y++)for(let x=0;x<L.W;x++){const k=L.t[y*L.W+x];if(k!=='floor'&&k!=='rug'&&k!=='rugb'&&k!=='wall'&&k!=='door')R.quad(R.intCell('floor',hue,(x*7+y)%4),x*sp,y*sp,sp,sp,1,1,1,0);
  R.quad(R.intCell(k,hue,(x*7+y)%4),x*sp,y*sp,sp,sp,1,1,1,k==='lamp'?1:0);if(k==='lamp')R.addLight(x*sp+8,y*sp+6,80+tent.size*6,[1,.8,.5],.25+light*.9)}
 const F=P.furn(I);if(F)for(const [k,kind] of F){const [fx,fy]=k.split(',').map(Number);if(fx<L.W&&fy<L.H)R.quad(R.intCell(kind.slice(5),hue,0),fx*sp,fy*sp,sp,sp,1,1,1,0)}
 const ents=[];const add=(id,col,look,x,y,d,walk,cs)=>{const mov=now()-(walk||0)<120;const fr=mov?(((t/130)|0)%2)+1:0;const cu=cs?SC.custObj(cs):null;ents.push({y,f:()=>R.quadBig(R.playerBig(look,cu,cs,d,fr),x*sp-4.8,y*sp-7.2,25.6,25.6,1,1,1,0)})};
 add('me',G().col,SC.lookFromEq(m.eq,G().col),I.rx,I.ry,I.d,I.walk,G().custStr);
 for(const [id,p] of G().peers){const pr=p.presence;if(pr.in!==I.key)continue;add(id,(pr.col|0)%8,SC.lookUnpack(pr.ap,(pr.col|0)%8),pr.ix|0,pr.iy|0,pr.d|0,0,typeof pr.cu==='string'?pr.cu:'')}
 ents.sort((a,b)=>a.y-b.y);ents.forEach(e=>e.f());R.addLight(I.rx*sp+8,I.ry*sp+8,60,[1,.85,.6],.25);
 const a=.08+light*.85;R.end({time:t/1000,lights:UI().S.feat.lights,fogOn:false,amb:[a,a*.88,a*.7],fog:{x0:-1e4,y0:-1e4,w:1,h:1,data:new Uint8Array([255])}});
 return {cx,cy,zoom}};

// ---------- blood ----------
const parts=[],decals=[];P.parts=parts;P.decals=decals;
const COL={red:[.62,.03,.03],ooze:null,spark:null,dust:[.55,.5,.45],bone:[.8,.78,.7]};
P.bleed=function(tx,ty,amount,kind,col){if(!UI().S.feat.blood&&(kind==='red'||kind==='ooze'))return;const c=col?SC.rgb(col).map(v=>v/255):COL[kind]||COL.red;const n=Math.min(30,4+Math.round(amount*1.5));const t=now();
 for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=25+Math.random()*70;parts.push({x:tx*16+8,y:ty*16+8,vx:Math.cos(a)*s,vy:Math.sin(a)*s-20,born:t,life:350+Math.random()*500,c,sz:1+Math.random()*1.6,decal:kind==='red'||kind==='ooze'})}
 if((kind==='red'||kind==='ooze')&&Math.random()<.75)decals.push({x:tx*16+8+(Math.random()-.5)*8,y:ty*16+10+(Math.random()-.5)*6,s:5+Math.min(10,amount*.8)+Math.random()*4,v:(Math.random()*6)|0,born:t,c});
 if(parts.length>400)parts.splice(0,parts.length-400);if(decals.length>120)decals.splice(0,decals.length-120)};
P.gore=function(tx,ty,kind,col){P.bleed(tx,ty,24,kind,col);if(kind==='red'||kind==='ooze'){const c=col?SC.rgb(col).map(v=>v/255):COL.red;for(let i=0;i<3;i++)decals.push({x:tx*16+8+(Math.random()-.5)*14,y:ty*16+10+(Math.random()-.5)*10,s:10+Math.random()*8,v:(Math.random()*6)|0,born:now(),c})}};
P.bloodKind=function(def,custom){const D=custom||SC.monDef(def)||{};if(D.s==='blob')return ['ooze',D.c&&D.c[0]];if(D.s==='wisp')return ['spark',D.c&&D.c[0]];
 if(/Golem|Crawler|Bone|Wight|Skeleton/.test(D.n||''))return ['dust'];return ['red']};
P.renderDecals=function(R){const t=now();for(let i=decals.length-1;i>=0;i--){const d=decals[i];const age=(t-d.born)/1000;if(age>45){decals.splice(i,1);continue}
  const k=Math.min(1,age/20),sh=1-k*.55;R.quad(R.bloodCell(d.v),d.x-d.s/2,d.y-d.s/2,d.s,d.s,d.c[0]*sh,d.c[1]*sh+.01,d.c[2]*sh+.01,0)}};
P.renderParts=function(R,dt){const t=now(),f=dt/1000;for(let i=parts.length-1;i>=0;i--){const p=parts[i];const age=t-p.born;if(age>p.life){parts.splice(i,1);
  if(p.decal&&Math.random()<.18)decals.push({x:p.x,y:p.y,s:2+Math.random()*2.5,v:(Math.random()*6)|0,born:t,c:p.c});continue}
  p.x+=p.vx*f;p.y+=p.vy*f;p.vx*=.9;p.vy=p.vy*.9+60*f;R.quad(R.bloodCell(-1),p.x,p.y,p.sz,p.sz,p.c[0],p.c[1],p.c[2],0)}};
})();

// ---------- companions ----------
(function(){const SC=globalThis.SC,P=SC.P,G=()=>SC.G,g=()=>SC.game,UI=()=>SC.UI;
 P.summon=function(){const m=G().me;if(!G().inGame||!m)return;const pt=m.pets[m.pet];if(!pt){g().pushReq(['dismiss']);return}
  g().pushReq(['summon',{def:pt.def,lvl:pt.lvl,custom:pt.custom||null,pn:pt.pn||pt.n,cu:pt.cu||''}])};
 P.setPet=function(i){const m=G().me;m.pet=(i===m.pet)?-1:i;P.summon();UI().refresh()};
 P.release=function(i){const m=G().me;const pt=m.pets[i];if(!pt)return;m.pets.splice(i,1);if(m.pet===i){m.pet=-1;P.summon()}else if(m.pet>i)m.pet--;UI().log(`${pt.pn||pt.n} returns to the wild.`);UI().refresh()};
 P.petShape=pt=>{const D=pt.custom||SC.monDef(pt.def)||{s:'blob',c:['#888','#444'],n:'?'};return D};
 // a Wispper speaks its words aloud, one line at a time
 P.speak=function(it){const r=SC.readText(it.t);const lines=r.text.split(/\n|\[br\]/).map(s=>s.replace(/\[[^\]]*\]/g,'').trim()).filter(Boolean).slice(0,12);if(!lines.length){UI().log('The wisp flickers, silent.');return}
  G().speech={lines,t0:performance.now()};lines.forEach((l,i)=>setTimeout(()=>UI().log('✧ '+l),i*2800))};
})();
