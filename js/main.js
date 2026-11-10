// SortCraft — game state, netcode, input, render loop, inventory logic, saves
(function(){
'use strict';
const SC=globalThis.SC,UI=SC.UI,TK=SC.TK,CH=SC.CH;
const $=id=>document.getElementById(id);
const now=()=>performance.now();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rid=()=>Array.from(crypto.getRandomValues(new Uint8Array(8)),b=>(b%36).toString(36)).join('');
const clean=s=>String(s||'').replace(/[^\w \-']/g,'').trim().slice(0,14)||'Traveler';

// ---------- fog of war (explored tiles, per world) ----------
class Fog{constructor(){this.m=new Map();this.v=new Map()}
 isExp(x,y){const cx=SC.cof(x),cy=SC.cof(y);const a=this.m.get(cx+':'+cy);return a?a[(y-cy*CH)*CH+(x-cx*CH)]:0}
 reveal(x,y,r){const r2=r*r;const touched=new Set();for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){if(i*i+j*j>r2)continue;const X=x+i,Y=y+j,cx=SC.cof(X),cy=SC.cof(Y),k=cx+':'+cy;
  let a=this.m.get(k);if(!a){a=new Uint8Array(CH*CH);this.m.set(k,a)}const o=(Y-cy*CH)*CH+(X-cx*CH);if(!a[o]){a[o]=1;touched.add(k)}}
  for(const k of touched)this.v.set(k,(this.v.get(k)|0)+1);return touched.size}
 ver(cx,cy){return this.v.get(cx+':'+cy)|0}
 chunks(){return this.m.keys()}
 save(){const o={};for(const [k,a] of this.m){const b=new Uint8Array(128);for(let i=0;i<1024;i++)if(a[i])b[i>>3]|=1<<(i&7);o[k]=SC.b64(b)}return o}
 load(o){this.m.clear();for(const k in o||{}){const b=SC.unb64(o[k]);const a=new Uint8Array(1024);for(let i=0;i<1024;i++)a[i]=(b[i>>3]>>(i&7))&1;this.m.set(k,a)}}}

// ---------- state ----------
const G=SC.G={inGame:false,name:'Traveler',col:0,me:null,world:null,host:null,isHost:false,code:'',myId:null,hostId:null,roomH:null,fog:new Fog(),
 peers:new Map(),peerList:[],prender:new Map(),mons:new Map(),encs:[],encDismissed:new Set(),encSeen:new Set(),chest:null,q:[],seq:0,say:[],saySeq:0,saySeen:new Map(),evSeen:0,fxSeen:0,floats:[],
 hostTime:0,hostTimeAt:0,dirty:true,lastSend:0,zoomMul:1,derived:{atk:2,arm:0,magic:0,mc:0,sight:6,find:0,reach:1,cd:380},lastBiome:-1,pendingTake:new Map()};
let NET=null,R=null;
const game=SC.game={};

// ---------- networking ----------
function wrapRoom(r){return{setPresence(o){return r.presence(o).catch(e=>console.warn('presence',e&&e.code,e&&e.message))},
 onPeers(f){return r.onPeers(ch=>f(ch.peers.map(p=>({id:p.peer,isMe:p.sameTab,presence:p.presence||{}}))),e=>{console.warn('room',e);netLost(e&&e.code)})},leave(){return r.leave().catch(()=>{})}}}
function bcNet(){if(typeof BroadcastChannel==='undefined')return {kind:'offline',me:rid(),join:async()=>null};const me=rid();
 return {kind:'bc',me,join:async name=>{const ch=new BroadcastChannel('sortcraft-'+name),peers=new Map();let mine={},cb=null;
  const emit=()=>{const t=Date.now();for(const [id,p] of peers)if(t-p.last>4500)peers.delete(id);if(cb)cb([{id:me,isMe:true,presence:mine}].concat([...peers].map(([id,p])=>({id,isMe:false,presence:p.presence}))))};
  ch.onmessage=e=>{const d=e.data;if(!d||d.id===me)return;if(d.bye)peers.delete(d.id);else{peers.set(d.id,{presence:d.p||{},last:Date.now()});if(d.hello)ch.postMessage({id:me,p:mine})}emit()};
  const hb=setInterval(()=>{ch.postMessage({id:me,p:mine});emit()},1000);ch.postMessage({id:me,p:mine,hello:true});const bye=()=>ch.postMessage({id:me,bye:true});addEventListener('pagehide',bye);
  return {setPresence(o){mine=Object.assign({},mine,o);ch.postMessage({id:me,p:mine})},onPeers(f){cb=f;setTimeout(emit,0);return()=>{cb=null}},leave(){bye();clearInterval(hb);removeEventListener('pagehide',bye);ch.close();cb=null}}}}}
// ---------- peer-to-peer (standalone build): the host relays everyone's state ----------
function peerOpts(){const o={config:{iceServers:SC.ICE||[]},debug:0};const q=new URLSearchParams(location.search).get('peerhost');
 if(q){const [h,p]=q.split(':');Object.assign(o,{host:h,port:+p||9000,path:'/',secure:location.protocol==='https:'&&h!=='localhost'})}else if(SC.PEER)Object.assign(o,SC.PEER);return o}
async function peerNet(){const me=rid();const peer=new Peer('sortcraft-'+me,peerOpts());
 await new Promise((res,rej)=>{peer.once('open',res);peer.once('error',rej);setTimeout(()=>rej(new Error('timeout')),12000)});
 peer.on('error',e=>{console.warn('peer',e&&e.type,e);if(e&&e.type==='peer-unavailable'&&G.joinReject)G.joinReject(e)});
 peer.on('disconnected',()=>{try{peer.reconnect()}catch(e){}});
 return {kind:'p2p',me,peer,join:async(name,host)=>host===me?p2pHost(peer,me):p2pClient(peer,me,host)}}
const strip=id=>String(id).replace(/^sortcraft-/,'');
function p2pHost(peer,me){const conns=new Map(),pres=new Map();let mine={},cb=null,dirty=true;
 const list=()=>[{id:me,presence:mine}].concat([...pres].map(([id,p])=>({id,presence:p})));
 const emit=()=>{if(cb)cb(list().map(x=>({id:x.id,isMe:x.id===me,presence:x.presence})))};
 const onConn=conn=>{const cid=strip(conn.peer);conn.on('open',()=>{conns.set(cid,conn);dirty=true});
  conn.on('data',d=>{if(d&&d.t==='p'&&d.p&&typeof d.p==='object'){pres.set(cid,d.p);dirty=true;emit()}});
  const gone=()=>{conns.delete(cid);pres.delete(cid);dirty=true;emit()};conn.on('close',gone);conn.on('error',gone)};
 peer.on('connection',onConn);
 const iv=setInterval(()=>{if(!dirty||!conns.size)return;dirty=false;const msg={t:'all',list:list()};for(const c of conns.values()){try{if(c.open)c.send(msg)}catch(e){}}},70);
 return {setPresence(o){mine=Object.assign({},mine,o);dirty=true},onPeers(f){cb=f;setTimeout(emit,0);return()=>{cb=null}},
  leave(){clearInterval(iv);peer.off('connection',onConn);for(const c of conns.values())try{c.close()}catch(e){}conns.clear()}}}
function p2pClient(peer,me,host){return new Promise((res,rej)=>{let mine={},cb=null,last=0,timer=null,done=false;
 const conn=peer.connect('sortcraft-'+host,{reliable:true,serialization:'json'});
 const fail=e=>{if(done)return;done=true;G.joinReject=null;rej(e||new Error('Could not reach the host'))};G.joinReject=()=>fail(new Error('No world is open with that code right now.'));
 const to=setTimeout(()=>fail(new Error('Could not reach the host. Check the code, and that the host still has the world open.')),15000);
 const send=()=>{timer=null;last=now();try{if(conn.open)conn.send({t:'p',p:mine})}catch(e){}};
 conn.on('data',d=>{if(d&&d.t==='all'&&Array.isArray(d.list)&&cb)cb(d.list.map(x=>({id:String(x.id),isMe:x.id===me,presence:x.presence||{}})))});
 conn.on('close',()=>{if(cb)cb([{id:me,isMe:true,presence:mine}])});
 conn.on('open',()=>{if(done)return;done=true;clearTimeout(to);G.joinReject=null;send();
  res({setPresence(o){mine=Object.assign({},mine,o);if(timer)return;const wait=Math.max(0,50-(now()-last));timer=setTimeout(send,wait)},
   onPeers(f){cb=f;return()=>{cb=null}},leave(){try{conn.close()}catch(e){}}})})})}
async function initNet(){const embedded=window.parent!==window;for(let i=0;i<(embedded?25:3)&&!(window.claude&&typeof window.claude.use==='function');i++)await sleep(100);let room=null;
 if(window.claude&&typeof window.claude.use==='function'){try{room=await window.claude.use('room')}catch(e){}}
 if(room){const me=await new Promise(res=>{let done=false,un=null;const find=()=>{const m=room.peers().find(p=>p.sameTab);if(m&&!done){done=true;res(m.peer);if(un)un()}return done};
   if(find())return;un=room.onPeers(()=>find(),()=>{if(!done){done=true;res(null)}});setTimeout(()=>{if(!done){done=true;res(null)}},8000)});
  if(me)return {kind:'room',me,join:async name=>wrapRoom(await room.join(name))}}
 if(typeof Peer!=='undefined'){try{return await peerNet()}catch(e){console.warn('PeerJS unavailable',e)}}
 return bcNet()}
game.netNote=()=>!NET?'':NET.kind==='p2p'?'Online multiplayer is on (peer-to-peer). Share your code; friends open this same site and paste it.':NET.kind==='room'?'Live multiplayer is on. Friends open this page on claude.ai (shared with them) and paste your code.':NET.kind==='bc'?'Outside claude.ai, multiplayer only links tabs in this browser.':'Multiplayer isn\'t available here; solo play only.';
function netLost(code){if(!G.inGame)return;UI.log('Multiplayer connection lost ('+(code||'error')+').','bad');if(!G.isHost)showBanner('Connection lost','The multiplayer room closed.')}
function parseCode(c){c=String(c||'').trim();const i=c.indexOf('.');if(i<1)return null;const seed=normSeed(c.slice(0,i)),host=c.slice(i+1).trim();if(!seed||!host||host.length>64||/\s/.test(host))return null;return {seed,host,code:seed+'.'+host}}
const normSeed=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12);
const roomName=code=>'sc-'+SC.hashStr(code).toString(36)+SC.hashStr('x'+code).toString(36);

// ---------- character ----------
function newChar(){const inv=new Array(48).fill(null);const kit=SC.starterKit(G.name);
 const me={x:0,y:1,d:0,rx:0,ry:1,mcd:0,hp:40,mhp:40,mp:12,mmp:12,gold:15,sk:[1,1,1,1,1,1],xp:[0,0,0,0,0,0],inv,eq:{},comp:{},over:[],buffs:[],lastHurt:0,hitT:0,lastAtk:0,swingT:0,
  cid:rid()+rid(),tent:{size:3,hue:30,light:70},quick:['heal','mending','poultice','stoneskin',''],spells:[],hots:[],permSpeed:0,ward:0,bleedHits:0};
 me.eq.weapon=kit[0];me.eq.cloak=kit[1];kit.slice(2).forEach((it,i)=>inv[i]=it);return me}
function charSave(){const m=G.me;const P=SC.pack;const eq={};for(const k in m.eq)if(m.eq[k])eq[k]=P(m.eq[k]);const comp={};for(const k in m.comp)comp[k]=P(m.comp[k]);
 return {v:2,name:G.name,col:G.col,sk:m.sk,xp:m.xp,inv:m.inv.map(P),eq,comp,over:m.over.map(P),gold:m.gold,hp:Math.ceil(m.hp),mp:Math.floor(m.mp),cid:m.cid,tent:m.tent,quick:m.quick,spells:m.spells,ps:m.permSpeed}}
function charLoad(s){const m=newChar();if(!s)return m;try{const U=SC.unpack;m.sk=(s.sk||m.sk).map(v=>v|0);m.xp=(s.xp||m.xp).map(v=>v|0);
 m.inv=new Array(Math.max(48,(s.inv||[]).length)).fill(null);(s.inv||[]).slice(0,60).forEach((a,i)=>m.inv[i]=U(a));if(s.cid)m.cid=String(s.cid).slice(0,16);if(s.tent)m.tent={size:SC.clamp(s.tent.size|0,3,13)|1,hue:(s.tent.hue|0)%360,light:SC.clamp(s.tent.light|0,0,100)};
 if(Array.isArray(s.quick))m.quick=s.quick.slice(0,5).map(String);while(m.quick.length<5)m.quick.push('');if(Array.isArray(s.spells))m.spells=s.spells.slice(0,8).filter(x=>x&&Array.isArray(x.a)).map(x=>({n:String(x.n||'Spell').slice(0,20),a:x.a.filter(a=>SC.ASI[a]).slice(0,3),el:Array.isArray(x.el)?x.el.slice(0,3).map(v=>v|0):[-1,-1,-1]}));m.permSpeed=SC.clamp(+s.ps||0,0,.3);m.eq={};for(const k in s.eq||{})m.eq[k]=U(s.eq[k]);m.comp={};for(const k in s.comp||{}){const it=U(s.comp[k]);if(it)m.comp[k]=it}
 m.over=(s.over||[]).map(U).filter(Boolean);m.gold=s.gold|0;m.hp=s.hp||40;m.mp=s.mp||10;if(s.name)G.name=clean(s.name);if(s.col!==undefined)G.col=(s.col|0)%8}catch(e){console.warn('char load',e)}return m}
const LS={get(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}};
function worldKey(){return 'sc.world.'+G.world.seedStr}
game.saveNow=function(){if(!G.inGame)return;LS.set('sc.char',charSave());const ws=LS.get(worldKey())||{};ws.fog=G.fog.save();ws.pos=[G.me.x,G.me.y];if(G.isHost){ws.host=G.host.save();LS.set('sc.last',G.world.seedStr)}LS.set(worldKey(),ws)};
game.exportSave=async function(){game.saveNow();const worlds={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('sc.world.'))worlds[k.slice(9)]=LS.get(k)}}catch(e){}
 const data=JSON.stringify({app:'SortCraft',v:1,saved:new Date().toISOString(),char:charSave(),worlds});const fn='sortcraft-'+clean(G.name).replace(/\s/g,'_')+'.json';
 let dl=null;try{dl=window.claude&&await window.claude.use('downloads')}catch(e){}
 if(dl){try{await dl.save({filename:fn,data});UI.log('Save file exported.','good');return}catch(e){console.warn(e)}}

 if(!window.claude){try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download=fn;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);UI.log('Save file downloaded.','good');return}catch(e){}}
 showText('Save file','Downloads aren\'t available here. Copy this text into a file named '+fn+' to keep it:',data)};
function importSave(text){const o=JSON.parse(text);if(!o||o.app!=='SortCraft'||!o.char)throw new Error('Not a SortCraft save file.');LS.set('sc.char',o.char);for(const k in o.worlds||{})LS.set('sc.world.'+k,o.worlds[k]);return o}
function showText(title,msg,text){const w=document.createElement('div');w.className='win frame';w.style.cssText='left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,92vw);z-index:5';
 w.innerHTML=`<div class="wtitle"><span class="rule"></span>◆<h2>${UI.esc(title)}</h2>◆<span class="rule"></span></div><div class="wbody"><p class="note">${UI.esc(msg)}</p><textarea style="width:100%;height:200px;background:#0e0a08;color:var(--ink);border:1px solid var(--line);border-radius:6px"></textarea></div><div class="wfoot"><button class="btn">Copy</button><button class="btn">Close</button></div>`;
 $('wins').appendChild(w);const ta=w.querySelector('textarea');ta.value=text;const [cp,cl]=w.querySelectorAll('.wfoot .btn');cp.onclick=()=>{ta.select();try{navigator.clipboard.writeText(text).then(()=>cp.textContent='Copied!')}catch(e){}};cl.onclick=()=>w.remove()}

// ---------- derived stats ----------
function recompute(){const m=G.me;let atk=2,arm=0,magic=0,mc=0,mp=0,hp=0,light=0,find=0;
 for(const k of SC.EQSLOTS){const it=m.eq[k];if(!it)continue;const s=SC.stats(it);atk+=s.atk;arm+=s.arm;magic+=s.magic;mp+=s.mp;hp+=s.hp;light+=s.light;find+=s.find;if(k==='weapon')mc=s.mc}
 const t=now();m.buffs=m.buffs.filter(b=>b.until>t);for(const b of m.buffs){atk+=b.atk|0;arm+=b.arm|0;light+=b.light|0}
 atk+=Math.floor(m.sk[2]/2);if(SC.hasAb(m.sk,'apex'))atk+=Math.floor(m.sk[2]/2);if(SC.hasAb(m.sk,'mountainheart'))arm+=Math.floor(m.sk[3]/2);
 const need=SC.hasAb(m.sk,'satchel')?60:48;while(m.inv.length<need)m.inv.push(null);const tot=m.sk.reduce((a,b)=>a+b,0);
 m.mhp=30+4*tot+hp;m.mmp=10+5*m.sk[5]+2*m.sk[4]+mp;m.hp=Math.min(m.hp,m.mhp);m.mp=Math.min(m.mp,m.mmp);
 const w=m.eq.weapon?SC.ITEMS[m.eq.weapon.b].wt:'';
 G.derived={atk,arm,magic,mc,sight:6+light,find,reach:w==='bow'?4:(w==='spear'||w==='atgeir')?2:1,cd:{dagger:260,hammer:560,bow:450,staff:420}[w]||380,speed:SC.P.speed(m)};G.look=SC.lookFromEq(m.eq,G.col);G.dirty=true}
function freeSlots(){return G.me.inv.filter(x=>!x).length}

// ---------- items ----------
function addItem(it,quiet){const m=G.me;if(!it)return;const B=SC.ITEMS[it.b];
 for(const s of m.inv)if(s&&SC.canStack(s,it)&&s.k<SC.MAXSTACK){const take=Math.min(it.k,SC.MAXSTACK-s.k);s.k+=take;it.k-=take;if(!it.k)break}
 if(it.k>0){const i=m.inv.indexOf(null);if(i>=0)m.inv[i]=it;else if(B&&SC.SMALLCATS.includes(B.cat))toCompItem(it);else{m.over.push(it);UI.log('Your bag is full!','bad')}}
 UI.refresh()}
game.itemAt=function(src){const m=G.me;if(!src)return null;if(src.c==='inv')return m.inv[src.i];if(src.c==='eq')return m.eq[src.i];if(src.c==='chest')return G.chest&&G.chest.items?G.chest.items[src.i]:null;if(src.c==='comp')return m.comp[src.i];return null};
function toCompItem(it){const m=G.me;const ex=m.comp[it.b];if(ex){ex.k+=it.k;ex.q=Math.max(ex.q,it.q);ex.r=Math.max(ex.r,it.r)}else{m.comp[it.b]=SC.clone(it);const B=SC.ITEMS[it.b];UI.log('New compendium entry: '+SC.dispName(it,m.sk),'good');if(B.idSk)addXP(B.idSk,3)}}
function toComp(i){const it=G.me.inv[i];if(!it)return;const B=SC.ITEMS[it.b];if(!SC.SMALLCATS.includes(B.cat)){UI.log('Only small collectables fit in the compendium.','bad');return}G.me.inv[i]=null;toCompItem(it);done()}
function fromComp(id,i){const m=G.me;const it=m.comp[id];if(!it)return;delete m.comp[id];if(i>=0&&!m.inv[i])m.inv[i]=it;else addItem(it);done()}
function done(){recompute();UI.refresh();G.dirty=true}
game.drop=function(s,d){const m=G.me;
 if(s.c==='inv'&&d.c==='inv'){if(d.i<0||d.i===s.i)return;const A=m.inv[s.i],B=m.inv[d.i];if(B&&SC.canStack(A,B)&&B.k<SC.MAXSTACK){const t=Math.min(A.k,SC.MAXSTACK-B.k);B.k+=t;A.k-=t;if(!A.k)m.inv[s.i]=null}else{m.inv[d.i]=A;m.inv[s.i]=B}return done()}
 if(s.c==='inv'&&d.c==='eq'){return equip(s.i,d.i)}
 if(s.c==='eq'&&d.c==='inv'){const it=m.eq[s.i];if(!it)return;const t=d.i>=0?m.inv[d.i]:null;if(t&&SC.ITEMS[t.b].slot===s.i){m.eq[s.i]=t;m.inv[d.i]=it}else if(d.i>=0&&!t){m.inv[d.i]=it;delete m.eq[s.i]}else{delete m.eq[s.i];addItem(it)}return done()}
 if(s.c==='inv'&&d.c==='chest'&&G.chest){const it=m.inv[s.i];if(!it)return;m.inv[s.i]=null;game.pushReq(['cput',G.chest.x,G.chest.y,d.i,SC.pack(it)]);return done()}
 if(s.c==='chest'&&d.c==='inv'&&G.chest){game.pushReq(['ctake',G.chest.x,G.chest.y,s.i]);return}
 if(s.c==='chest'&&d.c==='chest'&&G.chest&&s.i!==d.i){game.pushReq(['cmove',G.chest.x,G.chest.y,s.i,d.i]);return}
 if(s.c==='inv'&&d.c==='comp')return toComp(s.i);
 if(s.c==='comp'&&d.c==='inv')return fromComp(s.i,d.i);
 if(s.c==='eq'&&d.c==='chest'&&G.chest){const it=m.eq[s.i];delete m.eq[s.i];game.pushReq(['cput',G.chest.x,G.chest.y,d.i,SC.pack(it)]);return done()}};
game.quick=function(s){const m=G.me;const it=game.itemAt(s);if(!it)return;
 if(s.c==='inv'){if(G.chest&&UI.isOpen('chest')){m.inv[s.i]=null;game.pushReq(['cput',G.chest.x,G.chest.y,-1,SC.pack(it)]);return done()}return toComp(s.i)}
 if(s.c==='chest')return game.pushReq(['ctake',G.chest.x,G.chest.y,s.i]);if(s.c==='comp')return fromComp(s.i,-1);if(s.c==='eq'){delete m.eq[s.i];addItem(it);done()}};
function equip(i,slot){const m=G.me;const it=m.inv[i];if(!it)return;const B=SC.ITEMS[it.b];if(!B.slot||(slot&&slot!==B.slot)){UI.log('That doesn\'t go there.','bad');return}
 const one=SC.clone(it);one.k=1;const prev=m.eq[B.slot];m.eq[B.slot]=one;if(it.k>1){it.k--;if(prev)addItem(prev)}else m.inv[i]=prev||null;UI.log('Equipped '+SC.stats(one).name+'.');done()}
game.use=function(s){const m=G.me;const it=game.itemAt(s);if(!it)return;
 if(s.c==='eq'){delete m.eq[s.i];addItem(it);return done()}
 if(s.c==='comp')return fromComp(s.i,-1);if(s.c==='chest')return game.quick(s);
 const B=SC.ITEMS[it.b];
 if(B.slot)return equip(s.i);
 if(B.cat==='potion')return drink(s.i);
 if(it.b==='misc.bread'){m.hp=Math.min(m.mhp,m.hp+8);consume(s.i);UI.log('You eat the bread. +8 health','good');return done()}
 if(it.b==='misc.mead'){m.mp=Math.min(m.mmp,m.mp+10);consume(s.i);UI.log('Honey mead. +10 magic','good');return done()}
 if(it.b==='misc.chest'){const x=m.x+SC.DX[m.d],y=m.y+SC.DY[m.d];consume(s.i);game.pushReq(['place',x,y]);UI.close('inv');return done()}
 if(SC.SMALLCATS.includes(B.cat))return toComp(s.i)};
function consume(i,n){const it=G.me.inv[i];if(!it)return;it.k-=n||1;if(it.k<=0)G.me.inv[i]=null}
function drink(i){const m=G.me,it=m.inv[i];const fx=SC.potionFx(it);const t=now();const parts=[];if(fx.hp>0&&SC.hasAb(m.sk,'potionlore'))fx.hp=Math.round(fx.hp*(1+m.sk[4]*.05));if(SC.hasAb(m.sk,'elixirmastery')){if(fx.buff)fx.buff*=2;if(fx.stealth)fx.stealth*=2}
 if(fx.hp){m.hp=SC.clamp(m.hp+fx.hp,1,m.mhp);parts.push((fx.hp>0?'+':'')+fx.hp+' health')}if(fx.mp){m.mp=SC.clamp(m.mp+fx.mp,0,m.mmp);parts.push((fx.mp>0?'+':'')+fx.mp+' magic')}
 if(fx.atk||fx.arm){m.buffs.push({atk:fx.atk|0,arm:fx.arm|0,until:t+(fx.buff||60)*1000});parts.push('emboldened')}
 if(fx.stealth){m.buffs.push({stealth:1,until:t+fx.stealth*1000});parts.push('unseen by monsters')}
 if(fx.xp){m.buffs.push({xp:fx.xp,until:t+(fx.buff||60)*1000});parts.push('learning faster')}
 if(fx.reveal){G.fog.reveal(m.x,m.y,G.derived.sight+fx.reveal);parts.push('the land around you is revealed')}
 consume(i);UI.log(SC.potionName(it.e||[2,2])+': '+parts.join(', ')+'.','good');done()}
game.craft=function(s,d,combo){const m=G.me;if(d.c==='eq'){const A=m.inv[s.i],B=m.eq[d.i];if(!A||!B||combo.err)return;const res=combo.make();consume(s.i);m.eq[d.i]=res;addXP(combo.skill,combo.xp);UI.log((combo.kind==='dye'?'Dyed ':'Crafted ')+SC.stats(res).name+'.','loot');return done()}
 const A=m.inv[s.i],B=m.inv[d.i];if(!A||!B||combo.err)return;const res=combo.make();
 if(combo.keepPattern){if(SC.ITEMS[A.b].cat==='ingot')consume(s.i);else consume(d.i)}
 else{consume(s.i);if(combo.useB)consume(d.i)}
 if(!m.inv[d.i])m.inv[d.i]=res;else addItem(res);addXP(combo.skill,combo.xp);
 UI.log((combo.kind==='dye'?'Dyed ':'Crafted ')+SC.stats(res).name+(res.r?' ['+SC.RARITY[res.r]+']':'')+'!','loot');UI.select({c:'inv',i:m.inv.indexOf(res)>=0?m.inv.indexOf(res):d.i});done()};
game.sortInv=function(mode){const m=G.me;const s=SC.sortItems(m.inv.filter(Boolean),mode);const n=m.inv.length;m.inv=s.concat(new Array(Math.max(0,n-s.length)).fill(null)).slice(0,n);UI.sel=null;done()};
game.allToComp=function(){const m=G.me;let n=0;m.inv.forEach((it,i)=>{if(it&&SC.SMALLCATS.includes(SC.ITEMS[it.b].cat)){m.inv[i]=null;toCompItem(it);n++}});UI.log(n?`Filed ${n} stack${n>1?'s':''} into the compendium.`:'Nothing to file.');done()};
game.split=function(s){const m=G.me,it=m.inv[s.i];if(!it||it.k<2)return;const j=m.inv.indexOf(null);if(j<0)return UI.log('No room to split.','bad');const half=Math.floor(it.k/2);it.k-=half;const n=SC.clone(it);n.k=half;m.inv[j]=n;done()};
game.discard=function(s){const m=G.me,it=m.inv[s.i];if(!it)return;m.inv[s.i]=null;UI.sel=null;UI.log('Discarded '+SC.dispName(it,m.sk)+'.');done()};
game.inscribe=function(s,name){const it=game.itemAt(s);if(!it||it.cl)return;it.c=String(name||'').replace(/[^\w \-'.]/g,'').trim().slice(0,20)||G.name;it.cl=true;UI.log(`Inscribed "${it.c}". This can never be changed.`,'loot');done()};
game.retryOverflow=function(){const o=G.me.over;G.me.over=[];o.forEach(it=>addItem(it));done()};
game.takeAll=function(){if(!G.chest||!G.chest.items)return;let free=freeSlots();G.chest.items.forEach((it,i)=>{if(it&&free-->0)game.pushReq(['ctake',G.chest.x,G.chest.y,i])})};
game.closeChest=function(){if(G.chest){game.pushReq(['close',G.chest.x,G.chest.y]);G.chest=null}};

// ---------- skills ----------
function addXP(sk,n){const m=G.me;const i=SC.SKI[sk];if(i===undefined||!n)return;const boost=m.buffs.find(b=>b.xp);n=Math.round(n*(1+(boost?boost.xp:0)));m.xp[i]+=n;
 while(m.xp[i]>=SC.xpFor(m.sk[i])){m.xp[i]-=SC.xpFor(m.sk[i]);m.sk[i]++;UI.log(`${SC.SKILLS[i].n} reached level ${m.sk[i]}!`,'xp');
  for(const a of SC.ACTIONS)if(a.sk===sk&&a.lv===m.sk[i])UI.log(`New action unlocked: ${a.n} [${a.key}]`,'xp');float(m.x,m.y,SC.SKILLS[i].n+' '+m.sk[i]+'!','#7ac0ff');recompute()}
 if(UI.isOpen('skills'))UI.refresh()}

// ---------- requests / presence ----------
game.pushReq=function(a){G.q.push([++G.seq].concat(a));if(G.q.length>12)G.q.shift();G.dirty=true;if(G.isHost&&G.host)G.host.updatePlayer(G.myId,presence())};
game.say=function(t){G.say.push([++G.saySeq,t.slice(0,90)]);if(G.say.length>4)G.say.shift();G.dirty=true;UI.chat(G.name,t,SC.PCOL[G.col][0])};
function presence(){const m=G.me,D=G.derived;return {r:G.isHost?'h':'c',g:G.code,n:G.name,col:G.col,x:m.x,y:m.y,d:m.d,hp:Math.ceil(m.hp),mhp:m.mhp,sk:m.sk,atk:D.atk,arm:D.arm,gold:m.gold,
 st:m.buffs.some(b=>b.stealth)?1:0,free:freeSlots(),q:G.q,say:G.say,ap:SC.lookPack(G.look||SC.lookFromEq(m.eq,G.col)),th:SC.P.thorns(),bl:SC.hasAb(m.sk,'beastlord')?m.sk.reduce((a,b)=>a+b,0)/2|0:0,lv:m.sk.reduce((a,b)=>a+b,0),
 in:G.inside?G.inside.key:0,ix:G.inside?G.inside.x:0,iy:G.inside?G.inside.y:0}}
function sendPresence(force){if(!G.roomH)return;const t=now();if(!force&&(!G.dirty||t-G.lastSend<70))return;G.lastSend=t;G.dirty=false;if(!G.isHost)G.roomH.setPresence(presence())}

// ---------- incoming world state ----------
function grant(p){const m=G.me;
 if(p.it)for(const a of p.it){const it=SC.unpack(a);if(!it)continue;const nm=SC.dispName(it,m.sk);addItem(it);UI.log('+ '+(it.k>1?it.k+'× ':'')+nm+(it.r?' ['+SC.RARITY[it.r]+']':''),'loot')}
 if(p.gold){m.gold=Math.max(0,m.gold+p.gold);UI.log((p.gold>0?'+':'')+p.gold+' gold',p.gold>0?'loot':'bad')}
 if(p.xp)for(const [k,n] of p.xp)addXP(k,n);
 if(p.hp){if(p.hp<0)hurt(-p.hp);else{m.hp=Math.min(m.mhp,m.hp+p.hp);float(m.x,m.y,'+'+p.hp,'#70f090')}}
 if(p.mp)m.mp=SC.clamp(m.mp+p.mp,0,m.mmp);
 if(p.msg)UI.log(p.msg);
 if(p.tp)teleport(p.tp[0],p.tp[1]);
 if(p.rv){const n=G.fog.reveal(p.rv[0],p.rv[1],p.rv[2]);if(n)UI.drawMini()}
 if(p.buff)m.buffs.push({atk:p.buff.atk|0,arm:p.buff.arm|0,until:now()+(p.buff.dur||60)*1000});
 if(p.tent)UI.refresh();
 done()}
function hurt(n){const m=G.me;if(G.inside)return;if(m.ward>0){const a=Math.min(m.ward,n);m.ward-=a;n-=a;if(a)float(m.x,m.y,'('+a+')','#a0c8ff');if(!n)return}m.hp-=n;SC.P.bleed(m.x,m.y,n,'red');m.lastHurt=now();m.hitT=now();G.shake=now();float(m.x,m.y,String(n),'#ff6060');if(m.hp<=0)die()}
function die(){const m=G.me;const lost=Math.floor(m.gold*.2);m.gold-=lost;m.hp=Math.round(m.mhp*.5);m.mp=Math.round(m.mmp*.5);UI.log(`You fall… and wake beneath the World Tree.${lost?' (Lost '+lost+' gold)':''}`,'bad');teleport(0,1);G.closeEnc=true}
function teleport(x,y){const m=G.me;let best=null;for(let r=0;r<6&&!best;r++)for(let j=-r;j<=r&&!best;j++)for(let i=-r;i<=r;i++){if(!G.world.solid(x+i,y+j)&&!monAt(x+i,y+j)){best=[x+i,y+j];break}}
 if(!best)best=[0,1];m.x=best[0];m.y=best[1];m.rx=m.x;m.ry=m.y;onStep(true)}
function applyWorld(s){if(!s)return;
 if(s.t!==undefined){G.hostTime=s.t;G.hostTimeAt=now()}
 if(Array.isArray(s.dl))for(const d of s.dl)G.world.setDelta(d[0]+','+d[1],d[2]);
 if(Array.isArray(s.ev))for(const e of s.ev){if(e[0]>G.evSeen){G.evSeen=e[0];if(e[1]===G.myId)try{grant(e[2]||{})}catch(err){console.warn(err)}}}
 if(Array.isArray(s.m)){const live=new Set();for(const a of s.m){live.add(a[0]);let e=G.mons.get(a[0]);if(!e){e={rx:a[2],ry:a[3],hit:0,dir:0};G.mons.set(a[0],e)}
  if(e.hp!==undefined&&a[4]<e.hp)e.hit=now();if(a[2]!==e.tx||a[3]!==e.ty){e.dir=a[3]>e.ty?0:a[3]<e.ty?3:a[2]<e.tx?1:2}
  Object.assign(e,{id:a[0],def:a[1],tx:a[2],ty:a[3],hp:a[4],mhp:a[5],lvl:a[6],custom:a[7]?{n:a[7],s:a[8],c:[a[9],a[10]]}:null});if(Math.abs(e.rx-e.tx)+Math.abs(e.ry-e.ty)>3){e.rx=e.tx;e.ry=e.ty}}
  for(const k of [...G.mons.keys()])if(!live.has(k)){const e=G.mons.get(k);if(e.hp<e.mhp*.45&&Math.abs(e.tx-G.me.x)<30&&Math.abs(e.ty-G.me.y)<30){const bk=SC.P.bloodKind(e.def,e.custom);SC.P.gore(e.tx,e.ty,bk[0],bk[1])}G.mons.delete(k)}}
 if(Array.isArray(s.fx))for(const f of s.fx)if(f[0]>G.fxSeen){G.fxSeen=f[0];if((f[4]===0||f[4]===1)&&/^\d+$/.test(f[3])){const mo=f[4]===0?[...G.mons.values()].find(e=>e.tx===f[1]&&e.ty===f[2]):null;const bk=mo?SC.P.bloodKind(mo.def,mo.custom):['red'];if(!(f[4]===1&&f[1]===G.me.x&&f[2]===G.me.y))SC.P.bleed(f[1],f[2],+f[3],bk[0],bk[1])}if(f[1]!==G.me.x||f[2]!==G.me.y||f[4]!==1)float(f[1],f[2],String(f[3]),['#ffffff','#ff6060','#70f090','#ffd860','#80d0ff'][f[4]|0])}
 if(Array.isArray(s.e)){G.encs=s.e;let mine=null;
  for(const a of s.e){const e={id:a[0],by:a[1],x:a[2],y:a[3],title:a[4],text:a[5],intent:a[6],opts:a[7],res:a[8],ok:a[9],picked:a[10]};
   if(e.by===G.myId){if(!G.encDismissed.has(e.id))mine=e}
   else if(Math.abs(e.x-G.me.x)<=14&&Math.abs(e.y-G.me.y)<=14){const who=(G.peers.get(e.by)||{presence:{}}).presence.n||(e.by===G.hostId?'The host':'Someone');
    if(!G.encSeen.has(e.id+'s')){G.encSeen.add(e.id+'s');UI.log(`${who} confronts ${e.title}.`)}if(e.res&&!G.encSeen.has(e.id+'r')){G.encSeen.add(e.id+'r');UI.log(`${who} chose ${(SC.RESPONSES[SC.RESI[e.picked]]||{}).l||'…'}: ${e.res}`,e.ok>0?'good':'bad')}}}
  if(mine)UI.showEnc(mine);else if(UI.isOpen('enc'))UI.close('enc')}
 if(s.c&&G.chest){const c=s.c[G.chest.key];if(c){const js=JSON.stringify(c);if(js!==G.chest.js){G.chest.js=js;G.chest.items=c.map(SC.unpack);G.chest.seen=now();if(UI.isOpen('chest'))UI.refresh()}else G.chest.seen=now()}
  else if(now()-(G.chest.seen||G.chest.t0)>3000){G.chest=null;UI.close('chest')}}}

// ---------- peers ----------
function onPeers(peers){const seen=new Set();
 for(const p of peers){if(p.isMe)continue;const pr=p.presence||{};if(pr.g!==G.code)continue;seen.add(p.id);G.peers.set(p.id,{presence:pr,last:now()});
  if(G.isHost){if(pr.r==='c')G.host.updatePlayer(p.id,pr)}
  else if(p.id===G.hostId&&pr.r==='h'){G.hostSeen=now();if(!G.gotWorld){G.gotWorld=true;hideBanner()}applyWorld(pr)}
  // chat
  if(Array.isArray(pr.say)){const last=G.saySeen.get(p.id);for(const s of pr.say){if(!Array.isArray(s))continue;if(last===undefined){continue}if(s[0]>last)UI.chat(clean(pr.n),String(s[1]).slice(0,90),SC.PCOL[(pr.col|0)%8][0])}
   G.saySeen.set(p.id,pr.say.reduce((m,s)=>Math.max(m,Array.isArray(s)?s[0]:0),last||0))}}
 for(const id of [...G.peers.keys()])if(!seen.has(id)){const pr=G.peers.get(id).presence;G.peers.delete(id);if(G.isHost&&G.host.players.has(id)){G.host.removePlayer(id);UI.log(clean(pr.n)+' left.')}
  if(!G.isHost&&id===G.hostId&&G.gotWorld)hostGone()}
 for(const id of seen)if(!G.knownPeers.has(id)){G.knownPeers.add(id);const pr=G.peers.get(id).presence;UI.log(clean(pr.n)+(pr.r==='h'?' (host)':'')+' is here.','good')}}
function hostGone(){showBanner('The host has left','This world lived in their browser. Your character and discoveries are saved; ask them for a fresh code.',true)}
function showBanner(t,txt,btn){let b=$('banner');if(!b){b=document.createElement('div');b.id='banner';b.className='win frame';b.style.cssText='left:50%;top:40%;transform:translate(-50%,-50%);width:min(460px,92vw);z-index:6';$('wins').appendChild(b)}
 b.innerHTML=`<div class="wtitle"><span class="rule"></span>◆<h2>${UI.esc(t)}</h2>◆<span class="rule"></span></div><div class="wbody"><p>${UI.esc(txt)}</p></div>${btn?'<div class="wfoot"><button class="btn">Back to title</button></div>':''}`;b.classList.remove('hidden');if(btn)b.querySelector('.btn').onclick=()=>game.leave()}
function hideBanner(){const b=$('banner');if(b)b.classList.add('hidden')}

// ---------- movement & actions ----------
const held=[];let tdir=-1;
game.touchDir=d=>{tdir=d};
function monAt(x,y){for(const m of G.mons.values())if(m.tx===x&&m.ty===y)return m;return null}
function blocked(x,y){return G.world.solid(x,y)||!!monAt(x,y)}
function onStep(force){const m=G.me;const n=G.fog.reveal(m.x,m.y,G.derived.sight);G.dirty=true;
 const bi=G.world.biome(m.x,m.y);if(bi!==G.lastBiome){G.lastBiome=bi;UI.setBiome(SC.BIOMES[bi],SC.levelAt(m.x,m.y))}
 if(UI.S.feat.autopick){const po=G.world.poi(m.x,m.y);if(po&&po.k==='col'&&!(G.pendingTake.get(po.key)>now()-2000)){G.pendingTake.set(po.key,now());game.pushReq(['take',po.x,po.y])}}
 if(G.chest&&Math.max(Math.abs(G.chest.x-m.x),Math.abs(G.chest.y-m.y))>2){UI.close('chest')}
 if(force||n)G.miniDirty=true}
function locked(){return !G.inGame||document.activeElement===$('chatIn')||(UI.isOpen('enc')&&!$('encWin').querySelector('.res'))}
function updateMove(dt){const m=G.me;m.mcd-=dt;let d=held.length?held[held.length-1]:tdir;if(locked())d=-1;const step=Math.max(70,SC.STEP/(G.derived.speed||1));
 if(G.inside){const I=G.inside;if(d>=0&&m.mcd<=0){m.mcd=Math.max(m.mcd,-60)+step;SC.P.insideStep(d)}if(G.inside){const sp=dt/step*1.06;const ox=I.rx,oy=I.ry;I.rx+=SC.clamp(I.x-I.rx,-sp,sp);I.ry+=SC.clamp(I.y-I.ry,-sp,sp);if(ox!==I.rx||oy!==I.ry)I.walk=now()}return}
 if(d>=0&&m.mcd<=0){m.d=d;const nx=m.x+SC.DX[d],ny=m.y+SC.DY[d];if(!blocked(nx,ny)){m.x=nx;m.y=ny;m.mcd=Math.max(m.mcd,-60)+step;onStep()}else{m.mcd=90;G.dirty=true}}
 const sp=dt/SC.STEP*1.06,spMe=dt/step*1.06;const mv=(e,s)=>{s=s||sp;const ox=e.rx,oy=e.ry;e.rx+=SC.clamp(e.tx-e.rx,-s,s);e.ry+=SC.clamp(e.ty-e.ry,-s,s);if(Math.abs(e.rx-e.tx)+Math.abs(e.ry-e.ty)>4){e.rx=e.tx;e.ry=e.ty}e.walk=(ox!==e.rx||oy!==e.ry)?now():e.walk||0};
 m.tx=m.x;m.ty=m.y;mv(m,spMe);for(const e of G.mons.values())mv(e);for(const e of G.prender.values())mv(e)}
function facing(){const m=G.me;return [m.x+SC.DX[m.d],m.y+SC.DY[m.d]]}
function targetMon(){const m=G.me,r=G.derived.reach;for(let k=1;k<=r;k++){const x=m.x+SC.DX[m.d]*k,y=m.y+SC.DY[m.d]*k;const mo=monAt(x,y);if(mo)return mo;if(G.world.solid(x,y))break}return null}
function interact(){const m=G.me;if(G.inside)return SC.P.insideAct();const [fx,fy]=facing();const mo=targetMon();if(mo)return attack(mo);
 let po=G.world.poi(fx,fy)||G.world.poi(m.x,m.y);if(!po){const p2=G.world.poi(fx+SC.DX[m.d],fy+SC.DY[m.d]);if(p2&&p2.k==='npc'&&!G.world.solid(fx,fy))po=p2}if(!po){m.swingT=now();return}
 if(po.k==='tent'){if(po.door||(fx===po.x&&fy===po.y+(po.size-1)/2)){SC.P.enter(po);return}UI.log(po.name?po.name+'\'s tent. The way in is the flap at the front.':'A tent.');return}
 if(po.k==='chest'){G.chest={key:po.key,x:po.x,y:po.y,storage:!!(po.storage||po.camp),items:null,t0:now()};game.pushReq(['open',po.x,po.y]);UI.open('inv');UI.open('chest');return}
 if(po.k==='npc'){if(G.world.deltas.get(po.key)==='n'&&!po.special){UI.log(po.name+' has nothing more to say.');return}G.encDismissed.clear();game.pushReq(['talk',po.x,po.y]);return}
 if(po.k==='ore'){m.swingT=now();game.pushReq(['mine',po.x,po.y]);return}
 if(po.k==='col'){game.pushReq(['take',po.x,po.y]);return}
 if(po.k==='fire'){UI.log('The campfire is warm. Somewhere beyond the trees, the realms are waiting.');return}}
function attack(mo){const m=G.me,D=G.derived,t=now();if(t-m.lastAtk<D.cd)return;m.lastAtk=t;m.swingT=t;let dmg=D.atk*(0.85+Math.random()*.3);
 if(D.magic>0&&m.mp>=D.mc){m.mp-=D.mc;dmg+=D.magic;if(D.mc)addXP('wizardry',1)}const mod=SC.P.attackMods(mo,dmg);dmg=Math.max(1,Math.round(mod.dmg));game.pushReq(['hit',mo.id,dmg,D.reach].concat(mod.flags?[mod.flags]:[]))}
game.action=function(a){const m=G.me;if(!G.inGame)return;const lv=k=>m.sk[SC.SKI[k]];
 switch(a){
 case'act':return interact();
 case'dig':if(lv('geologist')<1)return UI.log('Dig unlocks at Geologist 1.','bad');m.swingT=now();return game.pushReq(['dig',m.x,m.y]);
 case'blink':{if(lv('wizardry')<2)return UI.log('Blink unlocks at Wizardry 2.','bad');if(m.mp<6)return UI.log('Not enough magic.','bad');const range=Math.min(10,3+lv('wizardry')-2);let best=null;
  for(let k=range;k>=2;k--){const x=m.x+SC.DX[m.d]*k,y=m.y+SC.DY[m.d]*k;if(!blocked(x,y)){best=[x,y];break}}if(!best)return UI.log('Nowhere to blink to.','bad');
  m.mp-=6;float(m.x,m.y,'✧','#b8a0ff');m.x=best[0];m.y=best[1];onStep(true);addXP('wizardry',2);return}
 case'bamf':if(lv('wizardry')<4)return UI.log('Bamf unlocks at Wizardry 4.','bad');if(m.mp<20)return UI.log('Bamf needs 20 magic.','bad');return UI.openBamf();
 case'potion':{let bi=-1,bh=0;m.inv.forEach((it,i)=>{if(it&&it.b==='pot'){const h=SC.potionFx(it).hp||0;if(h>bh){bh=h;bi=i}}});if(bi<0)return UI.log('No healing potions.','bad');return drink(bi)}
 case'inv':return UI.toggle('inv');case'comp':return UI.toggle('comp');case'map':return UI.toggle('map');case'tent':return UI.toggle('tent');case'book':return UI.toggle('book');
 default:if(a&&a.startsWith('q'))return SC.P.useQuick(+a.slice(1))}};
game.doBamf=function(x,y){const m=G.me;if(!G.fog.isExp(x,y)){UI.log('You can only Bamf to places you have explored.','bad');return false}if(m.mp<20){UI.log('Bamf needs 20 magic.','bad');return false}
 const ids=G.peerList.filter(p=>!p.me&&Math.max(Math.abs(p.x-m.x),Math.abs(p.y-m.y))<=1).map(p=>p.id);m.mp-=20;game.pushReq(['bamf',x,y,ids]);float(m.x,m.y,'BAMF!','#ffd060');teleport(x,y);
 addXP('wizardry',6);UI.log('Bamf!'+(ids.length?` (${ids.length} companion${ids.length>1?'s':''} came along)`:''),'xp');return true};
game.setZoom=v=>{G.zoomMul=v};
Object.assign(game,{addXP,hurt:n=>hurt(n),float:(x,y,t,c)=>float(x,y,t,c),teleport:(x,y)=>teleport(x,y),onStep:f=>onStep(f),monAt:(x,y)=>monAt(x,y),blocked:(x,y)=>blocked(x,y),done:()=>done(),addItem:it=>addItem(it),consume:(i,n)=>consume(i,n),recompute:()=>recompute()});
game.salvage=function(s){const m=G.me,it=game.itemAt(s);if(!it||s.c!=='inv')return;if(!SC.hasAb(m.sk,'salvage'))return UI.log('Salvage unlocks at Crafting 4.','bad');m.inv[s.i]=null;SC.salvage(it).forEach(x=>addItem(x));addXP('crafting',4);UI.log('Salvaged into raw materials.','loot');UI.sel=null;done()};
game.reforge=function(s){const m=G.me,it=game.itemAt(s);if(!it)return;if(!SC.hasAb(m.sk,'reforge'))return UI.log('Reforge unlocks at Crafting 8.','bad');const j=m.inv.findIndex(x=>x&&x.b==='ing.'+(it.m||1));if(j<0)return UI.log('You need a '+SC.METALS[it.m||1].n+' ingot.','bad');consume(j);const q=Math.floor(Math.random()*100);it.q=Math.max(it.q,q);if(Math.random()<.15&&it.r<6){it.r++;UI.log('The reforging is flawless: rarity rises to '+SC.RARITY[it.r]+'!','loot')}else UI.log('Reforged. Quality now '+it.q+'.','good');addXP('crafting',6);done()};
game.transmute=function(s){const m=G.me,it=game.itemAt(s);if(!it||s.c!=='inv'||!SC.isStone(it))return;if(!SC.hasAb(m.sk,'transmute'))return UI.log('Transmute Stone unlocks at Geologist 20.','bad');const r=SC.transmuteStone(it,Math.random);consume(s.i);addItem(r);addXP('geologist',4);UI.log('Transmuted into '+SC.stats(r).name+'.','loot');done()};
game.portrait=function(cv,e){const c=cv.getContext('2d');c.imageSmoothingEnabled=false;const po=G.world.poi(e.x,e.y);if(!po)return;
 const K=po.kind>=0?SC.NPCKINDS[po.kind]:null;if(po.t==='hum'&&K)SC.paintPx(c,SC.humRows(0,0),{k:'#140e0a',s:'#f0c8a0',e:'#140e0a',h:SC.PHAIR[po.kind%8],c:K.c[0],d:K.c[1],b:'#3b2a20'},false);
 else if(po.t==='cre'&&K)SC.paintPx(c,SC.PX[K.s]||SC.PX.quad,{k:'#140e0a',c:K.c[0],d:K.c[1],e:'#ffe040',t:'#e8a030',l:'#fff',w:'#fff'},false);
 else{c.fillStyle='#6a7a6a';c.fillRect(4,2,8,13);c.fillStyle='#7affd8';c.fillRect(7,5,2,6)}};

function npcLook(po,K){const L={skin:po.kind===12||po.kind===13?'#9aa898':'#f0c8a0',hair:SC.PHAIR[po.kind%8],tunic:K.c[0],tunic2:K.c[1],trousers:'#4a3a2a'};const R=SC.h2(po.x,po.y,7);
 const W=['axe','spear','sword','staff','hammer','dagger','bow','mace'];if(po.disp==='hostile'||R<.5){L.wt=W[(R*97|0)%8];L.wc='#8a8f98';L.wc2='#c0c4cc'}if(R>.6)L.cloak=SC.shade(K.c[1],-10);if(po.disp==='hostile'&&R>.3)L.head='#7a7a82';if(R<.25)L.shield='#7a4a24';return L}
// ---------- floating text ----------
function float(x,y,text,col){if(!UI.S.feat.dmg&&/^\d+$/.test(text))return;G.floats.push({x,y,text,col,born:now()})}

// ---------- rendering ----------
const glc=$('gl'),ov=$('ov'),oc=ov.getContext('2d');
function dayAmb(bi){const T=(G.hostTime+(now()-G.hostTimeAt))/1000;const ph=((T/720)+.32)%1;const day=.5-.5*Math.cos(ph*Math.PI*2);const k=SC.clamp((day-.18)/.5,0,1);const B=SC.BIOMES[bi].amb;
 if(!UI.S.feat.daynight)return B;const n=[.17,.19,.32];return [SC.lerp(n[0]*B[0],B[0],k),SC.lerp(n[1]*B[1],B[1],k),SC.lerp(n[2]*B[2],B[2],k)]}
function render(t){const dpr=Math.min(2,devicePixelRatio||1);const w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);R.resize(w,h);if(ov.width!==w||ov.height!==h){ov.width=w;ov.height=h}
 const m=G.me,W=G.world,D=G.derived;
 const across=SC.clamp(innerWidth/94,9,26);const zoom=w/(across*16)*G.zoomMul;
 if(G.inside){const c=SC.P.renderInterior(R,t,w,h,zoom);oc.setTransform(1,0,0,1,0,0);oc.clearRect(0,0,w,h);const I=G.inside;const fsz=Math.max(12,Math.round(13*dpr));oc.font=`${fsz}px Averia Serif Libre, serif`;oc.textAlign='center';
  for(const [id,p] of G.peers){const pr=p.presence;if(pr.in!==I.key)continue;const sx=((pr.ix|0)*16+8-c.cx)*c.zoom+w/2,sy=((pr.iy|0)*16-c.cy)*c.zoom+h/2;oc.fillStyle='rgba(10,7,5,.65)';const tw=oc.measureText(clean(pr.n)).width;oc.fillRect(sx-tw/2-5,sy-fsz-2,tw+10,fsz+4);oc.fillStyle=SC.PCOL[(pr.col|0)%8][0];oc.fillText(clean(pr.n),sx,sy)}
  G.peerList=[{id:G.myId,me:true,n:G.name,col:G.col,x:m.x,y:m.y,hp:m.hp,mhp:m.mhp}].concat([...G.peers].filter(([i,p])=>typeof p.presence.x==='number').map(([id,p])=>({id,me:false,n:clean(p.presence.n),col:(p.presence.col|0)%8,x:p.presence.x,y:p.presence.y,hp:p.presence.hp|0,mhp:p.presence.mhp|0,host:p.presence.r==='h'})));return}
 let cx=m.rx*16+8,cy=m.ry*16+8;if(now()-(G.shake||0)<180){cx+=(Math.random()-.5)*4;cy+=(Math.random()-.5)*4}
 cx=Math.round(cx*zoom)/zoom;cy=Math.round(cy*zoom)/zoom;
 R.begin(cx,cy,zoom);const hw=w/zoom/2,hh=h/zoom/2;const x0=Math.floor((cx-hw)/16)-1,x1=Math.ceil((cx+hw)/16)+1,y0=Math.floor((cy-hh)/16)-1,y1=Math.ceil((cy+hh)/16)+1;
 const seed=W.seed;let em=0;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const k=W.tile(x,y),bi=W.biome(x,y);const v=(SC.h2(x,y,seed^5)*4)|0;R.quad(R.tileCell(bi,k,v),x*16,y*16,16,16,1,1,1,SC.tileFlag(bi,k));
  const lc=SC.tileLight(bi,k);if(lc&&em<90&&G.fog.isExp(x,y)&&((x*7+y*13)&1)===0){em++;const c=SC.rgb(lc);R.addLight(x*16+8,y*16+8,38,[c[0]/255,c[1]/255,c[2]/255],.42)}}
 SC.P.renderDecals(R);
 // entities
 const ents=[];const tx=Math.round(m.rx),ty=Math.round(m.ry);const rng=Math.ceil(Math.max(hw,hh)/16)+2;const geo=m.sk[3];
 for(const po of W.nearbyPois(tx,ty,rng)){const px=po.x*16,py=po.y*16;const st=W.deltas.get(po.key);
  if(po.k==='col'){const it={b:po.id,r:0,q:50};const bob=Math.sin(t/400+po.x)*1.2;ents.push({y:po.y,f:()=>{R.quad(R.iconCell(it),px+2,py+1+bob,12,12,1,1,1,po.rare?1:0)}});if(po.rare){const c=SC.rgb(SC.ITEMS[po.id].col[0]);R.addLight(px+8,py+8,40,[c[0]/255,c[1]/255,c[2]/255],.7)}}
  else if(po.k==='tent'){if(G._tdf!==G._fid){G._tdf=G._fid;G._td=new Set()}if(G._td.has(po.key))continue;G._td.add(po.key);const N=po.size,hf=(N-1)/2;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const X=(po.x-hf+i)*16,Y=(po.y-hf+j)*16;ents.push({y:po.y-hf+j-.4,f:()=>R.quad(R.tentCell(N,po.hue,i,j),X,Y,16,16,1,1,1,0)})}R.addLight(po.x*16+8,(po.y+hf)*16+8,30,[1,.8,.5],.3*po.light/100+.05)}
  else if(po.k==='chest')ents.push({y:po.y,f:()=>R.quad(R.miscCell(po.storage||po.camp?'chests':st==='o'?'chesto':'chest'),px,py,16,16,1,1,1,0)});
  else if(po.k==='ore')ents.push({y:po.y,f:()=>R.quad(R.miscCell('ore',po.tier),px,py,16,16,1,1,1,0)});
  else if(po.k==='fire'){ents.push({y:po.y,f:()=>R.quad(R.miscCell('fire',((t/150)|0)%2),px,py,16,16,1,1,1,1)});R.addLight(px+8,py+8,140+Math.sin(t/90)*6,[1,.62,.3],1)}
  else if(po.k==='dig'){if(geo>=1&&st!=='d'&&Math.max(Math.abs(po.x-m.x),Math.abs(po.y-m.y))<=1+geo*2&&Math.sin(t/220+po.x*3)>.2)ents.push({y:po.y-.5,f:()=>R.quad(R.miscCell('dig'),px,py,16,16,1,1,1,1)})}
  else if(po.k==='npc'){const K=po.kind>=0?SC.NPCKINDS[po.kind]:null;const resolved=st==='n';
   ents.push({y:po.y,f:()=>{let cell;if(po.special==='sapling')cell=R.structCell('sapling','#000','#000');
    else if(po.t==='hum'){const dir=Math.abs(m.x-po.x)+Math.abs(m.y-po.y)<=3?(m.x<po.x?1:m.x>po.x?2:m.y<po.y?3:0):0;cell=R.charCell(npcLook(po,K),dir,0)}
    else if(po.t==='cre')cell=R.shapeCell(K.s,K.c[0],K.c[1],m.x<po.x);else cell=R.structCell(K.s,K.c[0],K.c[1]);
    const s=K&&K.big?20:16;R.quad(cell,px+8-s/2,py+16-s,s,s,resolved&&po.t==='str'?.6:1,resolved&&po.t==='str'?.6:1,resolved&&po.t==='str'?.6:1,0)}});
   if(po.special)R.addLight(px+8,py+8,70,[.8,1,.6],.6);if(po.t==='str'&&!resolved)R.addLight(px+8,py+6,30,[.5,1,.85],.35);
   po._ov=!resolved}}
 for(const e of G.mons.values()){const px=e.rx*16,py=e.ry*16;const D2=e.custom||SC.monDef(e.def)||{s:'blob',c:['#888','#444']};const hit=now()-e.hit<140;const tint=hit?3:1;const mov=now()-(e.walk||0)<120;
  const bob=D2.s==='bat'||D2.s==='bird'||D2.s==='wisp'?Math.sin(t/120+e.id)*2-3:D2.s==='blob'?Math.sin(t/200+e.id):0;
  ents.push({y:e.ry,f:()=>{const cell=D2.s==='hum'?R.shapeCell('hum',D2.c[0],D2.c[1],false,e.dir|0):R.shapeCell(D2.s,D2.c[0],D2.c[1],e.dir===1);R.quad(cell,px,py+bob-(mov?1:0),16,16,tint,tint,tint,D2.s==='wisp'?1:0)}});
  if(D2.s==='wisp'){const c=SC.rgb(D2.c[0]);R.addLight(px+8,py+8,48,[c[0]/255,c[1]/255,c[2]/255],.6)}}
 // players
 const plist=[];const meP={id:G.myId,me:true,n:G.name,col:G.col,x:m.x,y:m.y,rx:m.rx,ry:m.ry,d:m.d,hp:m.hp,mhp:m.mhp,walk:m.walk,host:G.isHost};plist.push(meP);
 for(const [id,p] of G.peers){const pr=p.presence;if(typeof pr.x!=='number')continue;let e=G.prender.get(id);if(!e){e={rx:pr.x,ry:pr.y};G.prender.set(id,e)}e.tx=pr.x;e.ty=pr.y;
  plist.push({id,me:false,n:clean(pr.n),col:(pr.col|0)%8,x:pr.x,y:pr.y,rx:e.rx,ry:e.ry,d:pr.d|0,hp:pr.hp|0,mhp:pr.mhp|0,walk:e.walk,host:pr.r==='h',ap:pr.ap,inTent:!!pr.in})}
 for(const k of [...G.prender.keys()])if(!G.peers.has(k))G.prender.delete(k);
 G.peerList=plist;
 for(const p of plist){const mov=now()-(p.walk||0)<120;const fr=mov?(((t/130)|0)%2)+1:0;const px=p.rx*16,py=p.ry*16;const hit=p.me&&now()-m.hitT<160;const tint=hit?3:1;
  if(p.inTent)continue;const look=p.me?(G.look||SC.lookFromEq(m.eq,G.col)):SC.lookUnpack(p.ap,p.col);ents.push({y:p.ry+.01,f:()=>R.quad(R.charCell(look,p.d,fr),px,py-(mov&&fr===1?1:0),16,16,tint,tint,tint,0)});
  const sight=p.me?D.sight:6;R.addLight(px+8,py+8,(sight+.5)*16,[1,.84,.6],p.me?.9:.6)}
 ents.sort((a,b)=>a.y-b.y);for(const e of ents)e.f();SC.P.renderParts(R,G._dt||16);
 // fog grid
 const fw=x1-x0+1,fh=y1-y0+1;if(!G.fogBuf||G.fogBuf.length<fw*fh)G.fogBuf=new Uint8Array(fw*fh*2);const fb=G.fogBuf;const sg=D.sight;
 for(let j=0;j<fh;j++)for(let i=0;i<fw;i++){const x=x0+i,y=y0+j;let v=G.fog.isExp(x,y)?135:0;const d=Math.hypot(x-m.rx,y-m.ry);if(d<sg+.5){const k=SC.clamp((sg+.5-d)/1.6,0,1);v=Math.max(v,Math.round(135+120*k))}fb[j*fw+i]=v}
 R.end({time:t/1000,lights:UI.S.feat.lights,fogOn:UI.S.feat.fog,amb:dayAmb(W.biome(m.x,m.y)),fog:{x0,y0,w:fw,h:fh,data:fb.subarray(0,fw*fh)}});
 // overlay
 oc.setTransform(1,0,0,1,0,0);oc.clearRect(0,0,w,h);const S=(x,y)=>[(x*16-cx)*zoom+w/2,(y*16-cy)*zoom+h/2];const fs=Math.max(12,Math.round(13*dpr));
 const vis=(x,y)=>!UI.S.feat.fog||Math.hypot(x-m.rx,y-m.ry)<sg+.5;
 oc.textAlign='center';
 if(UI.S.feat.names){oc.font=`${fs}px Averia Serif Libre, serif`;
  for(const p of plist){if(p.me)continue;const [sx,sy]=S(p.rx+.5,p.ry);label(sx,sy-4*dpr,p.n,SC.PCOL[p.col][0])}
  for(const e of G.mons.values()){if(!vis(e.tx,e.ty))continue;const D2=e.custom||SC.monDef(e.def);const [sx,sy]=S(e.rx+.5,e.ry);
   if(e.hp<e.mhp){oc.fillStyle='#000';oc.fillRect(sx-14*dpr,sy-6*dpr,28*dpr,5*dpr);oc.fillStyle='#e04848';oc.fillRect(sx-13*dpr,sy-5*dpr,26*dpr*Math.max(0,e.hp/e.mhp),3*dpr)}
   if(Math.abs(e.tx-m.x)+Math.abs(e.ty-m.y)<=5){oc.font=`${Math.round(fs*.85)}px Averia Serif Libre, serif`;label(sx,sy-9*dpr,`${D2.n} · ${e.lvl}`,'#ff9a8a')}}}
 oc.font=`bold ${Math.round(fs*1.5)}px MedievalSharp, serif`;
 for(const po of W.nearbyPois(tx,ty,rng)){if(po.k!=='npc'||!po._ov||!vis(po.x,po.y))continue;const [sx,sy]=S(po.x+.5,po.y-.15);const col={friendly:'#7fe08a',neutral:'#ffd860',hostile:'#ff6050'}[po.disp]||'#ffd860';
  const b=Math.sin(t/260+po.x)*3*dpr;oc.fillStyle='#000';oc.fillText('!',sx+1.5,sy+b+1.5);oc.fillStyle=col;oc.fillText('!',sx,sy+b);
  if(UI.S.feat.names&&Math.abs(po.x-m.x)+Math.abs(po.y-m.y)<=4){oc.font=`${Math.round(fs*.85)}px Averia Serif Libre, serif`;label(sx,sy-fs*1.3,po.name,col);oc.font=`bold ${Math.round(fs*1.5)}px MedievalSharp, serif`}}
 oc.font=`bold ${Math.round(fs*1.25)}px Averia Serif Libre, serif`;G.floats=G.floats.filter(f=>now()-f.born<1100);
 for(const f of G.floats){const a=(now()-f.born)/1100;const [sx,sy]=S(f.x+.5,f.y-.2);const yy=sy-a*36*dpr;oc.globalAlpha=1-a*a;oc.fillStyle='#000';oc.fillText(f.text,sx+2,yy+2);oc.fillStyle=f.col;oc.fillText(f.text,sx,yy);oc.globalAlpha=1}
 if(now()-m.swingT<160){const [sx,sy]=S(m.rx+.5+SC.DX[m.d]*.7,m.ry+.5+SC.DY[m.d]*.7);oc.strokeStyle='rgba(255,240,200,.8)';oc.lineWidth=3*dpr;oc.beginPath();oc.arc(sx,sy,10*dpr,0,Math.PI*2*(now()-m.swingT)/160);oc.stroke()}
 function label(x,y,s,col){const tw=oc.measureText(s).width;oc.fillStyle='rgba(10,7,5,.65)';oc.fillRect(x-tw/2-5,y-fs,tw+10,fs+4);oc.fillStyle=col;oc.fillText(s,x,y)}}
function promptText(){const m=G.me;if(locked())return'';if(G.inside){const I=G.inside;const L=I.lay;const k=L.t[(I.y+SC.DY[I.d])*L.W+I.x+SC.DX[I.d]];return k==='bed'?'<kbd>Space</kbd> Rest on the bedroll':k==='lamp'?'<kbd>Space</kbd> Tent settings':'Walk out through the flap to leave'}const mo=targetMon();if(mo){const D2=mo.custom||SC.monDef(mo.def);return `<kbd>Space</kbd> Attack ${UI.esc(D2.n)}`}
 const [fx,fy]=facing();let po=G.world.poi(fx,fy)||G.world.poi(m.x,m.y);if(!po){const p2=G.world.poi(fx+SC.DX[m.d],fy+SC.DY[m.d]);if(p2&&p2.k==='npc'&&!G.world.solid(fx,fy))po=p2}if(!po)return'';
 if(po.k==='tent')return po.door||(fx===po.x&&fy===po.y+(po.size-1)/2)?`<kbd>Space</kbd> Enter ${UI.esc(po.name?po.name+'\'s ':'')}tent`:'';
 if(po.k==='chest')return `<kbd>Space</kbd> Open ${po.storage||po.camp?'storage chest':'chest'}`;if(po.k==='npc')return G.world.deltas.get(po.key)==='n'&&!po.special?'':`<kbd>Space</kbd> Talk to ${UI.esc(po.name)}`;
 if(po.k==='ore')return `<kbd>Space</kbd> Mine ${UI.esc(SC.METALS[po.tier].n)} ore`;if(po.k==='col')return `<kbd>Space</kbd> Pick up ${UI.esc(SC.dispName({b:po.id},m.sk))}`;if(po.k==='fire')return'The campfire';return''}

// ---------- main loop ----------
let last=now(),tick=0;
function frame(t){requestAnimationFrame(frame);const dt=Math.min(100,t-last);last=t;G._dt=dt;G._fid=(G._fid|0)+1;if(!G.inGame||!R)return;
 try{updateMove(dt);const m=G.me;tick+=dt;
  if(tick>1000){tick=0;const rg=G.inside?4:1;if(now()-m.lastHurt>5000||G.inside){m.hp=Math.min(m.mhp,m.hp+(1+m.mhp*.02)*rg);m.mp=Math.min(m.mmp,m.mp+(1+m.mmp*.03)*rg)}SC.P.tick();const nb=m.buffs.length;recompute();if(nb!==m.buffs.length)UI.log('An effect wore off.')}
  render(t);UI.hudTick();UI.tickCraft();UI.updateVitals();UI.updateParty(G.peerList.filter(p=>!p.me));
  if(!G._pt||t-G._pt>150){G._pt=t;UI.prompt(promptText())}
  if(G.miniDirty&&(!G._mt||t-G._mt>250)){G._mt=t;G.miniDirty=false;UI.drawMini()}
  if(G.closeEnc){G.closeEnc=false;UI.close('enc')}
  sendPresence()}catch(e){console.error(e);if(!G._errShown){G._errShown=1;UI.log('Error: '+e.message,'bad')}}}

// ---------- input ----------
const KD={ArrowDown:0,s:0,S:0,ArrowLeft:1,a:1,A:1,ArrowRight:2,d:2,D:2,ArrowUp:3,w:3,W:3};
addEventListener('keydown',e=>{if(!G.inGame)return;const ae=document.activeElement;
 if(e.key==='Escape'){if(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA')){ae.blur();return}if(!UI.closeTop())UI.toggle('settings');return}
 if(ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.tagName==='SELECT'))return;
 if(e.key in KD){const d=KD[e.key];if(!held.includes(d))held.push(d);e.preventDefault();return}
 if(e.repeat)return;const k=e.key.toLowerCase();
 if(k===' '||k==='e'||k==='enter'){e.preventDefault();const enc=$('encWin');if(UI.isOpen('enc')&&enc.querySelector('.res')){enc.querySelector('.res').nextSibling.click();return}game.action('act')}
 else if(k>='4'&&k<='8')game.action('q'+(+k-4));else if(k==='g')UI.toggle('tent');else if(k==='b')UI.toggle('book');
 else if(k==='1')game.action('dig');else if(k==='2')game.action('blink');else if(k==='3')game.action('bamf');else if(k==='q')game.action('potion');
 else if(k==='i')UI.toggle('inv');else if(k==='j'||k==='c')UI.toggle('comp');else if(k==='k')UI.toggle('skills');else if(k==='m')UI.toggle('map');
 else if(k==='t'){e.preventDefault();UI.poke('chat');$('chatIn').focus()}else if(k==='+'||k==='='){G.zoomMul=SC.clamp(G.zoomMul*1.15,.35,2.5)}else if(k==='-'){G.zoomMul=SC.clamp(G.zoomMul/1.15,.35,2.5)}});
addEventListener('keyup',e=>{if(e.key in KD){const i=held.indexOf(KD[e.key]);if(i>=0)held.splice(i,1)}});
addEventListener('blur',()=>{held.length=0;tdir=-1});
glc.addEventListener('wheel',e=>{if(!G.inGame)return;e.preventDefault();G.zoomMul=SC.clamp(G.zoomMul*(e.deltaY<0?1.12:1/1.12),.35,2.5)},{passive:false});
addEventListener('pagehide',()=>{if(G.inGame&&UI.S.autosave)game.saveNow()});
setInterval(()=>{if(G.inGame&&UI.S.autosave)game.saveNow()},20000);

// ---------- start / leave ----------
function enter(){G.inGame=true;$('title').classList.add('hidden');$('hud').classList.remove('hidden');recompute();G.fog.reveal(G.me.x,G.me.y,G.derived.sight);G.lastBiome=-1;onStep(true);UI.applyHud();UI.updateHot();UI.drawMini();
 UI.log(G.isHost?`Welcome to ${G.world.seedStr}. Invite code: ${G.code} (Settings → Multiplayer).`:'Joining world '+G.world.seedStr+'…','good');UI.log('Talk to the Elder Sapling, then walk outward. Rarer, deadlier things lie farther out.')}
function baseStart(seed){game.leaveQuiet();G.world=new SC.World(seed);const ws=LS.get('sc.world.'+seed)||{};G.fog=new Fog();G.fog.load(ws.fog||{});
 G.me=charLoad(LS.get('sc.char'));G.name=clean($('nameIn').value)||G.name;G.col=G.colPick|0;if(ws.pos){G.me.x=ws.pos[0];G.me.y=ws.pos[1]}
 if(G.world.solid(G.me.x,G.me.y)){G.me.x=0;G.me.y=1}G.me.rx=G.me.x;G.me.ry=G.me.y;G.zoomMul=UI.S.zoom||1;return ws}
async function startHost(seed){const ws=baseStart(seed);G.isHost=true;G.myId=NET.me;G.hostId=NET.me;G.code=seed+'.'+NET.me;G.host=new SC.Host(G.world);G.host.load(ws.host);
 G.host.updatePlayer(G.myId,presence());
 try{G.roomH=await NET.join(roomName(G.code),G.hostId)}catch(e){G.roomH=null}if(G.roomH)G.roomH.onPeers(onPeers);
 let lt=now(),flip=0;G.hostTimer=setInterval(()=>{const t=now(),dt=Math.min(300,t-lt);lt=t;G.host.updatePlayer(G.myId,presence());G.host.step(dt);
  const snap=G.host.snapshot();applyWorld(snap);if(G.roomH&&(flip=(flip+1)%2)===0)G.roomH.setPresence(SC.fitPresence(Object.assign(presence(),snap)))},50);
 enter()}
async function startClient(pc){const ws=baseStart(pc.seed);G.isHost=false;G.myId=NET.me;G.hostId=pc.host;G.code=pc.code;G.gotWorld=false;
 G.roomH=await NET.join(roomName(G.code),G.hostId);G.roomH.onPeers(onPeers);G.roomH.setPresence(presence());enter();showBanner('Connecting…','Growing the lands from seed '+pc.seed+' and waiting for the host.',false);
 G.joinAt=now();G.watch=setInterval(()=>{if(!G.inGame)return;if(!G.gotWorld){if(now()-G.joinAt>12000)showBanner('Can\'t reach the host','Check the code, and make sure the host still has the world open.',true);return}
  if(now()-(G.hostSeen||0)>8000)hostGone()},1000)}
game.leaveQuiet=function(){if(G.inGame&&UI.S.autosave)game.saveNow();if(G.hostTimer)clearInterval(G.hostTimer);if(G.watch)clearInterval(G.watch);if(G.roomH)G.roomH.leave();
 Object.assign(G,{inGame:false,host:null,roomH:null,hostTimer:null,watch:null,peers:new Map(),prender:new Map(),mons:new Map(),encs:[],encDismissed:new Set(),encSeen:new Set(),chest:null,q:[],seq:0,say:[],saySeen:new Map(),evSeen:0,fxSeen:0,floats:[],knownPeers:new Set(),gotWorld:false,pendingTake:new Map()});
 for(const k of ['inv','chest','comp','skills','map','settings','enc'])UI.close(k);hideBanner()};
game.leave=function(){game.leaveQuiet();$('hud').classList.add('hidden');$('title').classList.remove('hidden');titleInit()};
G.knownPeers=new Set();

// ---------- title ----------
const randomSeed=()=>Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b%32]).join('');
let pvT=null;
function preview(){clearTimeout(pvT);pvT=setTimeout(()=>{const s=normSeed($('seedIn').value);if(!s){$('prevName').textContent='Type a seed';return}const w=new SC.World(s);const c=$('preview').getContext('2d');const img=c.createImageData(120,120);
 for(let j=0;j<120;j++)for(let i=0;i<120;i++){const x=(i-60)*11,y=(j-60)*11;const d=Math.hypot(x,y);const col=SC.rgb(SC.BIOMES[w.biome(x,y)].pal.g[0]);const o=(j*120+i)*4;const f=d>650?.55:1;img.data[o]=col[0]*f;img.data[o+1]=col[1]*f;img.data[o+2]=col[2]*f;img.data[o+3]=255}
 c.putImageData(img,0,0);c.fillStyle='#ffd060';c.fillRect(58,58,4,4);const set=new Set();for(let a=0;a<40;a++)set.add(w.biome(Math.round(Math.cos(a)*400),Math.round(Math.sin(a)*400)));
 $('prevName').textContent=`Seed ${s}: the World Tree stands in the Heartlands. Around it: ${[...set].slice(0,4).map(i=>SC.BIOMES[i].name).join(', ')}…`},150)}
function titleInit(){const ch=LS.get('sc.char');if(ch&&ch.name)$('nameIn').value=ch.name;G.colPick=ch&&ch.col!==undefined?ch.col:(G.colPick|0);
 const cp=$('colorPick');cp.innerHTML='';SC.PCOL.forEach((c,i)=>{const b=document.createElement('button');b.style.background=c[0];b.title='Colour '+(i+1);if(i===G.colPick)b.classList.add('on');b.onclick=()=>{G.colPick=i;cp.querySelectorAll('button').forEach((x,j)=>x.classList.toggle('on',j===i))};cp.appendChild(b)});
 const last=LS.get('sc.last');const cb=$('contBtn');if(last){cb.textContent='Continue world '+last;cb.classList.remove('hidden');cb.onclick=()=>{$('seedIn').value=last;$('hostBtn').click()}}else cb.classList.add('hidden');
 if(!$('seedIn').value)$('seedIn').value=randomSeed();preview()}
function boot(){UI.loadSettings();UI.build();
 try{R=new SC.Renderer(glc)}catch(e){$('titleErr').textContent='This game needs WebGL2, which this browser could not start: '+e.message}
 titleInit();$('seedIn').addEventListener('input',preview);$('rerollBtn').onclick=()=>{$('seedIn').value=randomSeed();preview()};
 $('hostBtn').onclick=()=>{if(!R)return;$('titleErr').textContent='';G.name=clean($('nameIn').value);startHost(normSeed($('seedIn').value)||randomSeed())};
 $('joinBtn').onclick=()=>{if(!R)return;const pc=parseCode($('joinIn').value);$('titleErr').textContent='';if(!pc){$('titleErr').textContent='That code doesn\'t look right. It should look like SEED.hostcode.';return}
  if(NET.kind==='offline'){$('titleErr').textContent='Multiplayer isn\'t available here.';return}if(pc.host===NET.me){$('titleErr').textContent='That\'s your own code. Share it with a friend.';return}G.name=clean($('nameIn').value);startClient(pc).catch(e=>{$('titleErr').textContent='Couldn\'t join: '+(e&&(e.code||e.message))})};
 $('joinIn').addEventListener('keydown',e=>{if(e.key==='Enter')$('joinBtn').click()});
 $('importBtn').onclick=()=>$('importFile').click();
 $('importFile').onchange=async()=>{const f=$('importFile').files[0];if(!f)return;try{const o=importSave(await f.text());$('titleErr').textContent='';$('titleNet').textContent=`Loaded ${o.char.name||'character'} (${Object.keys(o.worlds||{}).length} world${Object.keys(o.worlds||{}).length===1?'':'s'}).`;titleInit()}catch(e){$('titleErr').textContent='Could not load: '+e.message}$('importFile').value=''};
 initNet().then(n=>{NET=n;$('titleNet').textContent=game.netNote();$('hostBtn').disabled=!R;$('joinBtn').disabled=!R||NET.kind==='offline'});
 requestAnimationFrame(frame)}
boot();
})();
