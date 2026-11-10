// SortCraft — WebGL2 renderer: atlas, scene pass, light pass, composite (ambient, emissive, fog of war)
(function(){
'use strict';
const SC=globalThis.SC,TK=SC.TK;
const VS_SCENE=`#version 300 es
layout(location=0) in vec2 aP;layout(location=1) in vec2 aT;layout(location=2) in vec4 aC;layout(location=3) in float aF;
uniform vec2 uS;uniform vec2 uCam;out vec2 vT;out vec4 vC;out float vF;out vec2 vW;
void main(){vT=aT;vC=aC;vF=aF;vW=(aP+uCam)/16.0;gl_Position=vec4(aP.x*uS.x,-aP.y*uS.y,0.,1.);}`;
const FS_SCENE=`#version 300 es
precision mediump float;in vec2 vT;in vec4 vC;in float vF;in vec2 vW;uniform sampler2D uTex;uniform float uTime;out vec4 o;
void main(){vec4 c=texture(uTex,vT);if(c.a<0.5)discard;c.rgb*=vC.rgb;float em=0.;
 if(vF>2.5){float w=sin(vW.x*1.7+uTime*1.3)+sin(vW.y*2.1-uTime*1.1);c.rgb*=0.9+0.12*w;em=1.;}
 else if(vF>1.5){float w=sin(vW.x*1.9+vW.y*.7+uTime*1.6)+sin(vW.y*2.3-uTime*1.2);c.rgb*=0.93+0.06*w;c.rgb+=vec3(.06)*smoothstep(1.6,2.,w);}
 else if(vF>.5)em=1.;
 o=vec4(min(c.rgb,vec3(1.)),1.-em*.5);}`;
const VS_LIGHT=`#version 300 es
layout(location=0) in vec2 aP;layout(location=1) in vec2 aT;layout(location=2) in vec4 aC;uniform vec2 uS;out vec2 vL;out vec4 vC;
void main(){vL=aT;vC=aC;gl_Position=vec4(aP.x*uS.x,-aP.y*uS.y,0.,1.);}`;
const FS_LIGHT=`#version 300 es
precision mediump float;in vec2 vL;in vec4 vC;out vec4 o;void main(){float d=dot(vL,vL);float a=max(0.,1.-d);a*=a;o=vec4(vC.rgb*a*vC.a,1.);}`;
const VS_FULL=`#version 300 es
const vec2 P[3]=vec2[3](vec2(-1,-1),vec2(3,-1),vec2(-1,3));out vec2 vUv;void main(){vec2 p=P[gl_VertexID];vUv=p*.5+.5;gl_Position=vec4(p,0,1);}`;
const FS_COMP=`#version 300 es
precision highp float;in vec2 vUv;uniform sampler2D uScene,uLight,uFog;uniform vec3 uAmb;uniform vec2 uCam,uView,uFogO,uFogS;uniform float uFogOn,uLightOn,uTime;out vec4 o;
void main(){vec4 s=texture(uScene,vUv);vec3 L=texture(uLight,vUv).rgb*1.8*uLightOn;float em=s.a<.75?1.:0.;
 vec3 amb=mix(vec3(1.),uAmb,uLightOn);float al=dot(amb,vec3(.333));vec3 Ld=L*max(.1,1.15-al);vec3 lit=s.rgb*(amb+Ld);lit=mix(lit,s.rgb*max(vec3(1.05),amb+Ld*.6),em);
 vec2 wp=uCam+vec2(vUv.x-.5,.5-vUv.y)*uView;vec2 ft=(wp/16.-uFogO)/uFogS;float f=texture(uFog,ft).r;
 if(uFogOn<.5)f=1.;
 float vis=smoothstep(.56,.96,f),ex=smoothstep(.05,.42,f);
 float lum=dot(lit,vec3(.3,.59,.11));vec3 mem=vec3(lum)*vec3(.62,.58,.52)*.62;
 vec3 col=mix(mem,lit,vis)*ex;
 float n=fract(sin(dot(floor(wp/2.),vec2(12.9898,78.233)))*43758.5453);col*=1.-(1.-ex)*0.;col+= (1.-ex)*vec3(.03,.025,.02)*n;
 vec2 q=vUv-.5;col*=1.-dot(q,q)*.55;o=vec4(col,1.);}`;

function sh(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
function prog(gl,vs,fs){const p=gl.createProgram();gl.attachShader(p,sh(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
 const u={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const a=gl.getActiveUniform(p,i);u[a.name]=gl.getUniformLocation(p,a.name)}return {p,u}}

// ---------- atlas (20px cells: 25% more detail than 16px) ----------
const CELL=20,K=CELL/16;SC.CELL=CELL;
class Atlas{constructor(gl){this.gl=gl;this.size=2048;this.cell=CELL;this.per=Math.floor(this.size/CELL);this.map=new Map();this.next=0;
  this.tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,this.size,this.size);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  this.cv=document.createElement('canvas');this.cv.width=this.cv.height=CELL;this.g=this.cv.getContext('2d',{willReadFrequently:true});}
 get(key,paint){let i=this.map.get(key);if(i!==undefined)return i;if(this.next>=this.per*this.per){this.map.clear();this.next=0}
  i=this.next++;const g=this.g;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,CELL,CELL);g.imageSmoothingEnabled=false;g.globalAlpha=1;paint(g);g.setTransform(1,0,0,1,0,0);
  const gl=this.gl;gl.bindTexture(gl.TEXTURE_2D,this.tex);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  gl.texSubImage2D(gl.TEXTURE_2D,0,(i%this.per)*CELL,Math.floor(i/this.per)*CELL,gl.RGBA,gl.UNSIGNED_BYTE,this.cv);this.map.set(key,i);return i}
 uv(i){const s=this.size,x=(i%this.per)*CELL,y=Math.floor(i/this.per)*CELL,e=.02;return [(x+e)/s,(y+e)/s,(x+CELL-e)/s,(y+CELL-e)/s]}}
// pixel helper in 16-unit design space, snapped to the 20px grid
function mkpx(g){return (c,a,b,w,h)=>{g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle=c;const x0=Math.round(a*K),y0=Math.round(b*K);g.fillRect(x0,y0,Math.max(1,Math.round((a+(w||1))*K)-x0),Math.max(1,Math.round((b+(h||1))*K)-y0));g.restore()}}
const nat=(g,c,x,y,w,h)=>{g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle=c;g.fillRect(x,y,w||1,h||1);g.restore()};

// ---------- tile painting ----------
function paintTile(g,bi,kind,v){const B=SC.BIOMES[bi],P=B.pal;const r=i=>SC.h3(bi*13+kind,v,i,991);g.scale(K,K);
 const px=mkpx(g);
 const speck=(base,cols,n)=>{nat(g,base,0,0,CELL,CELL);for(let i=0;i<Math.round(n*1.6);i++)nat(g,cols[(r(i)*cols.length)|0],(r(i+40)*CELL)|0,(r(i+80)*CELL)|0)};
 const ground=(alt)=>{const g0=P.g[alt?1:0];speck(g0,[P.g[1],P.g[2],SC.shade(g0,-14),SC.shade(g0,12)],18);
  for(let i=0;i<3;i++)if(r(3+i)<.35){const a=2+((r(4+i)*15)|0),b=3+((r(5+i)*14)|0),c=SC.shade(g0,-26-i*4);nat(g,c,a,b+1,1,2);nat(g,c,a+1,b,1,3);nat(g,SC.shade(g0,20),a+2,b+1,1,2)}};
 const water=(base,hi)=>{nat(g,base,0,0,CELL,CELL);for(let i=0;i<6;i++)nat(g,hi,(r(i+5)*15)|0,(r(i+9)*19)|0,2+((r(i+20)*3)|0),1);for(let i=0;i<3;i++)nat(g,SC.shade(base,-14),(r(i+30)*16)|0,(r(i+33)*19)|0,3,1)};
 switch(kind){
 case TK.G:ground(0);break;case TK.G2:ground(1);break;
 case TK.DET:ground(0);for(let i=0;i<3;i++){const a=2+((r(i+20)*14)|0),b=2+((r(i+30)*14)|0),c=P.det[(r(i+60)*3)|0];nat(g,c,a,b+1,3,1);nat(g,c,a+1,b,1,3);nat(g,SC.shade(c,-50),a+1,b+1);nat(g,'#3f7a2c',a+1,b+3,1,2)}break;
 case TK.PATH:speck(P.path,[SC.shade(P.path,-16),SC.shade(P.path,12),SC.shade(P.path,-26)],22);for(let i=0;i<3;i++)nat(g,SC.shade(P.path,-38),(r(i+70)*18)|0,(r(i+73)*18)|0,2,1);break;
 case TK.FLOOR:speck('#9a8e7a',['#8a7e6a','#aa9e8a','#928672'],12);px('#6e6454',0,15,16,1);px('#6e6454',15,0,1,16);px('#6e6454',0,7,16,1);px('#6e6454',7,0,1,7);break;
 case TK.SHORE:speck(P.shore,[SC.shade(P.shore,-12),SC.shade(P.shore,14)],20);break;
 case TK.WATER:water(P.water,SC.shade(P.water,45));break;
 case TK.DEEP:water(P.deep,SC.shade(P.deep,30));break;
 case TK.HOLE:ground(0);px('#2a1e14',3,4,10,9);px('#140e0a',4,5,8,7);px(SC.shade(P.g[0],-40),3,12,10,2);nat(g,'#3a2a1c',7,8,2,1);break;
 case TK.ROCK:ground(0);g.fillStyle=P.rock;g.beginPath();g.moveTo(1,15);g.lineTo(3,6);g.lineTo(8,2);g.lineTo(13,5);g.lineTo(15,15);g.fill();
  g.fillStyle=SC.shade(P.rock,-30);g.beginPath();g.moveTo(8,2);g.lineTo(13,5);g.lineTo(15,15);g.lineTo(9,15);g.fill();px(SC.shade(P.rock,35),5,5,3,2);nat(g,SC.shade(P.rock,-50),8,12,3,1);nat(g,SC.shade(P.rock,-50),6,9,1,2);px('rgba(0,0,0,.25)',1,14,14,2);break;
 case TK.TREE:{ground(0);px('rgba(0,0,0,.22)',3,12,10,3);const L=P.leaf,D=SC.shade(L,-40),H=SC.shade(L,40),T=P.trunk;
  switch(B.tree){
  case'pine':case'icepine':px(T,7,11,2,4);for(let i=0;i<3;i++){const y=1+i*3.5,w=4+i*2.5;g.fillStyle=i%2?L:D;g.beginPath();g.moveTo(8,y);g.lineTo(8-w,y+5);g.lineTo(8+w,y+5);g.fill()}if(B.tree==='icepine'){px('#ffffff',7,1,2,2);px('#ffffff',4,6,2,1);px('#ffffff',10,9,2,1)}break;
  case'dead':case'charred':px(T,7,5,2,10);px(T,4,4,1,4);px(T,5,7,2,1);px(T,11,3,1,5);px(T,9,6,2,1);px(T,3,3,1,1);px(T,12,2,1,1);if(B.tree==='charred'){px('#ff8030',8,8,1,1);px('#ff8030',11,5,1,1);px('#ffb050',4,6,1,1)}break;
  case'mushroom':px('#d8d0e0',7,8,3,7);g.fillStyle=L;g.beginPath();g.ellipse(8.5,7,7,4.5,0,Math.PI,0);g.fill();px(D,2,7,13,2);px(H,5,4,2,1);px(H,10,3,2,1);break;
  case'glow':px(T,7,9,2,6);px(SC.shade(T,-30),8,9,1,6);px(D,3,2,10,8);px(D,2,4,12,5);px(L,4,2,8,7);px(L,3,4,10,4);px('#ffffff',5,3,3,2);px('#ffffff',10,6,1,1);break;
  case'jungle':px(T,7,10,2,5);px(D,1,1,14,10);px(L,2,1,12,8);px(H,4,2,3,2);px(H,10,4,2,2);px('#2a5a1a',2,9,1,4);px('#2a5a1a',13,8,1,5);break;
  default:px(T,7,10,2,5);px(D,3,1,10,10);px(D,2,3,12,6);px(L,4,2,8,8);px(L,3,4,10,4);px(H,5,3,4,2);px(H,4,5,2,2)}
  for(let i=0;i<5;i++)nat(g,i%2?H:D,4+((r(i+90)*12)|0),3+((r(i+95)*8)|0));
  break}
 case TK.SP:{ground(0);const S=P.sp;
  switch(B.special){
  case'hay':for(let i=0;i<6;i++){const a=1+((r(i+3)*13)|0),b=4+((r(i+7)*8)|0);px(S,a,b,1,4);px(SC.shade(S,30),a+1,b-1,1,3)}break;
  case'lumflower':for(let i=0;i<4;i++){const a=2+((r(i+3)*11)|0),b=3+((r(i+7)*10)|0);px('#4f9a35',a+1,b+2,1,3);px(S,a,b,3,3);px('#ffffff',a+1,b+1)}break;
  case'bigfern':for(let i=0;i<5;i++){g.strokeStyle=i%2?'#2a8a3a':'#1f6a2a';g.lineWidth=2;g.beginPath();g.moveTo(8,15);g.quadraticCurveTo(2+i*3,6,1+i*3.5,1+(i%2)*2);g.stroke()}break;
  case'boulder':g.fillStyle=S;g.beginPath();g.ellipse(8,9,7,6,0,0,Math.PI*2);g.fill();g.fillStyle=SC.shade(S,-30);g.beginPath();g.ellipse(10,11,5,4,0,0,Math.PI*2);g.fill();px(SC.shade(S,40),4,5,3,2);break;
  case'ice':speck('#c8e8f8',['#e8f8ff','#a8d0e8','#ffffff'],14);px('#ffffff',3,4,5,1);px('#ffffff',9,10,4,1);break;
  case'lava':speck('#ff6020',['#ffb040','#ff8030','#d03010'],22);px('#3a1a10',2,3,4,2);px('#3a1a10',10,9,4,3);break;
  case'bones':px('#e8e4d8',3,8,10,2);for(let i=0;i<4;i++)px('#d8d4c8',4+i*2.5,5,1,6);px('#e8e4d8',12,6,3,3);px('#1a1a1a',13,7,1,1);nat(g,'#6a1a14',5,14,3,1);break;
  case'pillar':px('#c8c8c0',4,1,8,2);px(S,5,3,6,11);px('#d8d8d0',5,3,1,11);px('#a8a8a0',10,3,1,11);px('#c8c8c0',4,13,8,2);break;
  default:{const cc=S;g.fillStyle=SC.shade(cc,-50);g.beginPath();g.moveTo(3,15);g.lineTo(5,7);g.lineTo(8,15);g.fill();g.fillStyle=cc;g.beginPath();g.moveTo(6,15);g.lineTo(9,1);g.lineTo(12,15);g.fill();
   g.fillStyle=SC.shade(cc,40);g.beginPath();g.moveTo(9,1);g.lineTo(12,15);g.lineTo(10,15);g.fill();g.fillStyle=SC.shade(cc,-20);g.beginPath();g.moveTo(11,15);g.lineTo(13,9);g.lineTo(15,15);g.fill()}}
  break}
 }}
SC.paintTile=paintTile;
SC.tileFlag=function(bi,kind){const B=SC.BIOMES[bi];if(kind===TK.WATER||kind===TK.DEEP)return B.key==='emberwaste'?3:2;if(kind===TK.SP&&B.spGlow)return 1;return 0};
SC.tileLight=function(bi,kind){const B=SC.BIOMES[bi];if((kind===TK.WATER||kind===TK.DEEP)&&B.key==='emberwaste')return B.pal.water;if(kind===TK.SP&&B.spGlow)return B.pal.sp;return null};

// ---------- layered characters: worn gear is visible ----------
// look: {skin,hair,tunic,tunic2,trousers,wt,wc,wc2,head,body,legs,shield,cloak,trinket}
function outline(g){const img=g.getImageData(0,0,CELL,CELL),d=img.data,o=new Uint8ClampedArray(d);const A=(x,y)=>x>=0&&y>=0&&x<CELL&&y<CELL&&d[(y*CELL+x)*4+3]>128;
 for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++){const i=(y*CELL+x)*4;if(d[i+3]>128)continue;if(A(x-1,y)||A(x+1,y)||A(x,y-1)||A(x,y+1)){o[i]=20;o[i+1]=14;o[i+2]=10;o[i+3]=255}}
 img.data.set(o);g.putImageData(img,0,0)}
function weapon(P,wt,c,c2,hx,hy){const W='#6b4423';switch(wt){
 case'sword':P(W,hx,hy,1,2);P(c2,hx-1,hy-1,3,1);P(c,hx,hy-9,1,8);P(c2,hx+1,hy-8,1,6);P('#ffffff',hx,hy-9);break;
 case'axe':P(W,hx,hy-8,1,10);P(c,hx+1,hy-9,3,4);P(c2,hx+3,hy-9,1,4);break;
 case'spear':P(W,hx,hy-12,1,14);P(c,hx-1,hy-14,3,2);P(c2,hx,hy-15);break;
 case'mace':P(W,hx,hy-6,1,8);P(c,hx-1,hy-9,3,3);P(c2,hx,hy-10);break;
 case'dagger':P(W,hx,hy,1,1);P(c,hx,hy-4,1,4);P(c2,hx,hy-5);break;
 case'bow':P(W,hx+1,hy-10,1,2);P(W,hx+2,hy-8,1,8);P(W,hx+1,hy,1,2);P('#e8e0c8',hx,hy-9,1,11);break;
 case'staff':P(W,hx,hy-10,1,13);P(c,hx-1,hy-13,3,3);P('#ffffff',hx-1,hy-13);break;
 case'hammer':P(W,hx,hy-7,1,9);P(c,hx-2,hy-10,5,3);P(c2,hx-2,hy-10,5,1);break;
 case'scythe':P(W,hx,hy-11,1,13);P(c,hx-5,hy-11,5,1);P(c,hx-6,hy-10,2,1);P(c2,hx-4,hy-11,3,1);break;
 case'atgeir':P(W,hx,hy-12,1,14);P(c,hx-1,hy-15,2,4);P(c2,hx+1,hy-13);break}}
function paintChar(g,L,dir,fr){const P=(c,x,y,w,h)=>{if(!c)return;g.fillStyle=c;g.fillRect(x,y,w||1,h||1)};
 const up=dir===3,side=dir===1||dir===2;const torso=L.body||L.tunic,tD=L.body?SC.shade(L.body,-45):L.tunic2,legC=L.legs||L.trousers,boot='#3a2618',sk=L.skin,hair=L.hair;
 g.fillStyle='rgba(0,0,0,0)';
 if(!side){let a=0,b=0;if(fr===1)a=-1;else if(fr===2)b=-1;
  if(up){if(L.wt)weapon(P,L.wt,L.wc,L.wc2,4,13);}
  if(L.cloak&&!up)P(SC.shade(L.cloak,-30),5,9,10,8);
  P(legC,7,14+a,2,4);P(legC,11,14+b,2,4);P(boot,7,17+a,2,2);P(boot,11,17+b,2,2);if(L.legs){P(SC.shade(L.legs,35),7,14+a,1,2);P(SC.shade(L.legs,35),11,14+b,1,2)}
  P(torso,6,8,8,7);P(tD,6,13,8,1);if(L.body){P(SC.shade(L.body,40),7,9,2,1);P(SC.shade(L.body,-25),12,9,1,4);P(SC.shade(L.body,20),9,10,2,2)}else P(tD,9,9,2,4);
  P(torso,4,9,2,4);P(torso,14,9,2,4);P(sk,4,13,2,1);P(sk,14,13,2,1);
  P(sk,7,2,6,6);
  if(up)P(hair,6,1,8,7);else{P(hair,6,1,8,3);P(hair,6,3,1,3);P(hair,13,3,1,3);P('#140e0a',8,5,1,1);P('#140e0a',11,5,1,1);P(SC.shade(sk,-35),9,7,2,1)}
  if(L.head){P(L.head,6,1,8,3);P(L.head,6,4,1,2);P(L.head,13,4,1,2);P(SC.shade(L.head,45),7,1,3,1);if(!up)P(SC.shade(L.head,-20),9,4,2,2)}
  if(L.cloak){if(up){P(L.cloak,5,8,10,9);P(SC.shade(L.cloak,-30),5,16,10,1);P(SC.shade(L.cloak,20),7,9,1,6)}else{P(L.cloak,5,8,1,8);P(L.cloak,14,8,1,8);P(L.cloak,7,8,6,1);P('#e8c050',9,8,2,1)}}
  if(L.trinket==='amulet'&&!up){P('#e8c050',9,10,2,2);P('#ffffff',9,10)}
  if(L.shield){if(up){P(L.shield,13,9,4,6);P(SC.shade(L.shield,-40),13,14,4,1)}else{P(L.shield,1,9,4,6);P(SC.shade(L.shield,-40),1,14,4,1);P(SC.shade(L.shield,40),1,9,4,1);P('#e8c050',2,11,2,2)}}
  if(L.trinket==='torch'){const tx=up?15:3;P('#6b4423',tx,9,1,4);P('#ff9a30',tx-1,6,3,3);P('#fff0a0',tx,7)}
  if(!up&&L.wt)weapon(P,L.wt,L.wc,L.wc2,15,13)}
 else{ // facing right (flipped for left by the caller)
  const s1=fr===1?-1:fr===2?1:0;
  if(L.shield){P(L.shield,4,9,4,6);P(SC.shade(L.shield,-40),4,14,4,1)}
  if(L.cloak){P(SC.shade(L.cloak,-25),5,8,4,9);P(L.cloak,6,8,2,8)}
  P(legC,8+s1,14,2,4);P(legC,10-s1,14,2,4);P(boot,8+s1,17,3,2);P(boot,10-s1,17,3,2);
  P(torso,7,8,6,7);P(tD,7,13,6,1);if(L.body)P(SC.shade(L.body,40),10,9,2,1);
  P(sk,7,2,6,6);P(hair,6,1,7,3);P(hair,6,3,3,4);P('#140e0a',11,5,1,1);P(SC.shade(sk,-30),12,6,1,1);
  if(L.head){P(L.head,6,1,7,3);P(L.head,6,4,2,2);P(SC.shade(L.head,45),8,1,3,1);P(SC.shade(L.head,-20),12,4,1,2)}
  if(L.trinket==='torch'){P('#6b4423',13,9,1,4);P('#ff9a30',12,6,3,3);P('#fff0a0',13,7)}
  P(torso,9,9,2,4);P(sk,10,13,2,1);
  if(L.wt)weapon(P,L.wt,L.wc,L.wc2,12,13)}
 outline(g)}
SC.lookFromEq=function(eq,col){const PC=SC.PCOL[col%8];const L={skin:'#f0c8a0',hair:SC.PHAIR[col%8],tunic:PC[0],tunic2:PC[1],trousers:'#4a3a2a'};
 const w=eq.weapon;if(w){const c=SC.gearCol(w);L.wt=SC.ITEMS[w.b].wt;L.wc=c[0];L.wc2=c[1]}
 for(const k of ['head','body','legs','shield','cloak']){const it=eq[k];if(it)L[k]=SC.gearCol(it)[0]}
 const t=eq.trinket;if(t)L.trinket=t.b==='misc.torch'?'torch':'amulet';return L};
SC.lookPack=L=>[L.wt||'',L.wc||'',L.wc2||'',L.head||'',L.body||'',L.legs||'',L.shield||'',L.cloak||'',L.trinket||''];
SC.lookUnpack=function(a,col){const PC=SC.PCOL[col%8];const L={skin:'#f0c8a0',hair:SC.PHAIR[col%8],tunic:PC[0],tunic2:PC[1],trousers:'#4a3a2a'};if(!Array.isArray(a))return L;
 const ok=s=>typeof s==='string'&&/^#[0-9a-f]{6}$/i.test(s)?s:'';const wt=String(a[0]||'');if(SC.WEAPONS[wt]){L.wt=wt;L.wc=ok(a[1])||'#999999';L.wc2=ok(a[2])||'#cccccc'}
 ['head','body','legs','shield','cloak'].forEach((k,i)=>{const c=ok(a[3+i]);if(c)L[k]=c});if(a[8]==='torch'||a[8]==='amulet')L.trinket=a[8];return L};

// ---------- structures, objects, tents, interiors, blood ----------
function structSprite(g,s,c0,c1){g.scale(K,K);const px=mkpx(g);const Kc='#140e0a';
 px('rgba(0,0,0,.25)',3,13,10,3);
 switch(s){
 case'stone':px(Kc,4,1,8,14);px(c0,5,2,6,12);px(c1,10,2,1,12);px('#7affd8',7,4,2,1);px('#7affd8',7,6,1,3);px('#7affd8',8,8,1,1);px('#7affd8',7,10,2,1);nat(g,'#5a1410',7,17,4,1);break;
 case'shrine':px(Kc,2,3,12,12);px(c1,1,2,14,3);px(c0,3,5,10,9);px('#140e0a',6,8,4,6);px('#ffd060',7,9,2,2);break;
 case'well':px(Kc,2,7,12,8);px(c0,3,8,10,6);px('#1a3a5a',5,9,6,3);px(c1,2,2,1,6);px(c1,13,2,1,6);px('#7a4a24',1,1,14,2);break;
 case'tree':px(c0,6,7,4,8);px(Kc,7,10,1,1);px(Kc,9,10,1,1);px('#ffe060',7,10,1,1);px('#ffe060',9,10,1,1);px(c1,1,0,14,8);px(SC.shade(c1,30),3,1,5,2);px(Kc,7,12,3,1);break;
 case'door':px(Kc,2,2,12,13);px(c0,3,3,10,12);px('#1a1410',5,5,6,10);px(c1,5,4,6,1);px('#e8c050',9,10,1,1);break;
 case'idol':px(Kc,5,1,6,14);px(c0,6,2,4,12);px('#ffe060',6,4,1,1);px('#ffe060',9,4,1,1);px(c1,6,7,4,1);px(c1,6,10,4,1);nat(g,'#6a1410',8,15,3,2);break;
 case'throne':px(c0,3,1,2,14);px(c0,11,1,2,14);px(c0,3,9,10,2);px(c1,4,2,8,7);px('#1a1a1a',6,4,1,1);px('#1a1a1a',9,4,1,1);break;
 case'statue':px(Kc,5,1,6,14);px(c0,6,1,4,4);px(c0,5,5,6,7);px(c0,6,12,4,3);px(c1,2,13,12,2);px(SC.shade(c0,40),7,2,1,2);break;
 case'sapling':px('#6b4423',7,8,2,7);px('#2f8a3c',3,3,10,6);px('#4fbf5a',4,2,8,5);px('#f0e070',5,3,2,1);px('#f0e070',10,5,1,1);px('#f0e070',7,1,2,1);break;
 }}
function tentSheet(N,hue){const S=N*CELL,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');const m=Math.round(S*.06);
 const base='#cdb68c',dark=SC.shade(base,-40),trim=SC.hsl(hue,.55,.45);
 g.fillStyle='#140e0a';g.beginPath();g.moveTo(m-2,S-m+2);g.lineTo(S/2,m-3);g.lineTo(S-m+2,S-m+2);g.fill();
 g.fillStyle=base;g.beginPath();g.moveTo(m,S-m);g.lineTo(S/2,m);g.lineTo(S/2,S-m);g.fill();
 g.fillStyle=dark;g.beginPath();g.moveTo(S/2,m);g.lineTo(S-m,S-m);g.lineTo(S/2,S-m);g.fill();
 g.strokeStyle=SC.shade(base,-25);g.lineWidth=1;for(let i=1;i<4;i++){g.beginPath();g.moveTo(S/2,m);g.lineTo(m+(S/2-m)*i/4,S-m);g.stroke();g.beginPath();g.moveTo(S/2,m);g.lineTo(S/2+(S/2-m)*i/4,S-m);g.stroke()}
 g.fillStyle=trim;g.fillRect(m,S-m-Math.round(S*.05),S-2*m,Math.round(S*.05));
 const dw=CELL*.55;g.fillStyle='#1e130b';g.beginPath();g.moveTo(S/2-dw,S-m);g.lineTo(S/2,S-CELL*1.7);g.lineTo(S/2+dw,S-m);g.fill();
 g.fillStyle=SC.shade(base,20);g.beginPath();g.moveTo(S/2-dw,S-m);g.lineTo(S/2-dw*.3,S-CELL*1.3);g.lineTo(S/2-dw*.75,S-m);g.fill();
 g.fillStyle='#ffd890';g.fillRect(S/2-1,S-m-6,2,4);
 g.fillStyle='#6b4423';g.fillRect(S/2-1,m-8,2,9);g.fillStyle=trim;g.beginPath();g.moveTo(S/2+1,m-8);g.lineTo(S/2+9,m-5);g.lineTo(S/2+1,m-2);g.fill();
 g.strokeStyle='#8a7a5a';[[m+2,S-m],[S-m-2,S-m]].forEach(p=>{g.beginPath();g.moveTo(S/2,m+4);g.lineTo(p[0]-4,p[1]+1);g.stroke()});
 return cv}
const sheets=new Map();
SC.getTentSheet=(N,hue)=>{const k=N+':'+hue;let s=sheets.get(k);if(!s){s=tentSheet(N,hue);sheets.set(k,s)}return s};
function interior(g,kind,hue,v){const base=SC.hsl(hue,.38,.42),dark=SC.hsl(hue,.4,.24),light=SC.hsl(hue,.45,.6);const r=i=>SC.h3(v,kind.length,i,77);
 const P=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w||1,h||1)};
 switch(kind){
 case'wall':for(let x=0;x<CELL;x++){const f=Math.sin(x/CELL*Math.PI*2+v)*.5+.5;P(SC.shade(dark,Math.round(f*26-12)),x,0,1,CELL)}P(SC.shade(dark,30),0,CELL-4,CELL,1);P('#3a2a1a',0,CELL-2,CELL,2);break;
 case'floor':P('#6a5640',0,0,CELL,CELL);for(let i=0;i<14;i++)P(i%2?'#5e4c38':'#76624a',(r(i)*CELL)|0,(r(i+20)*CELL)|0,2,1);break;
 case'rug':P(base,0,0,CELL,CELL);for(let i=0;i<10;i++)P(SC.shade(base,(i%2?-8:8)),(r(i)*CELL)|0,(r(i+9)*CELL)|0,2,1);P(light,9,6,2,2);P(light,7,9,6,2);P(light,9,12,2,2);P(dark,9,9,2,2);break;
 case'rugb':P(dark,0,0,CELL,CELL);P(light,2,2,CELL-4,1);P(light,2,CELL-3,CELL-4,1);P(light,2,2,1,CELL-4);P(light,CELL-3,2,1,CELL-4);for(let i=4;i<CELL-4;i+=4)P(base,i,i%8?6:12,2,2);break;
 case'bed':P('#6a5640',0,0,CELL,CELL);P('#140e0a',1,3,18,14);P(light,2,4,16,12);P('#e8e0d0',3,5,5,5);P(base,9,5,8,10);P(dark,9,13,8,2);break;
 case'lamp':P('#6a5640',0,0,CELL,CELL);P('#140e0a',8,4,4,14);P('#3a2a1a',9,10,2,8);P('#ffcc66',8,4,4,5);P('#fff4c0',9,5,2,3);P('#140e0a',7,3,6,1);break;
 case'pole':P('#6a5640',0,0,CELL,CELL);P('#140e0a',8,0,4,CELL);P('#8a5a2a',9,0,2,CELL);break;
 case'door':P('#1e130b',0,0,CELL,CELL);P('#3a2a1a',0,0,3,CELL);P('#3a2a1a',CELL-3,0,3,CELL);P('#c8e0a0',6,CELL-4,8,4);break;
 case'chest':P('#6a5640',0,0,CELL,CELL);P('#140e0a',3,6,14,12);P('#a86e34',4,7,12,5);P('#8a5228',4,12,12,5);P('#e8c050',4,11,12,1);P('#e8c050',9,7,2,10);break}}
SC.TentLayout=function(size){const W=size+4,H=size+2;const t=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){let k='floor';if(y===0||x===0||x===W-1||y===H-1)k='wall';t.push(k)}
 const at=(x,y,k)=>t[y*W+x]=k;const door=[Math.floor(W/2),H-1];at(door[0],door[1],'door');at(1,1,'bed');at(W-2,1,'lamp');if(size>=5){at(1,H-2,'lamp');at(W-2,H-2,'lamp')}
 if(size>=5)for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++)at(x,y,(y===2||y===H-3||x===2||x===W-3)?'rugb':'rug');if(size>=7)at(Math.floor(W/2),Math.floor(H/2)-1,'pole');at(W-3,1,'chest');
 t[(1)*W+(W-3)]=t[(1)*W+(W-3)]==='chest'?'floor':t[(1)*W+(W-3)];return {W,H,t,door,solid:k=>k==='wall'||k==='lamp'||k==='pole'}};
SC.Renderer=class{
 constructor(canvas){const gl=canvas.getContext('webgl2',{antialias:false,alpha:false,premultipliedAlpha:false,preserveDrawingBuffer:false});if(!gl)throw new Error('WebGL2 is not available in this browser.');
  this.gl=gl;this.cv=canvas;this.scene=prog(gl,VS_SCENE,FS_SCENE);this.light=prog(gl,VS_LIGHT,FS_LIGHT);this.comp=prog(gl,VS_FULL,FS_COMP);
  this.atlas=new Atlas(gl);this.max=24000;this.buf=new Float32Array(this.max*6*9);this.n=0;
  this.vbo=gl.createBuffer();this.vao=gl.createVertexArray();gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo);gl.bufferData(gl.ARRAY_BUFFER,this.buf.byteLength,gl.DYNAMIC_DRAW);
  const st=36;gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,st,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,2,gl.FLOAT,false,st,8);
  gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.FLOAT,false,st,16);gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,1,gl.FLOAT,false,st,32);
  this.emptyVao=gl.createVertexArray();
  this.fogTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.fogTex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  this.w=0;this.h=0;}
 mkTarget(w,h,lin){const gl=this.gl;const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA8,w,h);
  const f=lin?gl.LINEAR:gl.NEAREST;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,f);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,f);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);gl.bindFramebuffer(gl.FRAMEBUFFER,null);return {t,fb,w,h}}
 resize(w,h){if(w===this.w&&h===this.h)return;const gl=this.gl;this.w=w;this.h=h;this.cv.width=w;this.cv.height=h;
  if(this.sT){gl.deleteTexture(this.sT.t);gl.deleteFramebuffer(this.sT.fb);gl.deleteTexture(this.lT.t);gl.deleteFramebuffer(this.lT.fb)}
  this.sT=this.mkTarget(w,h,false);this.lT=this.mkTarget(Math.max(1,w>>1),Math.max(1,h>>1),true)}
 // queue a quad; x,y = world px of top-left
 quad(cell,x,y,w,h,r,g,b,f,flip){if(this.n>=this.max)return;const uv=this.atlas.uv(cell);let u0=uv[0],u1=uv[2];if(flip){const t=u0;u0=u1;u1=t}
  const X=x-this.cx,Y=y-this.cy,o=this.n*54,B=this.buf;
  const v=(i,px,py,u,vv)=>{const k=o+i*9;B[k]=px;B[k+1]=py;B[k+2]=u;B[k+3]=vv;B[k+4]=r;B[k+5]=g;B[k+6]=b;B[k+7]=1;B[k+8]=f};
  v(0,X,Y,u0,uv[1]);v(1,X+w,Y,u1,uv[1]);v(2,X,Y+h,u0,uv[3]);v(3,X+w,Y,u1,uv[1]);v(4,X+w,Y+h,u1,uv[3]);v(5,X,Y+h,u0,uv[3]);this.n++}
 // ---- cells ----
 tileCell(bi,kind,v){return this.atlas.get('t'+bi+'_'+kind+'_'+v,g=>paintTile(g,bi,kind,v))}
 humCell(key,pal,dir,frame){return this.atlas.get('h'+key+'_'+dir+'_'+frame,g=>SC.paintPx(g,SC.humRows(dir,frame),pal,dir===1,2,4))}
 charCell(look,dir,frame){const key='c'+JSON.stringify(look)+dir+frame;return this.atlas.get(key,g=>{if(dir===1){const t=document.createElement('canvas');t.width=t.height=CELL;const tg=t.getContext('2d',{willReadFrequently:true});paintChar(tg,look,2,frame);g.save();g.scale(-1,1);g.drawImage(t,-CELL,0);g.restore()}else paintChar(g,look,dir,frame)})}
 tentCell(N,hue,i,j){return this.atlas.get('tent'+N+'_'+hue+'_'+i+'_'+j,g=>g.drawImage(SC.getTentSheet(N,hue),-i*CELL,-j*CELL))}
 intCell(kind,hue,v){return this.atlas.get('in'+kind+hue+'_'+v,g=>interior(g,kind,hue,v))}
 bloodCell(v){return this.atlas.get('bl'+v,g=>{g.fillStyle='#ffffff';if(v<0){g.fillRect(0,0,CELL,CELL);return}const R=SC.rng(v*7919+1);g.beginPath();g.arc(10,10,4+R()*2,0,Math.PI*2);g.fill();for(let i=0;i<7;i++){const a=R()*6.28,d=4+R()*5;g.beginPath();g.arc(10+Math.cos(a)*d,10+Math.sin(a)*d,1+R()*2,0,Math.PI*2);g.fill()}})}
 shapeCell(shape,c0,c1,flip,extra){const key='s'+shape+c0+c1+(flip?'f':'')+(extra||'');return this.atlas.get(key,g=>{
  if(shape==='hum'){const L={skin:c0,hair:c1,tunic:c0,tunic2:c1,trousers:c1};if(extra===undefined)extra=0;paintChar(g,L,(extra|0)===1?2:extra|0,0);if((extra|0)===1){const d=g.getImageData(0,0,CELL,CELL);const t=document.createElement('canvas');t.width=t.height=CELL;t.getContext('2d').putImageData(d,0,0);g.clearRect(0,0,CELL,CELL);g.save();g.scale(-1,1);g.drawImage(t,-CELL,0);g.restore()}return}
  g.translate(2,4);
  if(shape==='wisp'){const gr=g.createRadialGradient(8,8,1,8,8,7);gr.addColorStop(0,'#ffffff');gr.addColorStop(.35,c0);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,16,16);g.fillStyle='#140e0a';g.fillRect(6,7,1,1);g.fillRect(9,7,1,1);return}
  const rows=SC.PX[shape]||SC.PX.blob;g.setTransform(1,0,0,1,0,0);SC.paintPx(g,rows,{k:'#140e0a',c:c0,d:c1,e:'#ffe040',l:SC.shade(c0,60),w:'#ffffff',t:'#e8a030'},flip,2,4)})}
 structCell(s,c0,c1){return this.atlas.get('st'+s+c0+c1,g=>structSprite(g,s,c0,c1))}
 iconCell(it){const c=SC.itemColors(it);const icon=SC.ITEMS[it.b].icon;return this.atlas.get('ic'+icon+c.join(),g=>{g.save();g.translate(3,3);g.scale(14/32,14/32);SC.drawIcon(g,icon,c);g.restore()})}
 miscCell(k,a){return this.atlas.get('m'+k+(a||''),g=>{g.scale(K,K);const px=mkpx(g);
  if(k==='chest'||k==='chesto'||k==='chests'){px('rgba(0,0,0,.25)',2,13,12,3);if(k==='chesto'){px('#140e0a',2,3,12,12);px('#6e3e1c',3,4,10,3);px('#2a160a',3,7,10,3);px('#8a5228',3,10,10,4);px('#e8c050',7,10,2,3)}
   else{const band=k==='chests'?'#9aa8b8':'#e8c050';px('#140e0a',2,4,12,11);px('#a86e34',3,5,10,4);px('#8a5228',3,9,10,5);px(band,3,8,10,1);px(band,7,5,2,9);px('#fff2a0',7,9,2,2)}}
  else if(k==='fire'){px('#5a3a1c',3,12,10,2);px('#3a2410',5,11,6,1);const f=a|0;px('#ff7020',5,6+f,6,6-f);px('#ffb040',6,8,4,4);px('#fff0a0',7,10,2,2)}
  else if(k==='ore'){const M=SC.METALS[a|0];px('rgba(0,0,0,.25)',2,13,12,3);g.fillStyle='#6a6670';g.beginPath();g.moveTo(1,15);g.lineTo(3,6);g.lineTo(9,3);g.lineTo(14,7);g.lineTo(15,15);g.fill();
   g.fillStyle='#4a4650';g.beginPath();g.moveTo(9,3);g.lineTo(14,7);g.lineTo(15,15);g.lineTo(10,15);g.fill();[[5,8],[9,7],[7,11],[11,11],[12,9]].forEach(p=>{px(M.col,p[0],p[1],2,2);px(M.hi,p[0],p[1])})}
  else if(k==='dig'){px('#fff8c0',7,7,2,2);px('#ffe070',8,5,1,6);px('#ffe070',5,8,6,1)}
  else if(k==='mark'){px('#140e0a',6,0,4,11);px('#140e0a',6,12,4,4);px(a||'#ffd040',7,1,2,9);px(a||'#ffd040',7,13,2,2)}})}
 // ---- frame ----
 begin(camX,camY,zoom){this.cx=camX;this.cy=camY;this.zoom=zoom;this.n=0;this.lights=[]}
 addLight(x,y,rad,col,intensity){this.lights.push([x-this.cx,y-this.cy,rad,col[0],col[1],col[2],intensity])}
 end(opts){const gl=this.gl,w=this.w,h=this.h,z=this.zoom;
  // scene
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.sT.fb);gl.viewport(0,0,w,h);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.disable(gl.BLEND);
  gl.useProgram(this.scene.p);gl.uniform2f(this.scene.u.uS,z*2/w,z*2/h);gl.uniform2f(this.scene.u.uCam,this.cx,this.cy);gl.uniform1f(this.scene.u.uTime,opts.time);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.atlas.tex);gl.uniform1i(this.scene.u.uTex,0);
  gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.vbo);gl.bufferSubData(gl.ARRAY_BUFFER,0,this.buf,0,this.n*54);gl.drawArrays(gl.TRIANGLES,0,this.n*6);
  // lights
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.lT.fb);gl.viewport(0,0,this.lT.w,this.lT.h);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
  if(opts.lights&&this.lights.length){const L=this.lights.slice(0,400);const B=this.buf;let k=0;
   for(const l of L){const [x,y,r,cr,cg,cb,I]=l;const q=[[x-r,y-r,-1,-1],[x+r,y-r,1,-1],[x-r,y+r,-1,1],[x+r,y-r,1,-1],[x+r,y+r,1,1],[x-r,y+r,-1,1]];
    for(const v of q){B[k]=v[0];B[k+1]=v[1];B[k+2]=v[2];B[k+3]=v[3];B[k+4]=cr;B[k+5]=cg;B[k+6]=cb;B[k+7]=I;B[k+8]=0;k+=9}}
   gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.useProgram(this.light.p);gl.uniform2f(this.light.u.uS,z*2/w,z*2/h);
   gl.bufferSubData(gl.ARRAY_BUFFER,0,B,0,k);gl.drawArrays(gl.TRIANGLES,0,k/9);gl.disable(gl.BLEND)}
  // fog
  gl.bindTexture(gl.TEXTURE_2D,this.fogTex);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,opts.fog.w,opts.fog.h,0,gl.RED,gl.UNSIGNED_BYTE,opts.fog.data);
  // composite
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);gl.useProgram(this.comp.p);const u=this.comp.u;
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.sT.t);gl.uniform1i(u.uScene,0);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.lT.t);gl.uniform1i(u.uLight,1);
  gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this.fogTex);gl.uniform1i(u.uFog,2);
  gl.uniform3f(u.uAmb,opts.amb[0],opts.amb[1],opts.amb[2]);gl.uniform2f(u.uCam,this.cx,this.cy);gl.uniform2f(u.uView,w/z,h/z);
  gl.uniform2f(u.uFogO,opts.fog.x0,opts.fog.y0);gl.uniform2f(u.uFogS,opts.fog.w,opts.fog.h);gl.uniform1f(u.uFogOn,opts.fogOn?1:0);gl.uniform1f(u.uLightOn,opts.lights?1:0);gl.uniform1f(u.uTime,opts.time);
  gl.bindVertexArray(this.emptyVao);gl.drawArrays(gl.TRIANGLES,0,3);gl.activeTexture(gl.TEXTURE0)}
};
})();
