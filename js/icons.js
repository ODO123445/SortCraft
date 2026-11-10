// SortCraft — procedural item icons (vector, any size) and pixel sprites
(function(){
'use strict';
const SC=globalThis.SC;
const OUT='#140e0a';
SC.itemColors=function(it){const B=SC.ITEMS[it.b]||{};
 if(B.cat==='weapon'||B.cat==='armor'){const M=SC.METALS[it.m||1];const G=it.g?SC.ITEMS[it.g]:null;const gc=SC.gearCol(it);return [gc[0],gc[1],G?G.col[0]:null,it.h===undefined&&M.iri]}
 if(B.cat==='potion'){const e=it.e||[2,2];return [SC.mix(SC.ELCOL[e[0]],SC.ELCOL[e[1]],.5),SC.ELCOL[e[0]],SC.ELCOL[e[1]]]}
 return B.col||['#b0a080','#6a5a40']};
// draw icon centred in a 32-unit box (ctx should be scaled so 32 units = target size)
SC.drawIcon=function(g,icon,c){const a=c[0],b=c[1]||SC.shade(a,-60),acc=c[2];
 const P=(pts,fill,lw)=>{g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath();g.fillStyle=fill;g.fill();g.lineWidth=lw||1.6;g.strokeStyle=OUT;g.stroke()};
 const C=(x,y,r,fill,lw)=>{g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=fill;g.fill();if(lw!==0){g.lineWidth=lw||1.6;g.strokeStyle=OUT;g.stroke()}};
 const E=(x,y,rx,ry,fill,rot)=>{g.beginPath();g.ellipse(x,y,rx,ry,rot||0,0,Math.PI*2);g.fillStyle=fill;g.fill();g.lineWidth=1.6;g.strokeStyle=OUT;g.stroke()};
 const L=(pts,col,w)=>{g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.lineWidth=w+2.4;g.strokeStyle=OUT;g.lineCap='round';g.stroke();g.lineWidth=w;g.strokeStyle=col;g.stroke()};
 const R=(x,y,w,h,fill)=>P([x,y,x+w,y,x+w,y+h,x,y+h],fill);
 const wood='#7a4a24',gold='#e8c050';
 const gem=(x,y,r)=>{if(acc){P([x,y-r,x+r,y,x,y+r,x-r,y],acc,1.2);C(x-r/3,y-r/3,r/4,'#fff',0)}};
 switch(icon){
 case'sword':L([7,25,11,21],wood,3.4);P([9,18,14,23,12,25,7,20],b);P([12,20,25,7,27,5,25,9,14,22],a);L([14,20,24,10],SC.shade(b,40),1);gem(11.5,21.5,2.6);break;
 case'axe':L([8,27,22,7],wood,3);P([18,6,27,9,26,18,21,14,17,11],a);P([20,9,24,10,23,14],b);gem(21,12,2.4);break;
 case'spear':L([6,27,23,10],wood,2.6);P([21,8,27,4,25,11,23,13],a);gem(21,13,2.2);break;
 case'mace':L([8,26,18,14],wood,3);C(21,11,6,a);[[21,3],[29,11],[21,19],[13,11]].forEach(p=>P([p[0]-1.6,p[1],p[0],p[1]+(p[1]<11?2:-2)*0,p[0]+1.6,p[1]],b,1));C(21,11,2.8,b,1);gem(21,11,2.3);break;
 case'dagger':L([10,23,13,20],wood,3);P([11,18,16,23,14,25,9,20],b);P([14,19,24,9,25,8,24,11,15,21],a);gem(12,21,2.2);break;
 case'bow':g.beginPath();g.arc(10,16,13,-1.1,1.1);g.lineWidth=5.4;g.strokeStyle=OUT;g.stroke();g.lineWidth=3;g.strokeStyle=a;g.stroke();L([16,5,16,27],'#e8e0c8',1);gem(22,16,2.6);break;
 case'staff':L([9,28,22,8],wood,3);C(23,7,4.6,acc||a);C(21.5,5.5,1.5,'#fff',0);P([19,11,27,3,25,11],b,1);break;
 case'hammer':L([9,27,19,13],wood,3.2);P([14,6,26,14,22,20,10,12],a);P([16,9,22,13,20,16],b,1);gem(18,13,2.4);break;
 case'scythe':L([8,28,20,6],wood,2.8);g.beginPath();g.moveTo(20,6);g.quadraticCurveTo(10,2,4,10);g.quadraticCurveTo(12,7,19,10);g.closePath();g.fillStyle=a;g.fill();g.lineWidth=1.6;g.strokeStyle=OUT;g.stroke();gem(18,8,2.2);break;
 case'atgeir':L([5,28,21,10],wood,2.6);P([19,10,28,3,26,8,29,9,24,15],a);gem(21,12,2.2);break;
 case'helm':P([6,20,6,13,10,7,16,5,22,7,26,13,26,20,22,20,22,15,10,15,10,20],a);R(14,15,4,8,b);gem(16,9,2.4);break;
 case'body':P([8,6,13,4,16,7,19,4,24,6,27,13,23,14,23,27,9,27,9,14,5,13],a);L([16,9,16,25],b,1.2);gem(16,12,2.6);break;
 case'legs':P([9,5,23,5,24,27,18,27,16,13,14,27,8,27],a);R(9,5,14,4,b);gem(16,7,2);break;
 case'shield':P([6,6,26,6,26,15,16,28,6,15],a);P([16,6,26,6,26,15,16,28],b);C(16,14,4,SC.shade(a,30));gem(16,14,2.6);break;
 case'cloak':P([10,5,22,5,27,27,20,25,16,28,12,25,5,27],a);P([10,5,22,5,20,9,12,9],b);C(16,7,2,gold);gem(16,7,1.8);break;
 case'amulet':g.beginPath();g.arc(16,9,8,0.2,Math.PI-0.2,true);g.lineWidth=2;g.strokeStyle=b;g.stroke();P([16,15,22,21,16,28,10,21],a);gem(16,21,3.6);break;
 case'ore':P([5,22,9,11,17,7,25,11,28,21,20,27,10,27],b);[[11,15],[19,13],[16,21],[23,19]].forEach(p=>C(p[0],p[1],2.4,a,1));break;
 case'ingot':P([4,21,9,13,27,13,28,21],a);P([4,21,28,21,26,25,6,25],b);P([9,13,27,13,24,16,11,16],SC.shade(a,40),1);break;
 case'gem':P([9,8,23,8,28,14,16,28,4,14],a);P([9,8,23,8,20,14,12,14],SC.shade(a,60),1);P([4,14,12,14,16,28],SC.shade(a,-40),1);C(13,11,1.6,'#fff',0);break;
 case'potion':P([13,4,19,4,19,10,25,17,25,25,21,28,11,28,7,25,7,17,13,10],'rgba(220,235,255,.35)');P([8,18,24,18,24,25,21,27,11,27,8,25],a,1);C(13,21,1.8,c[1]||'#fff',0);C(19,23,1.4,c[2]||'#fff',0);R(12,2,8,4,wood);break;
 case'pattern':P([6,5,24,5,26,27,8,27],'#e8dcc0');L([10,10,22,10],b,1);L([10,14,20,14],b,1);L([10,18,22,18],b,1);P([16,20,24,13,25,14,17,22],'#8a8a92',1);break;
 case'flower':L([16,28,16,15],'#3f8a2c',2);P([16,14,10,20,13,24,16,21],'#4f9a35',1);for(let i=0;i<5;i++){const t=i/5*Math.PI*2;E(16+Math.cos(t)*5,11+Math.sin(t)*5,3.6,2.4,a,t)}C(16,11,2.6,b);break;
 case'mushroom':R(13,16,6,11,'#e8dcc0');P([4,17,8,8,16,5,24,8,28,17],a);[[10,11],[17,9],[22,13]].forEach(p=>C(p[0],p[1],1.6,'#fff',0));break;
 case'fern':L([16,28,16,6],'#2f6a24',2);for(let i=0;i<5;i++){const y=8+i*4;P([16,y,7+i,y+3,16,y+2],a,1);P([16,y,25-i,y+3,16,y+2],a,1)}break;
 case'moss':E(16,22,12,6,a);C(10,18,4,SC.shade(a,20));C(18,16,5,SC.shade(a,10));C(23,20,3.5,SC.shade(a,30));break;
 case'root':L([16,6,16,16],'#4f9a35',2);E(16,20,6,7,a);L([14,26,10,30],b,1);L([18,26,22,30],b,1);P([12,6,16,2,20,6,16,10],'#5aa83e',1);break;
 case'berry':L([16,4,16,12],'#3f8a2c',1.6);P([16,8,24,5,20,10],'#4f9a35',1);C(12,18,5,a);C(20,17,5,a);C(16,24,5,a);C(11,16,1.4,'#fff',0);break;
 case'herb':for(let i=0;i<5;i++){const x=8+i*4;L([16,28,x,8+(i%2)*4],i%2?a:SC.shade(a,-30),1.8)}break;
 case'vine':g.beginPath();g.moveTo(6,28);g.bezierCurveTo(26,22,4,12,24,4);g.lineWidth=4;g.strokeStyle=OUT;g.stroke();g.lineWidth=2;g.strokeStyle='#3f8a2c';g.stroke();[[10,23],[18,17],[12,12],[21,7]].forEach(p=>E(p[0],p[1],3.6,2,a,.6));break;
 case'beetle':E(16,18,8,10,a);L([16,9,16,27],OUT,.6);C(16,8,3.6,b);[[8,14,3,10],[8,19,2,20],[8,24,4,28],[24,14,29,10],[24,19,30,20],[24,24,28,28]].forEach(l=>L(l,OUT,.6));C(13,14,1.4,'#fff',0);break;
 case'wing':E(10,12,7,9,a,-.5);E(22,12,7,9,a,.5);E(11,22,5,6,b,.4);E(21,22,5,6,b,-.4);L([16,6,16,26],OUT,1.4);break;
 case'feather':g.beginPath();g.moveTo(8,28);g.quadraticCurveTo(10,8,26,4);g.quadraticCurveTo(22,20,8,28);g.fillStyle=a;g.fill();g.lineWidth=1.6;g.strokeStyle=OUT;g.stroke();L([8,28,24,6],b,1);break;
 case'scale':P([16,4,27,12,24,24,16,28,8,24,5,12],a);P([16,8,23,13,21,21,16,24,11,21,9,13],SC.shade(a,30),1);break;
 case'shell':g.beginPath();g.moveTo(4,24);g.quadraticCurveTo(16,-2,28,24);g.closePath();g.fillStyle=a;g.fill();g.lineWidth=1.6;g.strokeStyle=OUT;g.stroke();for(let i=0;i<5;i++)L([16,24,6+i*5,10+Math.abs(2-i)*2],b,.8);R(13,24,6,3,b);break;
 case'fang':g.beginPath();g.moveTo(10,4);g.quadraticCurveTo(26,10,14,28);g.quadraticCurveTo(16,14,8,8);g.closePath();g.fillStyle=a;g.fill();g.lineWidth=1.6;g.strokeStyle=OUT;g.stroke();break;
 case'egg':E(16,17,9,12,a);C(12,13,1.6,b,0);C(19,18,2,b,0);C(14,23,1.4,b,0);break;
 case'crystal':P([16,3,22,12,20,28,12,28,10,12],a);P([16,3,22,12,16,14],SC.shade(a,50),1);P([6,18,10,14,12,28,7,28],SC.shade(a,-20),1);P([24,16,27,20,25,28,21,28],SC.shade(a,-10),1);break;
 case'geode':C(16,17,11,b);C(16,17,7,a);for(let i=0;i<6;i++){const t=i/6*Math.PI*2;P([16+Math.cos(t)*3,17+Math.sin(t)*3,16+Math.cos(t+.3)*7,17+Math.sin(t+.3)*7,16+Math.cos(t-.3)*7,17+Math.sin(t-.3)*7],SC.shade(a,40),.6)}break;
 case'fossil':C(16,16,12,'#c8b898');g.beginPath();for(let t=0;t<12;t+=.2){const r=1+t*0.85;g.lineTo(16+Math.cos(t)*r,16+Math.sin(t)*r)}g.lineWidth=2.2;g.strokeStyle=b;g.stroke();break;
 case'stone':P([5,20,9,10,20,7,27,13,27,22,18,27,9,26],a);P([9,10,20,7,18,12,11,14],SC.shade(a,30),1);break;
 case'amber':P([8,8,24,6,27,20,16,28,6,22],a);E(16,16,3,2,b,.4);C(12,11,1.6,'#fff',0);break;
 case'coin':C(16,16,11,gold);C(16,16,7.5,SC.shade(gold,-30),1);L([13,12,16,20,19,12],'#7a5a10',1.2);break;
 case'idol':P([11,28,11,10,13,4,19,4,21,10,21,28],a);C(14,11,1.8,'#fff',0);C(18,11,1.8,'#fff',0);R(13,16,6,2,b);R(11,22,10,2,b);break;
 case'ring':g.beginPath();g.arc(16,18,9,0,Math.PI*2);g.lineWidth=5.6;g.strokeStyle=OUT;g.stroke();g.lineWidth=3.4;g.strokeStyle=gold;g.stroke();P([16,4,21,9,16,13,11,9],a);break;
 case'mask':P([6,8,26,8,26,18,16,28,6,18],a);E(11,14,3,2,OUT);E(21,14,3,2,OUT);L([16,18,16,23],b,1.4);break;
 case'horn':g.beginPath();g.moveTo(4,24);g.quadraticCurveTo(14,4,28,6);g.lineTo(28,12);g.quadraticCurveTo(16,12,10,27);g.closePath();g.fillStyle=a;g.fill();g.lineWidth=1.6;g.strokeStyle=OUT;g.stroke();L([22,7,22,11],b,1);L([16,9,15,14],b,1);break;
 case'chalice':P([7,5,25,5,22,15,16,18,10,15],gold);L([16,18,16,24],gold,2.4);P([10,27,22,27,20,24,12,24],gold);C(16,10,2.6,a);break;
 case'torc':g.beginPath();g.arc(16,16,10,.7,Math.PI*2-.7+Math.PI*0);g.lineWidth=6;g.strokeStyle=OUT;g.stroke();g.lineWidth=4;g.strokeStyle=gold;g.stroke();C(24,10,3,a);C(24,22,3,a);break;
 case'lantern':R(10,9,12,17,'rgba(255,220,140,.7)');R(10,6,12,3,b);R(10,26,12,2,b);C(16,17,4,a,0);L([16,3,16,6],b,1.4);break;
 case'chest':P([4,13,28,13,28,27,4,27],'#8a5228');P([4,13,6,7,26,7,28,13],'#a86e34');R(4,13,24,2,gold);R(14,13,4,8,gold);break;
 case'torch':L([12,28,18,12],wood,3.4);E(19,9,5,7,'#ff9a30');E(19,10,2.6,4,'#fff0a0');break;
 case'bread':E(16,18,12,8,'#c88a40');L([9,15,12,19],'#8a5a20',1);L([15,13,18,18],'#8a5a20',1);L([21,14,24,18],'#8a5a20',1);break;
 case'mead':P([9,8,23,8,22,27,10,27],'#e0a030');R(9,6,14,4,'#f8f0d0');g.beginPath();g.arc(24,17,4,-1.4,1.4);g.lineWidth=2.6;g.strokeStyle=OUT;g.stroke();break;
 case'rune':P([7,4,25,4,27,28,5,28],a);L([12,10,12,22],b,1.6);L([12,12,20,16,12,20],b,1.6);L([20,9,20,24],b,1.6);break;
 default:C(16,16,8,a)}
};
const urlCache=new Map();
SC.iconURL=function(it,size){size=size||48;const c=SC.itemColors(it);const icon=(SC.ITEMS[it.b]||{}).icon||'stone';const key=icon+c.join()+size;let u=urlCache.get(key);if(u)return u;
 if(typeof document==='undefined')return'';const cv=document.createElement('canvas');cv.width=cv.height=size;const g=cv.getContext('2d');g.scale(size/32,size/32);g.lineJoin='round';
 if(c[3]){const gr=g.createLinearGradient(0,0,32,32);gr.addColorStop(0,'#ff80ff');gr.addColorStop(.5,'#58e0d0');gr.addColorStop(1,'#80a0ff');SC.drawIcon(g,icon,[c[0],c[1],c[2]]);g.globalCompositeOperation='overlay';g.fillStyle=gr;g.fillRect(0,0,32,32);g.globalCompositeOperation='source-over'}
 else SC.drawIcon(g,icon,c);
 u=cv.toDataURL();urlCache.set(key,u);return u};

// ---------- pixel sprites (16×16 maps) ----------
SC.PX={
 hum:{down:["......kkkk......","....kkhhhhkk....","...khhhhhhhhk...","...khhhhhhhhk...","...khsssssshk...","...ksessssesk...","...kssssssssk...","....kssssssk....","...kcccccccck...","..ksccccccccsk..","..ksccddddccsk..","...kcccccccck..."],
  up:["......kkkk......","....kkhhhhkk....","...khhhhhhhhk...","...khhhhhhhhk...","...khhhhhhhhk...","...khhhhhhhhk...","...kshhhhhhsk...","....kssssssk....","...kcccccccck...","..ksccccccccsk..","..ksccddddccsk..","...kcccccccck..."],
  side:["......kkkk......","....kkhhhhkk....","...khhhhhhhhk...","...khhhhhhhhk...","...khhhhsssk....","...khhhssesk....","...khhsssssk....","....kssssk......","....kccccck.....","....kcscccck....","....kcddddck....","....kcccccck...."]},
 legs:{stand:["...kddk..kddk...","...kbbk..kbbk...","....kk....kk....","................"],a:["...kddk..kddk...","...kbbk..kddk...","....kk...kbbk...","..........kk...."],
  b:["...kddk..kddk...","...kddk..kbbk...","...kbbk...kk....","....kk.........."],side:["....kdk.kddk....","....kbk.kbbk....",".....k...kk.....","................"],side2:["....kddddk......","....kbbbbk......",".....kkkk.......","................"]},
 quad:["................","................","................","................","...........kk...","..........kcck..","...kkkkkkkkccek.","..kccccccccccck.",".kcccccccccccck.",".kcddcccccccdk..",".kccccccccccck..","..kcck...kcck...","..kcck...kcck...","..kddk...kddk...","...kk.....kk....","................"],
 serpent:["................","................","................","................","................","................","......kkkk......",".....kccccek....","....kcckkkk.....","....kck.........","....kcckkkkkk...",".....kccccccck..","..kcccccccccck..","...kkkkkkkkkk...","................","................"],
 bird:["................","................","................","................","......kkk.......",".....kccek......",".....kccckt.....","....kccccck.....",".kddcccccccdk...","kdd.kcccccck.ddk",".....kcccck.....","......kttk......","......t..t......","................","................","................"],
 blob:["................","................","................","................","................","......kkkk......","....kkcccckk....","...kcclcccck....","..kccllccccck...","..kcccccccccck..","..kcckcckccck...","..kcccccccccck..","..kdcccccccdk...","...kddddddddk...","....kkkkkkkk....","................"],
 bat:["................","................","................","................","kk....kkkk....kk","kck..kcccck..kck","kcckkcwccwckkcck","kccccccccccccccc",".kccckcccckccck.","..kk..kcck..kk..","......kkkk......","................","................","................","................","................"]};
// fix bat row widths (pad/trim to 16)
for(const k of ['quad','serpent','bird','blob','bat'])SC.PX[k]=SC.PX[k].map(r=>(r+'................').slice(0,16));
SC.paintPx=function(g,rows,pal,flip,ox,oy){ox=ox||0;oy=oy||0;rows.forEach((r,y)=>{for(let x=0;x<16;x++){const ch=r[x];const col=pal[ch];if(ch==='.'||!col)continue;g.fillStyle=col;g.fillRect(ox+(flip?15-x:x),oy+y,1,1)}})};
SC.humRows=function(dir,frame){const view=dir===0?'down':dir===3?'up':'side';let legs;
 if(view==='side')legs=frame===1?SC.PX.legs.side2:SC.PX.legs.side;else legs=frame===0?SC.PX.legs.stand:frame===1?SC.PX.legs.a:SC.PX.legs.b;return SC.PX.hum[view].concat(legs)};
})();
