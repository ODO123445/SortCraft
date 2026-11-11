// SortCraft — new creatures, portraits, appearance editing, readable text, biome mist, music, console
(function(){
'use strict';
const SC=globalThis.SC;

// ---------- levels: 1 to 9001, rising with distance from the centre ----------
SC.MAXLVL=9001;
SC.levelAt=(x,y)=>Math.min(SC.MAXLVL,1+Math.floor(SC.dist(x,y)/45));

// ---------- new creatures ----------
const NEWMON=[
 {n:'Gibbon',s:'ape',c:['#8a6a4a','#4a3420'],hp:9,atk:3,spd:380,re:[2]},
 {n:'Falcon',s:'bird',c:['#8a6a40','#f0e0c0'],hp:7,atk:4,spd:330,re:[3,8]},
 {n:'Pangolin',s:'pangolin',c:['#a08060','#5a4430'],hp:14,atk:3,spd:700,re:[0,2]},
 {n:'Leachianus Gecko',s:'lizard',c:['#7a8a5a','#4a5a34'],hp:8,atk:3,spd:420,re:[2,6]},
 {n:'Cave Bat',s:'bat',c:['#6a5040','#3a2a20'],hp:5,atk:2,spd:340,re:[6,7,0]},
 {n:'Wolpertinger',s:'wolper',c:['#b08a60','#6a4a2a'],hp:9,atk:3,spd:400,re:[0,1]},
 {n:'Yeti',s:'yeti',c:['#eef2f6','#8aa0b8'],hp:30,atk:8,spd:620,re:[4,3]},
 {n:'Ogopogo',s:'lakeserp',c:['#3a7a5a','#1f4a34'],hp:26,atk:7,spd:520,re:[2,4]},
 {n:'Bunyip',s:'bunyip',c:['#3a3028','#1a1410'],hp:22,atk:7,spd:560,re:[7,2]},
 {n:'Mermaid',s:'mermaid',c:['#3ab0a0','#e0b050'],hp:14,atk:5,spd:480,re:[1,4]},
 {n:'Kappa',s:'kappa',c:['#5a9a4a','#3a6a2a'],hp:12,atk:4,spd:460,re:[2,6]},
 {n:'Axolotl',s:'lizard',c:['#f0a0b8','#c06080'],hp:6,atk:2,spd:520,re:[1,4]}];
NEWMON.forEach(m=>{m.r=m.re[0];SC.MONSTERS.push(m)});
SC.monstersFor=function(bi){const b=SC.BIOMES[bi];const rs=b.hybrid?[b.a,b.b]:[bi];
 const out=SC.MONSTERS.map((m,i)=>i).filter(i=>{const M=SC.MONSTERS[i];return (M.re||[M.r]).some(r=>rs.includes(r))});return b.hybrid?out.concat([1000+bi]):out};
[['Gibbon','ape',[2],'#8a6a4a','#4a3420'],['Falcon','bird',[3,8],'#8a6a40','#f0e0c0'],['Pangolin','pangolin',[0,2],'#a08060','#5a4430'],['Leachianus Gecko','lizard',[2,6],'#7a8a5a','#4a5a34'],
 ['Wolpertinger','wolper',[0,1],'#b08a60','#6a4a2a'],['Yeti','yeti',[4,3],'#eef2f6','#8aa0b8'],['Ogopogo','lakeserp',[2,4],'#3a7a5a','#1f4a34'],['Bunyip','bunyip',[7,2],'#3a3028','#1a1410'],
 ['Mermaid','mermaid',[1,4],'#3ab0a0','#e0b050'],['Kappa','kappa',[2,6],'#5a9a4a','#3a6a2a'],['Axolotl','lizard',[1,4],'#f0a0b8','#c06080']]
 .forEach(k=>SC.NPCKINDS.push({n:k[0],t:'cre',s:k[1],re:k[2],c:[k[3],k[4]]}));
SC.NPCKINDS.push({n:'Wispper',t:'cre',s:'wisp',re:'all',c:['#c8f0ff','#6aa0d0'],wispper:true});
SC.SHAPES16=['ape','pangolin','lizard','wolper','yeti','lakeserp','bunyip','mermaid','kappa'];
SC.isHumanoidShape=s=>s==='hum'||s==='yeti'||s==='mermaid'||s==='kappa';

// ---------- 16×16 sprites for the new body shapes (facing right) ----------
SC.paintCreature=function(g,shape,c0,c1,ox,oy){const P=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(ox+x,oy+y,w||1,h||1)};const E='#140e0a',W='#ffffff',L=SC.shade(c0,45),D=c1,SK='#f0c8a0';
 switch(shape){
 case'ape':P(c0,3,2,2,9);P(c0,11,2,2,9);P(D,3,1,2,2);P(D,11,1,2,2);P(c0,5,5,6,7);P(L,6,7,4,3);P(c0,5,1,6,5);P('#e8c8a0',6,2,4,3);P(E,7,3);P(E,9,3);P(D,7,5,2,1);P(c0,5,12,2,3);P(c0,9,12,2,3);P(D,5,14,2,1);P(D,9,14,2,1);break;
 case'pangolin':P(c0,2,8,11,5);P(c0,4,7,7,1);P(L,4,7,6,1);for(let i=0;i<4;i++){P(D,3+i*3,9,2,1);P(D,2+i*3,11,2,1)}P(c0,13,10,2,2);P(E,14,10);P('#d8b890',15,11);P(c0,0,11,3,2);P(c0,0,13,1,1);P(D,4,13,2,2);P(D,10,13,2,2);break;
 case'lizard':P(c0,4,8,8,3);P(c0,12,7,3,3);P('#e8d040',13,7);P(E,14,8);P(c0,1,9,3,2);P(c0,0,11,2,1);P(c0,5,11,1,2);P(c0,10,11,1,2);P(c0,5,6,1,2);P(c0,10,6,1,2);P(D,6,9);P(D,9,8);P(D,8,10);P(L,5,8,6,1);P(L,4,13);P(L,11,13);break;
 case'wolper':P(c0,4,8,7,5);P(L,5,9,4,2);P(c0,10,5,4,4);P(c0,11,1,1,4);P(c0,13,1,1,4);P('#f0c0c0',11,2,1,2);P(D,10,0,1,3);P(D,9,1);P(D,14,0,1,3);P(D,15,1);P(E,12,6);P('#f0e8d8',2,5,4,3);P('#d8c8b0',1,6,2,2);P(D,5,13,2,2);P(D,9,13,2,2);P(W,3,9,1,2);break;
 case'yeti':P(D,4,13,3,3);P(D,9,13,3,3);P(c0,3,5,10,9);P(c0,1,6,2,8);P(c0,13,6,2,8);P(D,1,13,2,1);P(D,13,13,2,1);P(c0,4,0,8,6);P(D,5,2,6,4);P(E,6,3);P(E,9,3);P(W,7,5,2,1);P(SC.shade(c0,-25),4,8);P(SC.shade(c0,-25),10,10);P(SC.shade(c0,-25),6,12);break;
 case'lakeserp':P('#3a78b8',0,13,16,3);P('#8ac8f0',2,13,3,1);P('#8ac8f0',10,14,3,1);P(c0,1,10,3,3);P(c0,5,8,3,5);P(D,6,8);P(D,2,10);P(c0,11,5,2,8);P(c0,12,2,4,4);P(L,12,3,3,1);P(E,14,3);P(D,11,1,1,2);P(D,10,3);break;
 case'bunyip':P(c0,2,7,11,6);P(D,3,7);P(D,6,8);P(D,9,7);P(D,4,10);P(c0,11,5,5,5);P('#e05030',13,6);P(W,12,10);P(W,15,10);P(c0,3,13,2,3);P(c0,10,13,2,3);P(c0,0,9,2,2);P(L,12,5,3,1);break;
 case'mermaid':P(D,5,0,6,3);P(D,4,2,2,7);P(D,10,2,2,7);P(SK,6,1,4,4);P(E,7,2);P(E,9,2);P(SK,6,5,4,4);P(c0,6,6,1,1);P(c0,9,6,1,1);P(SK,5,5,1,4);P(SK,10,5,1,4);P(c0,6,9,4,3);P(c0,7,12,3,2);P(c0,5,14,3,2);P(c0,9,14,3,2);P(L,7,10);P(L,8,12);P(L,6,14);break;
 case'kappa':P('#e8e8d8',5,0,6,1);P(c0,4,1,8,5);P('#e8c040',7,4,3,2);P(E,6,3);P(E,10,3);P(D,4,6,8,6);P(SC.shade(D,30),5,7,6,1);P('#d8d090',6,8,4,3);P(c0,2,7,2,4);P(c0,12,7,2,4);P(c0,5,12,2,3);P(c0,9,12,2,3);break;
 default:return false}
 return true};

// ---------- high-resolution portraits (vector, any size) ----------
SC.drawPortrait=function(g,S,shape,c0,c1,glow){const k=S/100;g.save();g.scale(k,k);
 const bg=g.createRadialGradient(50,45,8,50,50,70);bg.addColorStop(0,SC.mix(c0,'#000000',.55));bg.addColorStop(1,'#0a0705');g.fillStyle=bg;g.fillRect(0,0,100,100);
 const E=(x,y,rx,ry,f,rot)=>{g.beginPath();g.ellipse(x,y,rx,ry,rot||0,0,Math.PI*2);g.fillStyle=f;g.fill()};
 const Pp=(pts,f)=>{g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath();g.fillStyle=f;g.fill()};
 const grad=(x0,y0,x1,y1,a,b)=>{const gr=g.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,a);gr.addColorStop(1,b);return gr};
 const L=SC.shade(c0,40),D=SC.shade(c0,-45),eye=(x,y,r,col)=>{E(x,y,r,r*.9,'#f4f0e0');E(x+r*.15,y,r*.55,r*.6,col||'#2a1a10');E(x-r*.2,y-r*.3,r*.22,r*.22,'#ffffff')};
 g.lineJoin='round';
 switch(shape){
 case'hum':case'kappa':case'yeti':case'mermaid':{const skin=shape==='yeti'?c1:shape==='kappa'?c0:'#f0c8a0';const hair=shape==='mermaid'?c1:shape==='yeti'?c0:shape==='kappa'?SC.shade(c0,-20):c1;
  Pp([10,100,22,74,50,66,78,74,90,100],grad(0,66,0,100,shape==='mermaid'?skin:c0,D));
  if(shape==='yeti')E(50,46,34,36,c0);if(shape==='mermaid'){Pp([24,30,50,14,76,30,82,96,70,98,64,60,36,60,30,98,18,96],hair)}
  E(50,46,22,26,grad(30,24,70,70,SC.shade(skin,20),SC.shade(skin,-25)));
  if(shape==='kappa'){E(50,22,16,5,'#e8e8d8');Pp([42,52,58,52,50,62],'#e8c040')}
  else if(shape!=='yeti'){Pp([26,40,30,18,50,12,70,18,74,40,66,28,50,24,34,28],hair)}
  eye(41,46,4.5,shape==='yeti'?'#3a6aa0':'#2a1a10');eye(59,46,4.5,shape==='yeti'?'#3a6aa0':'#2a1a10');
  if(shape==='yeti'){Pp([40,60,60,60,56,64,44,64],'#ffffff')}else{g.strokeStyle=SC.shade(skin,-50);g.lineWidth=1.6;g.beginPath();g.moveTo(44,61);g.quadraticCurveTo(50,64,56,61);g.stroke()}
  break}
 case'quad':case'bunyip':case'pangolin':case'wolper':{const body=c0;
  if(shape==='wolper'){g.strokeStyle=c1;g.lineWidth=3;[[38,26,30,6],[62,26,70,6]].forEach(a=>{g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(a[2],a[3]);g.stroke();g.beginPath();g.moveTo((a[0]+a[2])/2,(a[1]+a[3])/2);g.lineTo(a[2]+(a[2]>50?8:-8),(a[1]+a[3])/2-4);g.stroke()});E(36,22,5,18,body,-.2);E(64,22,5,18,body,.2);E(36,22,2.5,13,'#f0c0c0',-.2);E(64,22,2.5,13,'#f0c0c0',.2);
   Pp([6,60,24,44,30,70],'#f0e8d8');Pp([94,60,76,44,70,70],'#f0e8d8')}
  else{Pp([28,34,34,10,44,32],body);Pp([72,34,66,10,56,32],body)}
  E(50,60,shape==='pangolin'?30:28,shape==='pangolin'?24:28,grad(20,30,80,90,L,D));
  if(shape==='pangolin'){for(let r=0;r<4;r++)for(let i=0;i<5;i++)Pp([26+i*12,44+r*9,32+i*12,40+r*9,38+i*12,44+r*9,32+i*12,50+r*9],r%2?SC.shade(c1,15):c1)}
  if(shape==='bunyip'){for(let i=0;i<14;i++){g.strokeStyle=c1;g.lineWidth=2;g.beginPath();const a=i/14*Math.PI*2;g.moveTo(50+Math.cos(a)*24,60+Math.sin(a)*24);g.lineTo(50+Math.cos(a)*32,60+Math.sin(a)*30);g.stroke()}}
  E(50,72,13,10,shape==='pangolin'?'#d8b890':SC.shade(body,25));E(50,67,5,3.5,'#1a1210');
  eye(38,52,5.5,shape==='bunyip'?'#e05030':'#2a1a10');eye(62,52,5.5,shape==='bunyip'?'#e05030':'#2a1a10');
  if(shape==='bunyip'){Pp([42,78,44,90,47,79],'#f4f0e0');Pp([58,78,56,90,53,79],'#f4f0e0')}
  break}
 case'bird':{Pp([20,90,30,40,50,22,70,40,80,90],grad(0,20,0,90,L,D));E(50,42,20,20,c0);Pp([62,40,86,48,62,54],c1==='#f0e0c0'?'#e8b040':'#e8b040');eye(48,38,5,'#1a1210');Pp([34,58,50,52,66,58,50,70],c1);break}
 case'bat':{Pp([2,40,26,30,40,46,30,62,18,52,8,60],D);Pp([98,40,74,30,60,46,70,62,82,52,92,60],D);E(50,52,18,20,c0);Pp([36,40,32,14,46,34],c0);Pp([64,40,68,14,54,34],c0);eye(43,50,4,'#e04030');eye(57,50,4,'#e04030');Pp([46,60,48,66,50,60,52,66,54,60],'#ffffff');break}
 case'blob':{E(50,62,34,26,grad(20,36,80,90,L,D));E(38,48,8,5,'rgba(255,255,255,.5)',-.4);eye(40,60,6);eye(60,60,6);g.strokeStyle=D;g.lineWidth=2.5;g.beginPath();g.arc(50,70,8,.2,Math.PI-.2);g.stroke();break}
 case'wisp':{const gr=g.createRadialGradient(50,50,2,50,50,40);gr.addColorStop(0,'#ffffff');gr.addColorStop(.35,c0);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,100,100);
  E(42,48,3.5,4.5,'#140e0a');E(58,48,3.5,4.5,'#140e0a');for(let i=0;i<7;i++)E(50+Math.cos(i)*30,50+Math.sin(i*1.7)*30,1.6,1.6,'#ffffff');break}
 case'serpent':case'lizard':case'lakeserp':{if(shape==='lakeserp'){g.fillStyle=grad(0,70,0,100,'#3a78b8','#1a3a68');g.fillRect(0,72,100,28)}
  Pp([20,100,30,60,46,44,70,40,86,52,84,66,64,70,46,76,40,100],grad(20,40,90,90,L,D));
  if(shape==='lakeserp'){Pp([40,44,46,26,54,42],c1);Pp([54,40,62,22,68,40],c1)}
  if(shape==='lizard'){for(let i=0;i<6;i++)E(40+i*8,58+(i%2)*6,2.6,2.2,c1);if(c0==='#f0a0b8'){[[30,48],[30,58],[30,68]].forEach(p=>Pp([p[0],p[1],p[0]-16,p[1]-6,p[0]-14,p[1]+4],'#e06a90'))}}
  eye(68,50,5.5,shape==='lizard'?'#c8a020':'#c8a020');g.strokeStyle='#c82a2a';g.lineWidth=1.6;if(shape==='serpent'){g.beginPath();g.moveTo(86,60);g.lineTo(96,62);g.lineTo(99,58);g.moveTo(96,62);g.lineTo(99,66);g.stroke()}break}
 case'ape':{E(50,52,32,34,grad(20,20,80,90,L,D));E(50,58,20,22,'#e8c8a0');eye(42,52,5);eye(58,52,5);E(50,66,6,3,'#5a3a2a');g.strokeStyle='#5a3a2a';g.lineWidth=1.6;g.beginPath();g.moveTo(43,74);g.quadraticCurveTo(50,78,57,74);g.stroke();break}
 case'stone':case'shrine':case'idol':case'statue':case'door':case'well':case'tree':case'throne':case'sapling':{
  if(shape==='tree'||shape==='sapling'){E(50,30,36,26,grad(0,4,0,56,SC.shade(c1,30),SC.shade(c1,-30)));Pp([40,100,42,48,58,48,60,100],c0)}
  else Pp([28,100,28,24,40,10,60,10,72,24,72,100],grad(28,0,72,0,L,D));
  g.fillStyle='#7affd8';g.font='bold 16px serif';g.textAlign='center';if(shape!=='tree'&&shape!=='sapling')g.fillText('ᛟ ᚱ',50,46);
  E(42,shape==='tree'||shape==='sapling'?60:62,3,4,'#ffe060');E(58,shape==='tree'||shape==='sapling'?60:62,3,4,'#ffe060');break}
 default:E(50,55,26,26,c0)}
 const vg=g.createRadialGradient(50,50,40,50,50,72);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=vg;g.fillRect(0,0,100,100);
 g.restore()};
const pcache=new Map();
SC.portraitURL=function(shape,c0,c1,size){size=size||96;const k=shape+c0+c1+size;let u=pcache.get(k);if(u)return u;if(typeof document==='undefined')return'';
 const cv=document.createElement('canvas');cv.width=cv.height=size;SC.drawPortrait(cv.getContext('2d'),size,shape,c0,c1);u=cv.toDataURL();pcache.set(k,u);return u};
SC.shapeOfMon=function(def,custom){const D=custom||SC.monDef(def)||{s:'blob',c:['#888','#444']};return {s:D.s,c:D.c,n:D.n}};

// ---------- appearance: hue / saturation / brightness + painted pixels ----------
// px keys "v:x,y" (v = d front, u back, s side) → '#rrggbb' or '-' (erase)
SC.custBlank=()=>({h:0,s:1,b:1,px:{}});
SC.custPack=function(c){if(!c)return'';const pal=[],ents=[];const b36=n=>n.toString(36);
 for(const k in c.px){const v=c.px[k];let i=pal.indexOf(v);if(i<0){if(pal.length>=36)continue;pal.push(v);i=pal.length-1}const [vw,xy]=k.split(':');const [x,y]=xy.split(',').map(Number);if(x<0||y<0||x>35||y>35)continue;ents.push(vw+b36(x)+b36(y)+b36(i))}
 return [Math.round(c.h||0),Math.round((c.s??1)*100),Math.round((c.b??1)*100),pal.map(p=>p==='-'?'-':p.slice(1)).join(','),ents.join('')].join('|')};
SC.custUnpack=function(str){const c=SC.custBlank();if(typeof str!=='string'||!str)return c;try{const p=str.split('|');c.h=SC.clamp(+p[0]||0,-180,180);c.s=SC.clamp((+p[1]||100)/100,0,2);c.b=SC.clamp((+p[2]||100)/100,0,2);
 const pal=(p[3]||'').split(',').filter(Boolean).map(x=>x==='-'?'-':/^[0-9a-f]{6}$/i.test(x)?'#'+x:null);const e=p[4]||'';
 for(let i=0;i+3<e.length;i+=4){const v=e[i];if(!'dus'.includes(v))continue;const x=parseInt(e[i+1],36),y=parseInt(e[i+2],36),col=pal[parseInt(e[i+3],36)];if(col)c.px[v+':'+x+','+y]=col}}catch(err){}return c};
SC.custIsPlain=c=>!c||(!c.h&&(c.s??1)===1&&(c.b??1)===1&&!Object.keys(c.px||{}).length);
function rgb2hsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0;const l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return [h,s,l]}
function hsl2rgb(h,s,l){const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return [f(0),f(8),f(4)]}
// apply to the canvas region (size×size); region = {x0,y0,n} paint grid origin and size; view letter
SC.applyCust=function(g,size,c,view,region){if(!c)return;const img=g.getImageData(0,0,size,size),d=img.data;
 if(c.h||c.s!==1||c.b!==1)for(let i=0;i<d.length;i+=4){if(d[i+3]<128)continue;let [h,s,l]=rgb2hsl(d[i],d[i+1],d[i+2]);h=(h+(c.h||0)+360)%360;s=SC.clamp(s*(c.s??1),0,1);l=SC.clamp(l*(c.b??1),0,1);const o=hsl2rgb(h,s,l);d[i]=o[0];d[i+1]=o[1];d[i+2]=o[2]}
 for(const k in c.px){if(k[0]!==view)continue;const [x,y]=k.slice(2).split(',').map(Number);if(x<0||y<0||x>=region.n||y>=region.n)continue;const X=region.x0+x,Y=region.y0+y;if(X<0||Y<0||X>=size||Y>=size)continue;const o=(Y*size+X)*4,v=c.px[k];
  if(v==='-'){d[o+3]=0}else{const r=SC.rgb(v);d[o]=r[0];d[o+1]=r[1];d[o+2]=r[2];d[o+3]=255}}
 g.putImageData(img,0,0)};
SC.outlineSize=function(g,size){const img=g.getImageData(0,0,size,size),d=img.data,o=new Uint8ClampedArray(d);const A=(x,y)=>x>=0&&y>=0&&x<size&&y<size&&d[(y*size+x)*4+3]>128;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;if(d[i+3]>128)continue;if(A(x-1,y)||A(x+1,y)||A(x,y-1)||A(x,y+1)){o[i]=20;o[i+1]=14;o[i+2]=10;o[i+3]=255}}img.data.set(o);g.putImageData(img,0,0)};
SC.viewOf=dir=>dir===0?'d':dir===3?'u':'s';

// ---------- readable items: rich text + signing ----------
SC.TEXTMAX=20000;
const NAMED={red:'#e05040',green:'#6fdc8c',blue:'#5ab0ff',gold:'#e0a845',yellow:'#f0e060',purple:'#b880ff',grey:'#9a9488',gray:'#9a9488',white:'#ffffff',orange:'#f08a3a',cyan:'#60e0e0',pink:'#f080c0',blood:'#a01818'};
SC.richText=function(s){s=String(s||'');let h=s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let open=0;
 h=h.replace(/\[c=(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|[a-z]+)\]/g,(m,c)=>{const col=c[0]==='#'?c:NAMED[c.toLowerCase()];if(!col)return m;open++;return `<span style="color:${col}">`})
  .replace(/\[\/c\]/g,()=>{if(open<=0)return'';open--;return'</span>'})
  .replace(/\[(b|i|u)\]/g,'<$1>').replace(/\[\/(b|i|u)\]/g,'</$1>').replace(/\[h\]/g,'<span class="rh">').replace(/\[\/h\]/g,'</span>')
  .replace(/\[br\]/g,'<br>').replace(/\r?\n/g,'<br>');
 while(open-->0)h+='</span>';return h};
const b64e=s=>typeof btoa!=='undefined'?btoa(unescape(encodeURIComponent(s))):Buffer.from(s,'utf8').toString('base64');
const b64d=s=>typeof atob!=='undefined'?decodeURIComponent(escape(atob(s))):Buffer.from(s,'base64').toString('utf8');
SC.textHash=(text,by)=>(SC.hashStr('sortcraft-seal|'+by+'|'+text).toString(36)+SC.hashStr(text+'|'+by).toString(36));
SC.signText=(text,by)=>'§S1|'+b64e(String(text))+'|'+String(by).replace(/\|/g,'')+'|'+SC.textHash(String(text),String(by).replace(/\|/g,''));
SC.readText=function(t){t=String(t||'');if(!t.startsWith('§S1|'))return {text:t,signed:false};const p=t.split('|');let text='';try{text=b64d(p[1]||'')}catch(e){return {text:'[c=red](unreadable seal)[/c]',signed:true,by:p[2],valid:false}}
 return {text,signed:true,by:p[2]||'',valid:SC.textHash(text,p[2]||'')===p[3]}};
SC.hasRead=it=>!!it&&typeof it.t==='string';

// ---------- NPC writing ----------
SC.writeLore=function(R,ctx){const P=a=>SC.pick(R,a);const realm=ctx.realm||'these lands',by=ctx.by||'Someone';const kind=ctx.kind||P(['letter','map','recipe','warning','poem','bestiary']);const L=[];
 const el=()=>Math.floor(R()*9);
 switch(kind){
 case'map':L.push(`[h]A Torn Map of ${realm}[/h]`,'',`The ink is smeared with something dark and dry.`,'');
  if(ctx.dig)L.push(`Dig where the ground is soft, at [c=cyan]${ctx.dig[0]}, ${-ctx.dig[1]}[/c].`,`I buried it there before they caught up with me.`);else L.push('The X has been torn away.');
  L.push('',`[c=grey]— ${by}[/c]`);break;
 case'recipe':{const a=el(),b=el();L.push('[h]Notes on the Brewing Art[/h]','');for(let i=0;i<3;i++){const x=el(),y=el();L.push(`[c=${SC.ELCOL[x]}]${SC.ELEMENTS[x]}[/c] with [c=${SC.ELCOL[y]}]${SC.ELEMENTS[y]}[/c] gives [b]${SC.potionName([x,y])}[/b].`)}
  L.push('','Drop one ingredient onto the other and hold it until the cauldron boils over.',`Never brew [c=${SC.ELCOL[a]}]${SC.ELEMENTS[a]}[/c] near an open flame. Ask me how I know.`,'',`[c=grey]— ${by}[/c]`);break}
 case'warning':L.push(`[h][c=red]TURN BACK[/c][/h]`,'',`Whatever you have heard about ${realm}, it is worse.`,`The ${ctx.creature||'things'} out here do not sleep. They wait.`,`We were six when we set out. I am writing this alone,`,`with my own blood drying on the page.`,'',`If you find this, take the north road home and burn it.`,'',`[c=grey]— ${by}[/c]`);break;
 case'poem':{const w=[`The ${P(['mist','road','dark','tide','frost','ember'])} remembers every name,`,`and every name it keeps it keeps for good;`,`I walked out further than the others came,`,`and found the ${P(['bones','lanterns','stones','wolves','roots'])} exactly where they stood.`,'',`So sing for those who never made it back,`,`and leave a light beside the ${P(['door','shrine','well','tree'])} tonight —`,`the realms are wide, the realms are wild and black,`,`and every traveller needs a little light.`];L.push('[h][c=gold]A Wayfarer\'s Song[/c][/h]','',...w,'',`[c=grey]— ${by}[/c]`);break}
 case'bestiary':L.push(`[h]Field Notes: ${ctx.creature||'Unknown Beast'}[/h]`,'',`Seen near ${realm}. Level [c=orange]${ctx.lvl||'?'}[/c] or thereabouts.`,`It favours the ${P(['shadows','water\'s edge','high rocks','tall grass'])} and hunts at ${P(['dusk','dawn','night','any hour'])}.`,
  `[c=green]Can be tamed[/c] once it's badly wounded, if your hands are steady and your Hunter skill is high.`,`Mind the ${P(['teeth','claws','tail','breath','eyes'])}. I lost two fingers learning that.`,'',`[c=grey]— ${by}[/c]`);break;
 default:L.push(`[h]A Letter[/h]`,'',`To whoever finds this,`,'',`I was ${P(['a farmer','a soldier','a scholar','a thief','a smith'])} once. Now I am only a traveller in ${realm}.`,`There is ${P(['gold','a relic','a cure','a door'])} out past the ${P(['ridge','marsh','ruins','old road'])}, and I could not reach it.`,`Maybe you can.`,'','[i]Go carefully.[/i]','',`[c=grey]— ${by}[/c]`)}
 return L.join('\n')};
SC.writeWispper=function(R,ctx){const P=a=>SC.pick(R,a);return [`[c=cyan]~ hush, hush, little walker ~[/c]`,`I have seen the ${P(['deep','far','burning','frozen','dead'])} places.`,`${ctx.dig?`Something glitters under the earth at [c=gold]${ctx.dig[0]}, ${-ctx.dig[1]}[/c].`:'The earth keeps its secrets from me today.'}`,
 `The ${P(['moon','mist','roots','bones'])} told me your name. I forgot it at once.`,`[c=purple]Carry me further out. I want to see the edge.[/c]`].join('\n')};

// ---------- biome mist (colour, amount, scale, drift speed) ----------
const MR=[['#dfe8e0',.10,1,.02],['#fff2c0',.14,.7,.015],['#a8d8a0',.18,.8,.02],['#b8bcc8',.22,1.4,.05],['#eef6ff',.34,1.2,.03],['#7a3020',.26,.9,.06],['#4a3a6a',.30,.8,.02],['#8aa890',.32,1,.025],['#ffffff',.16,1.6,.04]];
SC.MIST=SC.BIOMES.map((b,i)=>{if(!b.hybrid)return {c:MR[i][0],a:MR[i][1],s:MR[i][2],v:MR[i][3]};const A=MR[b.a],B=MR[b.b];return {c:SC.mix(SC.mix(A[0],B[0],.5),b.rareCol,.2),a:(A[1]+B[1])/2,s:(A[2]+B[2])/2,v:(A[3]+B[3])/2}});

// ---------- biome music (Ars Sonor) ----------
const T=n=>'Ars_Sonor_-_'+n;
const REALM_T=['07_-_Awakening','03_-_Her_Presence_is_Strong_Here','01_-_Nyboda','04_-_Doomflaffsonoria_Whale_Mix_by_Eisenlager','08_-_Waitng','05_-_Milking_the_Spider_Queen','02_-_Entering_the_Hollow_Body','08_-_Haunting_Memories','02_-_Dfrmodea'];
const HY_T=['01_-_First_Encounter','01_-_Rgrdlzz','02_-_Doomflaffsonoria_Finding_My_Way_Mix','03_-_Alwfkrk','04_-_Ftrjrny','04_-_The_Unborn','05_-_Lostfrevr','06_-_Larvae','06_-_Someohn','09_-_Prcsse','03_-_The_Unborn_Dancing'];
SC.MUSIC=SC.BIOMES.map((b,i)=>T(b.hybrid?HY_T[(i-9)%HY_T.length]:REALM_T[i]));
SC.MUSIC_TITLE=T('09_-_Leaving_This_Godforsaken_Place');SC.MUSIC_TENT=T('07_-_Rlxnt');
SC.trackTitle=f=>String(f).replace(/^Ars_Sonor_-_\d+_-_/,'').replace(/_/g,' ');
if(typeof document!=='undefined'){
 const Mu=SC.Music={vol:.15,fadeT:400,muted:false,duckTo:1,cur:null,els:[],urls:{},on:false};
 Mu.unlock=function(){if(Mu.on)return;Mu.on=true;for(let i=0;i<2;i++){const a=new Audio();a.loop=true;a.preload='auto';a.volume=0;Mu.els.push({a,target:0,name:null,g:0})}Mu.iv=setInterval(Mu.tick,50);if(Mu.want)Mu.play(Mu.want)};
 Mu.url=async function(name){if(Mu.urls[name])return Mu.urls[name];const src='audio/'+name+'.ogg';try{const r=await fetch(src);if(!r.ok)throw 0;const u=URL.createObjectURL(await r.blob());Mu.urls[name]=u;return u}catch(e){Mu.urls[name]=src;return src}};
 // crossfade: about 20 s between biome tracks (400 ticks of 50 ms); a first track from silence fades in over ~4 s
 Mu.play=async function(name){Mu.want=name;if(!Mu.on||Mu.cur===name)return;Mu.cur=name;Mu.fadeT=Mu.els.some(e=>e.g>.02)?400:80;
  const same=Mu.els.find(e=>e.name===name);for(const e of Mu.els)e.target=0;
  if(same){same.target=1;if(same.a.paused){try{await same.a.play()}catch(e){}}return}
  const fresh=Mu.els.slice().sort((a,b)=>a.g-b.g)[0];fresh.target=0;
  const url=await Mu.url(name);if(Mu.cur!==name)return;fresh.name=name;fresh.g=0;fresh.a.volume=0;fresh.a.src=url;fresh.a.currentTime=0;fresh.target=1;try{await fresh.a.play()}catch(e){}};
 Mu.tick=function(){const v=Mu.muted?0:Mu.vol*Mu.duckTo;const st=1/Mu.fadeT;for(const e of Mu.els){e.g=SC.clamp(e.g+SC.clamp(e.target-e.g,-st,st),0,1);e.a.volume=SC.clamp(e.g*v,0,1);if(e.target===0&&e.g<=0.001&&!e.a.paused)e.a.pause()}};
 Mu.setVolume=v=>{Mu.vol=SC.clamp(v,0,1)};
}

// ---------- F5 console (with a secret) ----------
SC.SECRET=3009846463;
if(typeof document!=='undefined'){
 const C=SC.Console={lines:[],open:false,cmds:{}};
 C.el=function(){let e=document.getElementById('console');if(e)return e;e=document.createElement('div');e.id='console';e.className='hidden';e.innerHTML='<div class="cl"></div><form><span>&gt;</span><input autocomplete="off" spellcheck="false"></form>';document.body.appendChild(e);
  e.querySelector('form').onsubmit=ev=>{ev.preventDefault();const i=e.querySelector('input');const v=i.value;i.value='';C.run(v)};return e};
 C.print=function(s,cls){const L=C.el().querySelector('.cl');const d=document.createElement('div');if(cls)d.className=cls;d.textContent=s;L.appendChild(d);while(L.children.length>200)L.firstChild.remove();L.scrollTop=L.scrollHeight};
 C.toggle=function(){const e=C.el();C.open=!C.open;e.classList.toggle('hidden',!C.open);if(C.open){if(!C.greeted){C.greeted=1;C.print('SortCraft console. Type "help".','dim')}setTimeout(()=>e.querySelector('input').focus(),0)}else e.querySelector('input').blur()};
 C.run=function(v){v=String(v||'').trim();if(!v)return;C.print('> '+v,'dim');const [cmd,...args]=v.split(/\s+/);const f=C.cmds[cmd.toLowerCase()];
  if(f)return f(args);if(SC.hashStr(v.toLowerCase())===SC.SECRET){if(SC.UI){SC.UI.S.secretPaint=true;SC.UI.saveSettings()}C.print('✶ A hidden brush trembles awake. Creature pixel painting is unlocked.','good');return}
  C.print('Unknown command. Type "help".','bad')};
 C.cmds.help=()=>{C.print('help, clear, where, fps, zoom <0.35–2.5>, volume <0–100>, version');C.print('(Some words are not on this list.)','dim')};
 C.cmds.clear=()=>{C.el().querySelector('.cl').innerHTML=''};
 C.cmds.where=()=>{const m=SC.G&&SC.G.me;if(!m||!SC.G.world)return C.print('Not in a world.');C.print(`${m.x}, ${-m.y} · ${SC.BIOMES[SC.G.world.biome(m.x,m.y)].name} · level ${SC.levelAt(m.x,m.y)}`)};
 C.cmds.fps=()=>C.print('~'+Math.round(1000/(SC.G._dt||16))+' fps');
 C.cmds.zoom=a=>{const v=SC.clamp(+a[0]||1,.35,2.5);if(SC.G)SC.G.zoomMul=v;C.print('Zoom '+v)};
 C.cmds.volume=a=>{const v=SC.clamp((+a[0]||0)/100,0,1);if(SC.UI){SC.UI.S.vol=v;SC.UI.saveSettings()}if(SC.Music)SC.Music.setVolume(v);C.print('Music volume '+Math.round(v*100)+'%')};
 C.cmds.version=()=>C.print('SortCraft 0.4');
}
})();
