// SortCraft — infinite chunked world. Biomes ring outward from the centre.
(function(){
'use strict';
const SC=globalThis.SC;
const TK=SC.TK={G:0,G2:1,DET:2,PATH:3,WATER:4,DEEP:5,TREE:6,ROCK:7,SP:8,SHORE:9,HOLE:10,FLOOR:11};
const CH=SC.CH;
SC.pack=function(it){if(!it)return 0;const a=[it.b,it.k|0||1,it.r|0,it.q|0,it.m|0,it.g||0,it.c||0,it.cl?1:0,it.n||0,it.e||0,it.h===undefined?0:[it.h,Math.round((it.hs||.55)*100)],it.g2||0];while(a.length>4&&!a[a.length-1])a.pop();return a};
SC.unpack=function(a){if(!a||!Array.isArray(a))return null;const it={b:String(a[0]),k:Math.max(1,a[1]|0),r:SC.clamp(a[2]|0,0,6),q:SC.clamp(a[3]|0,0,99)};
 if(a[4])it.m=SC.clamp(a[4]|0,1,7);if(a[5])it.g=String(a[5]);if(a[6])it.c=String(a[6]).slice(0,20);if(a[7])it.cl=true;if(a[8])it.n=String(a[8]).slice(0,30);if(Array.isArray(a[9]))it.e=[a[9][0]%9,a[9][1]%9];if(Array.isArray(a[10])){it.h=(a[10][0]|0)%360;it.hs=SC.clamp((a[10][1]|0)/100,.1,1)}if(a[11])it.g2=String(a[11]);
 return SC.ITEMS[it.b]?it:null};

class World{
 constructor(seedStr){
  this.seedStr=seedStr;this.seed=SC.hseed('sortcraft',seedStr);
  const s=this.seed;this.nE=SC.noise(s^0x1234);this.nM=SC.noise(s^0x5678);this.nW1=SC.noise(s^0x9abc);this.nW2=SC.noise(s^0xdef0);this.nR=SC.noise(s^0x2468);this.nG=SC.noise(s^0x1357);
  this.chunks=new Map();this.cells=new Map();this.deltas=new Map();this.tents=new Map();
  this.spokeOff=SC.h2(1,2,s)*Math.PI*2;
 }
 // ---- biomes: jittered Voronoi cells, picked by distance ring ----
 cellBiome(cx,cy){const k=cx+':'+cy;let v=this.cells.get(k);if(v!==undefined)return v;
  const C=96,px=(cx+SC.h2(cx,cy,this.seed^11))*C,py=(cy+SC.h2(cx,cy,this.seed^12))*C,d=SC.dist(px,py);
  const R=SC.rng(SC.hseed(this.seed,'cell',cx,cy));
  if(d<120)v=0;else{const tier=d<280?1:d<520?2:d<800?3:4;
   v=SC.wpick(R,SC.BIOMES.map((b,i)=>i),i=>{const b=SC.BIOMES[i];
    if(i===0)return tier===1?.6:.12;
    if(b.hybrid)return b.tier<=tier+1?(tier===1?.25:tier===2?.5:.7):0;
    return b.tier<=tier?(b.tier===tier?1.3:1):0})}
  this.cells.set(k,v);return v}
 biomeAt(x,y){const wx=x+(SC.fbm(this.nW1,x/80,y/80,2)-.5)*80,wy=y+(SC.fbm(this.nW2,x/80,y/80,2)-.5)*80;const C=96;
  const cx=Math.floor(wx/C),cy=Math.floor(wy/C);let best=1e18,bb=0;
  for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const X=cx+i,Y=cy+j;const px=(X+SC.h2(X,Y,this.seed^11))*C,py=(Y+SC.h2(X,Y,this.seed^12))*C;const dd=(px-wx)*(px-wx)+(py-wy)*(py-wy);if(dd<best){best=dd;bb=this.cellBiome(X,Y)}}
  return bb}
 onRoad(x,y){const r=SC.dist(x,y);if(r<5)return false;let th=Math.atan2(y,x)-this.spokeOff;const n=8,seg=Math.PI*2/n;
    let a=((th%seg)+seg)%seg;if(a>seg/2)a-=seg;const off=Math.abs(a*r+(SC.fbm(this.nR,r/35,a>0?3:7,2)-.5)*Math.min(14,r/8));return off<0.9}
 genTile(x,y,bi){const B=SC.BIOMES[bi],s=this.seed,d=SC.dist(x,y);
  if(d<6.5)return TK.FLOOR;
  if(d<10)return SC.h2(x,y,s)<.12?TK.DET:TK.G;
  const e=SC.fbm(this.nE,x/38,y/38,4),m=SC.fbm(this.nM,x/22,y/22,3),k=SC.h2(x,y,s),k2=SC.h2(x,y,s^77),k3=SC.h2(x,y,s^99);
  const road=this.onRoad(x,y);
  const wt=.24+B.water*.28;
  if(e<wt-.06)return road?TK.PATH:TK.DEEP;
  if(e<wt)return road?TK.PATH:TK.WATER;
  if(road)return TK.PATH;
  if(d<9)return k<.15?TK.DET:TK.G;
  if(e<wt+.025)return TK.SHORE;
  const tt=1-B.trees*.72;
  if(m>tt||(m>tt-.05&&k<.45))return TK.TREE;
  if(k2<B.rocks||SC.fbm(this.nG,x/9,y/9,2)>.78)return TK.ROCK;
  if(k3<B.sp)return TK.SP;
  if(k<.11)return TK.DET;
  return SC.fbm(this.nG,x/14,y/14,2)>.55?TK.G2:TK.G}
 solidKind(t,bi){return t===TK.WATER||t===TK.DEEP||t===TK.TREE||t===TK.ROCK||(t===TK.SP&&SC.BIOMES[bi].spSolid)}
 chunk(cx,cy){const k=cx+':'+cy;let c=this.chunks.get(k);if(c)return c;
  c={cx,cy,t:new Uint8Array(CH*CH),b:new Uint8Array(CH*CH),pois:[],pm:new Map(),spawns:[]};
  const x0=cx*CH,y0=cy*CH;
  for(let j=0;j<CH;j++)for(let i=0;i<CH;i++){const x=x0+i,y=y0+j,bi=this.biomeAt(x,y);c.b[j*CH+i]=bi;c.t[j*CH+i]=this.genTile(x,y,bi)}
  this.genPois(c);
  this.chunks.set(k,c);if(this.chunks.size>700){const first=this.chunks.keys().next().value;this.chunks.delete(first)}
  return c}
 genPois(c){const R=SC.rng(SC.hseed(this.seed,'poi',c.cx,c.cy)),x0=c.cx*CH,y0=c.cy*CH;
  const free=(i,j,allowPath)=>{const t=c.t[j*CH+i];if(this.solidKind(t,c.b[j*CH+i]))return false;if(!allowPath&&t===TK.PATH)return false;if(t===TK.FLOOR)return false;return !c.pm.has(j*CH+i)};
  const put=(p)=>{p.key=p.x+','+p.y;c.pois.push(p);c.pm.set((p.y-y0)*CH+(p.x-x0),p)};
  const spot=(tries,fn)=>{for(let n=0;n<tries;n++){const i=Math.floor(R()*CH),j=Math.floor(R()*CH);if(free(i,j)&&(!fn||fn(i,j)))return [x0+i,y0+j]}return null};
  const cdist=SC.dist(x0+CH/2,y0+CH/2);
  // the camp at the world's centre (each object lives in the chunk that contains it)
  for(const cp of [{k:'fire',x:0,y:0,solid:1},{k:'npc',x:0,y:-3,kind:-1,name:'The Elder Sapling',title:'The Elder Sapling, Ancient and Wise',t:'str',desc:[16,3],disp:'friendly',lvl:1,special:'sapling',solid:1},
   {k:'chest',x:3,y:1,solid:1,camp:1},{k:'chest',x:-3,y:1,solid:1,camp:1}])if(SC.cof(cp.x)===c.cx&&SC.cof(cp.y)===c.cy)put(Object.assign({},cp));
  // collectables
  const nCol=4+Math.floor(R()*6);
  for(let n=0;n<nCol;n++){const p=spot(12);if(!p)continue;const bi=c.b[(p[1]-y0)*CH+(p[0]-x0)];
   const roll=R(),cat=roll<.6?'flora':roll<.85?'fauna':'mineral';put({k:'col',x:p[0],y:p[1],id:SC.speciesRoll(R,bi,cat)})}
  // rare element in hybrid biomes
  {const bi=c.b[(CH/2)*CH+CH/2];if(SC.BIOMES[bi].hybrid&&R()<.4){const p=spot(12);if(p)put({k:'col',x:p[0],y:p[1],id:'rare.'+(bi-9),rare:1})}}
  // ore nodes
  const nOre=Math.floor(R()*2.6);for(let n=0;n<nOre;n++){const p=spot(14);if(!p)continue;const mt=SC.metalTierAt(SC.dist(p[0],p[1]));put({k:'ore',x:p[0],y:p[1],tier:Math.max(1,mt-(R()<.4?1:0)),solid:1})}
  if(cdist<12)return;
  // treasure chest
  if(R()<.33){const p=spot(14);if(p)put({k:'chest',x:p[0],y:p[1],solid:1})}
  // dig spots (hidden)
  const nDig=1+Math.floor(R()*2);for(let n=0;n<nDig;n++){const p=spot(10);if(p)put({k:'dig',x:p[0],y:p[1]})}
  // NPC
  if(R()<.5){const p=spot(14);if(p){const bi=c.b[(p[1]-y0)*CH+(p[0]-x0)];const kinds=SC.kindsFor(bi);const ki=SC.pick(R,kinds),K=SC.NPCKINDS[ki];
   const d1=Math.floor(R()*100);let d2=R()<.55?Math.floor(R()*100):-1;if(d2===d1)d2=-1;const desc=d2>=0?[d1,d2]:[d1];
   let score=(R()-.5)*1.4+(K.t==='cre'?.5:K.t==='str'?-.4:0)+Math.min(1.2,SC.dist(p[0],p[1])/400);
   for(const di of desc)for(const tr of SC.DESCRIPTORS[di].t)score+=SC.TRAITDISP[tr]||0;
   const disp=score>1.4?'hostile':score<-.3?'friendly':'neutral';
   const name=SC.pname(R);const dw=desc.map(i=>SC.DESCRIPTORS[i].w);
   const title=K.t==='str'?`${name}, the ${dw.join(', ')} ${K.n}`:`${name} the ${dw.join(', ')} ${K.n}`;
   put({k:'npc',x:p[0],y:p[1],kind:ki,t:K.t,name,title,desc,disp,lvl:SC.levelAt(p[0],p[1]),solid:1})}}
  // monster spawn points (used by the host)
  const nM=Math.min(4,Math.floor(R()*2.4+cdist/260));
  for(let n=0;n<nM;n++){const p=spot(10);if(!p)continue;const bi=c.b[(p[1]-y0)*CH+(p[0]-x0)];const ms=SC.monstersFor(bi);
   c.spawns.push({x:p[0],y:p[1],mon:SC.wpick(R,ms,m=>m>=1000?.25:1),key:c.cx+':'+c.cy+':'+n})}
 }
 tile(x,y){const c=this.chunk(SC.cof(x),SC.cof(y));const i=(y-c.cy*CH)*CH+(x-c.cx*CH);const d=this.deltas.get(x+','+y);if(d==='d')return TK.HOLE;if(d==='r')return TK.G;return c.t[i]}
 tentAt(x,y){for(const t of this.tents.values()){const h=(t.size-1)/2;if(Math.abs(x-t.x)<=h&&Math.abs(y-t.y)<=h)return t}return null}
 static parseTent(k,v){const p=v.split('|');const [x,y]=k.split(',').map(Number);return {k:'tent',x,y,key:k,size:SC.clamp(+p[1]||3,3,13),hue:+p[2]||0,light:SC.clamp(+p[3],0,100),cid:p[4]||'',name:p[5]||'',solid:1}}
 biome(x,y){const c=this.chunk(SC.cof(x),SC.cof(y));return c.b[(y-c.cy*CH)*CH+(x-c.cx*CH)]}
 poi(x,y){if(this.tents.size){const t=this.tentAt(x,y);if(t)return Object.assign({},t,{door:x===t.x&&y===t.y+(t.size-1)/2})}const c=this.chunk(SC.cof(x),SC.cof(y));const p=c.pm.get((y-c.cy*CH)*CH+(x-c.cx*CH));const d=this.deltas.get(x+','+y);
  if(d==='s')return {k:'chest',x,y,key:x+','+y,solid:1,storage:1};
  if(!p)return null;
  if(d&&p.k==='col')return null;if(d==='m'&&p.k==='ore')return null;if(d==='n'&&p.k==='npc'&&p.t!=='str')return null;
  return p}
 poiState(p){return this.deltas.get(p.key)}
 solid(x,y){if(this.tents.size){const tt=this.tentAt(x,y);if(tt)return !(x===tt.x&&y===tt.y+(tt.size-1)/2)}const t=this.tile(x,y);if(this.solidKind(t,this.biome(x,y)))return true;const p=this.poi(x,y);return !!(p&&p.solid)}
 setDelta(k,v){if(v==='-'){this.deltas.delete(k);this.tents.delete(k)}else{this.deltas.set(k,v);if(typeof v==='string'&&v[0]==='T')this.tents.set(k,World.parseTent(k,v));else this.tents.delete(k)}}
 // helpers
 nearbyPois(x,y,r){const out=[];const c0=SC.cof(x-r),c1=SC.cof(x+r),r0=SC.cof(y-r),r1=SC.cof(y+r);
  for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){const c=this.chunk(cx,cy);for(const p of c.pois){if(Math.abs(p.x-x)<=r&&Math.abs(p.y-y)<=r){const q=this.poi(p.x,p.y);if(q)out.push(q)}}}
  for(const t of this.tents.values())if(Math.abs(t.x-x)<=r+6&&Math.abs(t.y-y)<=r+6)out.push(t);
  for(const [k,v] of this.deltas)if(v==='s'){const [px,py]=k.split(',').map(Number);if(Math.abs(px-x)<=r&&Math.abs(py-y)<=r)out.push({k:'chest',x:px,y:py,key:k,solid:1,storage:1})}
  return out}
 miniColor(x,y){const t=this.tile(x,y),B=SC.BIOMES[this.biome(x,y)].pal;
  switch(t){case TK.WATER:return B.water;case TK.DEEP:return B.deep;case TK.TREE:return B.leaf;case TK.ROCK:return B.rock;case TK.SP:return B.sp;case TK.PATH:case TK.FLOOR:return B.path;case TK.SHORE:return B.shore;default:return B.g[0]}}
}
SC.World=World;
})();
