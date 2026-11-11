// SortCraft — core utilities (shared by browser and node tests)
(function(){
'use strict';
const SC=globalThis.SC=globalThis.SC||{};
SC.CH=32;                 // chunk size in tiles
SC.STEP=150;              // ms per tile step
SC.DX=[0,-1,1,0];SC.DY=[1,0,0,-1]; // down,left,right,up
SC.hashStr=function(s){let h=2166136261>>>0;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
SC.rng=function(a){a=a>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
SC.h2=function(x,y,s){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,982451653))|0;h=Math.imul(h^h>>>13,1274126177);h^=h>>>16;return(h>>>0)/4294967296};
SC.h3=function(x,y,z,s){return SC.h2((x|0)+Math.imul(z|0,92821),(y|0)-Math.imul(z|0,68917),s)};
SC.hseed=function(...a){let h=0x811c9dc5;for(const v of a){h^=(typeof v==='number'?v|0:SC.hashStr(v));h=Math.imul(h,16777619);h^=h>>>13}return h>>>0};
SC.noise=function(seed){const sm=t=>t*t*(3-2*t);return(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),u=sm(x-xi),v=sm(y-yi);
 const a=SC.h2(xi,yi,seed),b=SC.h2(xi+1,yi,seed),c=SC.h2(xi,yi+1,seed),d=SC.h2(xi+1,yi+1,seed);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}};
SC.fbm=function(n,x,y,o){let t=0,amp=1,f=1,s=0;for(let i=0;i<o;i++){t+=n(x*f+i*17.3,y*f-i*9.1)*amp;s+=amp;amp*=.5;f*=2}return t/s};
SC.clamp=(v,a,b)=>v<a?a:v>b?b:v;
SC.lerp=(a,b,t)=>a+(b-a)*t;
SC.pick=(R,a)=>a[Math.floor(R()*a.length)];
SC.cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
SC.wpick=function(R,arr,wf){let tot=0;const w=arr.map(x=>{const v=Math.max(0,wf(x));tot+=v;return v});let r=R()*tot;for(let i=0;i<arr.length;i++){r-=w[i];if(r<=0)return arr[i]}return arr[arr.length-1]};
SC.shuffle=function(R,a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
SC.rgb=function(hex){const n=parseInt(hex.slice(1,7),16);return[(n>>16)&255,(n>>8)&255,n&255]};
SC.hex=function(r,g,b){const c=v=>Math.max(0,Math.min(255,Math.round(v)));return'#'+((1<<24)|(c(r)<<16)|(c(g)<<8)|c(b)).toString(16).slice(1)};
SC.mix=function(a,b,t){const A=SC.rgb(a),B=SC.rgb(b);return SC.hex(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t)};
SC.shade=function(hex,amt){const c=SC.rgb(hex);return SC.hex(c[0]+amt,c[1]+amt,c[2]+amt)};
SC.b64=function(u8){let s='';for(let i=0;i<u8.length;i++)s+=String.fromCharCode(u8[i]);return typeof btoa!=='undefined'?btoa(s):Buffer.from(s,'binary').toString('base64')};
SC.unb64=function(str){const s=typeof atob!=='undefined'?atob(str):Buffer.from(str,'base64').toString('binary');const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u};
SC.dist=(x,y)=>Math.sqrt(x*x+y*y);
SC.key=(x,y)=>x+','+y;
SC.ckey=(cx,cy)=>cx+':'+cy;
SC.cof=v=>Math.floor(v/SC.CH);
SC.syl=['ar','bel','cor','dun','el','fa','gar','hol','ith','jor','ka','lun','mor','nel','or','pel','quin','ros','sil','tam','ul','ven','wyr','yor','zan','mi','tha','bri','ae','cael','lor','mira','tes','ori','vel','nys','qua','ira','eld','syl'];
SC.pname=function(R){const a=SC.pick(R,SC.syl),b=SC.pick(R,SC.syl);return SC.cap(a+b+(R()<.35?SC.pick(R,['a','i','r','ur','in','dis','ar','vi']):''))};
})();
