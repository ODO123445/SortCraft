// SortCraft — item database, stats, identification, crafting
(function(){
'use strict';
const SC=globalThis.SC;
const ITEMS=SC.ITEMS={};
const add=o=>{ITEMS[o.id]=o;return o};

// metals (tier 1..7)
SC.METALS=[null,
 {n:'Bronze',col:'#c8803a',hi:'#f0b070',mul:1},{n:'Iron',col:'#8a8f98',hi:'#c0c4cc',mul:1.5},{n:'Steel',col:'#b8c4d0',hi:'#eef4fa',mul:2.1},
 {n:'Titanium',col:'#c8d0e0',hi:'#ffffff',mul:2.8},{n:'Vibranium',col:'#6a6ad8',hi:'#b8b8ff',mul:3.7},{n:'Adamantium',col:'#a8b8a0',hi:'#e8f0d8',mul:4.8},
 {n:'Crystal Reticulated Odonaterium',short:'Odonaterium',col:'#58e0d0',hi:'#e0fff8',mul:6.2,iri:true}];
SC.WEAPONS={sword:{n:'Sword',atk:6,mc:0,mag:0},axe:{n:'Axe',atk:7,mc:0,mag:0},spear:{n:'Spear',atk:6,mc:0,mag:0},mace:{n:'Mace',atk:7,mc:0,mag:0},
 dagger:{n:'Dagger',atk:4,mc:0,mag:0},bow:{n:'Bow',atk:5,mc:0,mag:0},staff:{n:'Staff',atk:3,mc:3,mag:6},hammer:{n:'Hammer',atk:9,mc:0,mag:0},
 scythe:{n:'Scythe',atk:8,mc:0,mag:0},atgeir:{n:'Atgeir',atk:7,mc:0,mag:0}};
SC.ARMORS={head:{n:'Helm',arm:2,mp:0,ic:'helm'},body:{n:'Cuirass',arm:4,mp:0,ic:'body'},legs:{n:'Greaves',arm:3,mp:0,ic:'legs'},
 shield:{n:'Shield',arm:3,mp:0,ic:'shield'},cloak:{n:'Cloak',arm:1,mp:4,ic:'cloak'},trinket:{n:'Amulet',arm:0,mp:6,ic:'amulet'}};
SC.EQSLOTS=['weapon','head','body','legs','shield','cloak','trinket'];

// gems
SC.GEMS=[
 ['ruby','Ruby','#e02840',{atk:3},'Emberheart'],['sapphire','Sapphire','#2850e0',{mp:8},'Deepwater'],['emerald','Emerald','#20b050',{hp:10},'Greenlife'],
 ['amethyst','Amethyst','#9040d0',{magic:4},'Spellbound'],['topaz','Topaz','#f0b020',{find:1},'Fortune'],['onyx','Onyx','#202028',{arm:3},'Nightguard'],
 ['garnet','Garnet','#a01830',{atk:2,hp:4},'Bloodbright'],['opal','Opal','#e8e0f0',{find:2},'Dreamshard'],['jade','Jade','#40a070',{hp:6,arm:1},'Jadeward'],
 ['moonstone','Moonstone','#c8d8f0',{mp:6,magic:2},'Moonlit'],['sunstone','Sunstone','#ff9030',{light:3,atk:1},'Sunforged'],['bloodstone','Bloodstone','#602020',{atk:4},'Bloodsworn'],
 ['aquamarine','Aquamarine','#60d0e0',{mp:10},'Tidebound'],['obsidian','Obsidian','#302838',{atk:3,arm:1},'Voidedge'],['pearl','Pearl','#f0ece0',{arm:2,hp:6},'Pearlward'],
 ['diamond','Diamond','#e8f8ff',{atk:3,arm:3,mp:4,hp:6},'Starborn']];
SC.GEMS.forEach((g,i)=>add({id:'gem.'+g[0],name:g[1],cat:'gem',icon:'gem',col:[g[2],SC.shade(g[2],70)],stack:true,small:true,idSk:'geologist',idLvl:Math.floor(i/4),
 rar:Math.min(4,1+Math.floor(i/5)),val:20+i*6,fx:g[3],adj:g[4],desc:'A cut gem. Hold it over a weapon or armour piece to set it.'}));

// rare elements (one per hybrid biome)
SC.HYBRIDS.forEach((h,i)=>{const R=SC.rng(SC.hseed('rare',i));const fx={};
 const keys=['atk','arm','mp','hp','magic','find','light'];for(let j=0;j<3;j++){const k=SC.pick(R,keys);fx[k]=(fx[k]||0)+2+Math.floor(R()*4)}
 add({id:'rare.'+i,name:h.rare,cat:'rare',icon:'crystal',col:[h.rareCol,SC.shade(h.rareCol,-60)],stack:true,small:true,bi:33-24+i,idSk:'geologist',idLvl:2+(i%4),
  rar:4,val:80+i*4,el:[h.el,h.el2],fx,adj:h.rare.split(' ')[0]+'-bound',desc:`Found only in ${h.name}. Socket it into gear, or brew with it.`})});

// ores, ingots
for(let t=1;t<=7;t++){const M=SC.METALS[t];
 add({id:'ore.'+t,name:(M.short||M.n)+' Ore',cat:'ore',icon:'ore',col:[M.col,'#5a5048'],stack:true,small:false,tier:t,rar:Math.max(0,t-2),val:3*t*t,
  desc:`Raw ${M.n} ore. Drop one onto another to smelt an ingot (Crafting ${t-1}).`});
 add({id:'ing.'+t,name:(M.short||M.n)+' Ingot',cat:'ingot',icon:'ingot',col:[M.col,M.hi],stack:true,small:false,tier:t,rar:Math.max(0,t-2),val:8*t*t,
  desc:`A bar of ${M.n}. Drop it onto a pattern to forge (Crafting ${t-1}).`})}
// weapons, armour, patterns
for(const k in SC.WEAPONS){const W=SC.WEAPONS[k];add({id:'w.'+k,name:W.n,cat:'weapon',icon:k,slot:'weapon',wt:k,stack:false,val:10});
 add({id:'pat.'+k,name:'Pattern: '+W.n,cat:'pattern',icon:'pattern',sub:k,col:['#d8c8a0','#8a6a3a'],stack:false,val:15,rar:1,desc:'A smith\'s pattern. Drop an ingot onto it to forge. Patterns are not used up.'})}
for(const k in SC.ARMORS){const A=SC.ARMORS[k];add({id:'a.'+k,name:A.n,cat:'armor',icon:A.ic,slot:k,stack:false,val:10});
 add({id:'pat.'+k,name:'Pattern: '+A.n,cat:'pattern',icon:'pattern',sub:k,col:['#d8c8a0','#8a6a3a'],stack:false,val:15,rar:1,desc:'A smith\'s pattern. Drop an ingot onto it to forge. Patterns are not used up.'})}
add({id:'pot',name:'Potion',cat:'potion',icon:'potion',stack:true,val:8});
add({id:'misc.chest',name:'Storage Chest',cat:'misc',icon:'chest',col:['#8a5228','#e8c050'],stack:true,val:12,desc:'Double-click to place it in front of you. Holds 24 items. Anyone in your world can open it.'});
add({id:'misc.torch',name:'Torch',cat:'misc',icon:'torch',col:['#6b4423','#ff9a30'],stack:true,val:3,slot:'trinket',desc:'Equip as a trinket to light the way (+3 sight).'});
add({id:'misc.bread',name:'Hearth Bread',cat:'misc',icon:'bread',col:['#c88a40','#f0c070'],stack:true,val:4,desc:'Double-click to eat. Restores 8 health.'});
add({id:'misc.mead',name:'Honey Mead',cat:'misc',icon:'mead',col:['#e0a030','#8a5020'],stack:true,val:10,desc:'Double-click to drink. Restores 10 magic.'});

// relics
const REL=[['Silver Torc','torc'],['Carved Raven Idol','idol'],["Old Baron's Coin",'coin'],['Starlight Brooch','ring'],['Elven Lantern Glass','lantern'],['Dawn Harp String','rune'],
 ["Seer's Bone Dice",'idol'],['Verdant Chalice','chalice'],['Honeywood Mask','mask'],["Giant's Tooth Charm",'fang'],['Frostbitten Horn','horn'],['Troll Hide Pouch','chest'],
 ['Mistglass Mirror','ring'],['Rimed Crown Shard','crystal'],['Frozen Tear','gem'],["Ember King's Coin",'coin'],['Ashen Figurine','idol'],['Cinder Torc','torc'],
 ['Dwarven Cog','coin'],['Dark Elf Signet','ring'],['Runed Anvil Stone','rune'],["Ferryman's Obol",'coin'],['Bone Flute','horn'],['Grave Lantern','lantern'],
 ['Exalted Signet','ring'],['Golden Apple Seed','berry'],['Rainbow Bridge Shard','crystal']];
REL.forEach((r,i)=>{const re=Math.floor(i/3),R=SC.REALMS[re];add({id:'rel.'+i,name:r[0],cat:'relic',icon:r[1],col:[R.pal.sp,R.pal.rock],stack:true,small:false,bi:re,rar:Math.min(5,1+R.tier+(i%3===2?1:0)),val:25+R.tier*25+(i%3)*10,
 desc:`A relic of ${R.name}. Valuable to traders and collectors.`})});

// collectable species: 8 flora, 5 fauna, 4 minerals per biome (33 biomes → 561 species)
const FLORA=[['Moss','moss'],['Fern','fern'],['Cap','mushroom'],['Bloom','flower'],['Root','root'],['Lichen','moss'],['Berry','berry'],['Thistle','herb'],['Reed','herb'],['Bulb','root'],['Vine','vine'],['Petal','flower'],['Sedge','herb'],['Clover','flower'],['Spore','mushroom'],['Bramble','berry']];
const FAUNA=[['Beetle','beetle'],['Moth','wing'],['Feather','feather'],['Scale','scale'],['Shell','shell'],['Fang','fang'],['Egg','egg'],['Snail','shell'],['Dragonfly','wing'],['Spider','beetle'],['Butterfly','wing'],['Claw','fang'],['Horn','horn']];
const MINER=[['Quartz','crystal'],['Geode','geode'],['Fossil','fossil'],['Shard','crystal'],['Pebble','stone'],['Amber','amber'],['Flint','stone'],['Slate','stone'],['Crystal','crystal'],['Agate','geode']];
const GEN=['ia','aria','ella','ium','opsis','ensis','ina','ora'];
SC.SPECIES=[];SC.SPECIES_BY_BIOME=[];
SC.BIOMES.forEach((b,bi)=>{const R=SC.rng(SC.hseed('species',bi));const list=[];SC.SPECIES_BY_BIOME[bi]=list;
 const used=new Set();
 const mk=(cat,bases,n,idSk,prefixRoot)=>{const bs=SC.shuffle(R,bases).slice(0,n);bs.forEach((bs1,i)=>{
  let pre;do{pre=SC.pick(R,b.pre)}while(used.has(pre+bs1[0])&&used.size<60);used.add(pre+bs1[0]);
  const rar=Math.min(5,Math.floor(Math.pow(R(),2.2)*4)+(b.tier>=2?1:0)+(b.hybrid?1:0));
  const genus=SC.cap(SC.pick(R,SC.syl)+SC.pick(R,SC.syl).slice(0,2))+SC.pick(R,GEN.slice(0,5));
  const id=prefixRoot+'.'+bi+'.'+i;
  const el=[b.el,b.hybrid?b.el2:Math.floor(R()*9)];
  const glow=b.pal.det[Math.floor(R()*3)];
  add({id,name:pre+' '+bs1[0],cat,icon:bs1[1],col:[cat==='flora'?glow:cat==='fauna'?SC.mix(b.pal.leaf,glow,.4):SC.mix(b.pal.rock,b.pal.sp,.5),SC.shade(b.pal.g[0],-30)],
   stack:true,small:true,bi,idSk,idLvl:Math.min(9,b.tier+Math.floor(R()*3)+(rar>2?1:0)),rar,el,pot:1+Math.floor(R()*9),
   val:Math.round(3*(1+rar)*(1+b.tier)*(0.8+R()*.5)),latin:genus+' '+b.key.replace(/^hy\d+$/,'') .toLowerCase()+(b.hybrid?b.name.toLowerCase().replace(/[^a-z]/g,'').slice(0,7)+'is':'ensis'),
   mag:(b.el===1||b.el===6||b.el===8||b.hybrid)?Math.floor(R()*4):0});
  list.push(id);SC.SPECIES.push(id)})};
 mk('flora',FLORA,8,'botanist','fl');mk('fauna',FAUNA,5,'hunter','fa');mk('mineral',MINER,4,'geologist','mi');
 if(b.hybrid)list.push('rare.'+(bi-9));
});
SC.SMALLCATS=['flora','fauna','mineral','gem','rare'];

// ---------- instances ----------
SC.mkItem=function(b,o){const it=Object.assign({b,k:1,r:0,q:50},o||{});const base=ITEMS[b];if(base&&base.rar!==undefined&&o&&o.r===undefined)it.r=base.rar;return it};
SC.clone=it=>JSON.parse(JSON.stringify(it));
SC.canStack=(a,b)=>a&&b&&a.b===b.b&&ITEMS[a.b]&&ITEMS[a.b].stack&&a.r===b.r&&(a.b!=='pot'||(a.e&&b.e&&a.e[0]===b.e[0]&&a.e[1]===b.e[1]&&Math.abs(a.q-b.q)<8));
SC.MAXSTACK=50;
const UNI1=['Skull','Frost','Dawn','Storm','Grave','Wolf','Raven','Doom','Star','Ash','Shade','Rune','Oath','Thunder','Ember','Night','Gold','Bone','Wyrm','Sun'];
const UNI2=['splitter','bite','bringer','song','breaker','fang','wing','reaver','fall','brand','caller','keeper','biter','ward','howl','shard','maw','seeker','cleaver','light'];
SC.uniqueName=R=>SC.pick(R,UNI1)+SC.pick(R,UNI2);
SC.potionName=function(e){const a=Math.min(e[0],e[1]),b=Math.max(e[0],e[1]);const k=a+'-'+b;
 const N={'0-2':'Healing Draught','2-2':'Greater Healing Draught','1-4':'Mana Tonic','1-6':'Elixir of Sight','3-5':'Draught of Wrath','0-3':'Stoneskin Brew','6-7':'Shadowstep Philtre',
  '2-5':'Phoenix Tear','2-7':'Grave Draught','0-8':'Glory Mead','1-2':"Seer's Brew",'3-8':'Draught of Giants','4-6':'Mist Elixir','0-6':'Dwarven Ale','4-5':'Steam Tonic','1-8':'Prism Cordial'};
 if(N[k])return N[k];if(a===b)return'Pure '+SC.ELEMENTS[a]+' Draught';return SC.ELEMENTS[a]+'-'+SC.ELEMENTS[b]+' Tincture'};
// element effects for potions (per element, scaled by potency)
SC.ELFX=[{arm:3,buff:60},{reveal:14},{hp:14},{atk:3,buff:60},{mp:14},{atk:2,hp:6,buff:45},{stealth:45},{hp:22,mp:-4},{xp:.5,buff:90}];
SC.potionFx=function(it){const fx={},s=0.6+it.q/100;for(const e of it.e||[2,2]){for(const [k,v] of Object.entries(SC.ELFX[e])){fx[k]=(fx[k]||0)+(k==='buff'?v:v*s)}}
 for(const k in fx)if(k!=='xp')fx[k]=Math.round(fx[k]);return fx};

// ---------- stats ----------
SC.stats=function(it){const B=ITEMS[it.b];if(!B)return {name:'???',atk:0,arm:0,mc:0,val:0};
 const r=it.r|0,rm=SC.RARMUL[r],qm=0.9+(it.q|0)/500;const G=it.g?ITEMS[it.g]:null;const G2=it.g2?ITEMS[it.g2]:null;const gf=Object.assign({},G?G.fx:{});if(G2)for(const k in G2.fx)gf[k]=(gf[k]||0)+G2.fx[k];
 const s={name:B.name,cat:B.cat,atk:0,arm:0,mc:0,val:B.val||1,mp:0,hp:0,magic:0,find:0,light:0,r};
 if(B.cat==='weapon'){const W=SC.WEAPONS[B.wt],M=SC.METALS[it.m||1];
  s.atk=Math.round(W.atk*M.mul*rm*qm)+(gf.atk||0);s.magic=Math.round(W.mag*M.mul*rm)+(gf.magic||0)*2;s.mc=W.mc+(s.magic>0?Math.ceil((gf.magic||0)/2):0)+(W.mc?it.m|0:0);
  s.arm=gf.arm||0;s.mp=gf.mp||0;s.hp=gf.hp||0;s.find=gf.find||0;s.light=gf.light||0;
  s.val=Math.round(12*W.atk*Math.pow(M.mul,1.4)*rm*rm*qm+(G?G.val:0)+(G2?G2.val:0));
  s.name=it.n?`${it.n}`:`${G?G.adj+' ':''}${M.short||M.n} ${W.n}`;s.sub=it.n?`${G?G.adj+' ':''}${M.short||M.n} ${W.n}`:'';}
 else if(B.cat==='armor'){const A=SC.ARMORS[B.slot],M=SC.METALS[it.m||1];
  s.arm=Math.round(A.arm*M.mul*rm*qm)+(gf.arm||0);s.mp=Math.round(A.mp*rm)+(gf.mp||0);s.hp=gf.hp||0;s.atk=gf.atk||0;s.magic=gf.magic||0;s.find=gf.find||0;s.light=gf.light||0;
  s.mc=s.magic?Math.ceil(s.magic/3):0;s.val=Math.round(10*(A.arm+1)*Math.pow(M.mul,1.4)*rm*rm*qm+(G?G.val:0));
  s.name=it.n||`${G?G.adj+' ':''}${M.short||M.n} ${A.n}`;s.sub=it.n?`${G?G.adj+' ':''}${M.short||M.n} ${A.n}`:''}
 else if(B.cat==='potion'){const fx=SC.potionFx(it);s.name=SC.potionName(it.e||[2,2]);s.val=Math.round(8+it.q/4+(fx.hp||0)/2);s.fx=fx;s.mc=0}
 else if(B.cat==='gem'||B.cat==='rare'){Object.assign(s,{atk:B.fx.atk||0,arm:B.fx.arm||0,mp:B.fx.mp||0,hp:B.fx.hp||0,magic:B.fx.magic||0,find:B.fx.find||0,light:B.fx.light||0});s.val=Math.round(B.val*rm*qm);s.mc=Math.ceil((B.fx.magic||0)/2)}
 else if(B.cat==='misc'&&it.b==='misc.torch'){s.light=3}
 else{s.val=Math.round((B.val||1)*rm*qm);s.mc=B.mag||0}
 if(B.cat==='weapon'||B.cat==='armor'){s.metal=it.m||1;s.gem=G?G.name+(G2?' + '+G2.name:''):null}
 return s};
// what a player can identify, given skill levels
SC.known=function(it,sk){const B=ITEMS[it.b];if(!B||!B.idSk)return 2;const lv=sk[SC.SKI[B.idSk]]||0;return lv>=B.idLvl+2?2:lv>=B.idLvl?1:0};
const VAGUE={flora:'plant',fauna:'specimen',mineral:'stone',gem:'gem',rare:'crystal'};
SC.dispName=function(it,sk){const B=ITEMS[it.b];if(!B)return'???';if(SC.known(it,sk)===0)return'Unknown '+(VAGUE[B.cat]||'thing');return SC.stats(it).name};
SC.itemBiome=it=>{const B=ITEMS[it.b];return B&&B.bi!==undefined?SC.BIOMES[B.bi]:null};

// ---------- crafting: drop A (dragged) onto B (target) ----------
// returns {kind:'cauldron'|'anvil'|'forge', make:()=>result, useB:bool, skill, xp, need:{skill,lv}} or null
SC.ORGANIC=['flora','fauna'];
SC.combine=function(a,b,sk,who){if(!a||!b)return null;const A=ITEMS[a.b],B=ITEMS[b.b];if(!A||!B)return null;
 const lv=k=>sk[SC.SKI[k]]||0;const craft=lv('crafting'),alch=lv('alchemist'),bot=lv('botanist');const has=k=>SC.hasAb(sk,k);
 const isGear=x=>x.cat==='weapon'||x.cat==='armor';const seed=()=>SC.rng(SC.hseed(who||'',a.b,b.b,a.q,b.q,Date.now()));
 // dye worn items with organic matter
 if(SC.ORGANIC.includes(A.cat)&&isGear(B)){return {kind:'dye',useB:true,skill:'botanist',xp:3,make:()=>{const r=SC.clone(b);r.k=1;r.h=SC.hueOf(A.col[0]);r.hs=Math.min(.95,.45+bot*.025+(has('masterdyer')?.15:0));return r}}}
 // set a gem (second gem with Runesmith)
 if((A.cat==='gem'||A.cat==='rare')&&isGear(B)){if(b.g&&(b.g2||!has('runesmith')))return {kind:'anvil',err:b.g2?'Both gem sockets are full.':'Already has a gem set (Runesmith adds a second socket).'};
  const need=Math.floor((b.m||1)/2);if(craft<need)return {kind:'anvil',err:`Needs Crafting ${need}.`};
  return {kind:'anvil',useB:true,skill:'crafting',xp:6+(b.m|0)*2,make:()=>{const r=SC.clone(b);if(r.g)r.g2=a.b;else r.g=a.b;r.k=1;if(r.r<a.r)r.r=Math.min(6,r.r+1);if(has('gemcutter'))r.q=Math.min(99,r.q+10);
   if(r.r>=4&&!r.n)r.n=SC.uniqueName(seed());if(!r.c){r.c=who||'';r.cl=false}return r}}}
 // smelt
 if(A.cat==='ore'&&B.cat==='ore'&&A.tier===B.tier){const need=A.tier-1;if(craft<need)return {kind:'forge',err:`Needs Crafting ${need}.`};
  return {kind:'forge',useB:true,skill:'crafting',xp:3+A.tier*2,make:()=>SC.mkItem('ing.'+A.tier,{q:Math.round((a.q+b.q)/2),r:A.rar||0})}}
 // alloy two different ingots
 if(A.cat==='ingot'&&B.cat==='ingot'&&A.tier!==B.tier){if(!has('alloying'))return {kind:'forge',err:'Needs Alloying (Crafting 20).'};const t=Math.min(7,Math.max(A.tier,B.tier)+1);
  return {kind:'forge',useB:true,skill:'crafting',xp:10+t*3,make:()=>SC.mkItem('ing.'+t,{q:Math.round((a.q+b.q)/2),r:ITEMS['ing.'+t].rar})}}
 // transmute ore with a potion
 if(A.cat==='ore'&&B.cat==='potion'){if(!has('transmutation'))return {kind:'cauldron',err:'Needs Transmutation (Alchemist 10).'};const t=Math.min(7,A.tier+1);
  return {kind:'cauldron',useB:true,skill:'alchemist',xp:8+t*2,make:()=>SC.mkItem('ore.'+t,{q:a.q,k:1})}}
 // distil two identical potions
 if(A.cat==='potion'&&B.cat==='potion'){if(!has('distill'))return {kind:'cauldron',err:'Needs Distill (Alchemist 4).'};
  if(!(a.e&&b.e&&a.e[0]===b.e[0]&&a.e[1]===b.e[1]))return {kind:'cauldron',err:'Only identical potions can be distilled.'};
  return {kind:'cauldron',useB:true,skill:'alchemist',xp:6,make:()=>SC.mkItem('pot',{e:a.e.slice(),q:Math.min(99,Math.max(a.q,b.q)+25),r:Math.min(6,Math.max(a.r,b.r)+1)})}}
 // forge from a pattern
 const ing=A.cat==='ingot'?[a,A]:B.cat==='ingot'?[b,B]:null,pat=A.cat==='pattern'?[a,A]:B.cat==='pattern'?[b,B]:null;
 if(ing&&pat&&ing[0]!==pat[0]){const t=ing[1].tier;if(craft<t-1)return {kind:'anvil',err:`Needs Crafting ${t-1}.`};
  const consumeTarget=(B.cat==='ingot');
  return {kind:'anvil',useB:consumeTarget,keepPattern:true,skill:'crafting',xp:8+t*4,make:()=>{const R=seed();
   const sub=pat[1].sub,isW=!!SC.WEAPONS[sub];let r=SC.rollRarity(R,craft*60,craft/2+(has('masterwork')?1:0));if(has('legendforge'))r=Math.max(r,3);
   const it=SC.mkItem(isW?'w.'+sub:'a.'+sub,{m:t,r,q:Math.min(99,Math.round(ing[0].q*.6+craft*5+R()*20+(has('masterwork')?5+craft:0))),c:who||'',cl:false});
   if(r>=4)it.n=SC.uniqueName(R);return it}}}
 // brew
 if(A.el&&B.el&&!isGear(A)&&!isGear(B)&&A.cat!=='potion'&&B.cat!=='potion'){const herbs=A.cat==='flora'&&B.cat==='flora'&&has('ancientherb');
  return {kind:'cauldron',useB:true,skill:'alchemist',xp:5+Math.max(A.rar||0,B.rar||0)*2,
  make:()=>SC.mkItem('pot',{e:[A.el[0],B.el[0]],k:has('catalyst')?2:1,q:Math.min(99,Math.round((((a.q|0)+(b.q|0))/4+alch*6+((A.pot||3)+(B.pot||3))*2)*(herbs?1.2:1))),r:Math.min(6,Math.max(a.r|0,b.r|0)+(herbs?1:0))})}}
 return null};
// colour helpers for dyes
SC.hueOf=function(hex){const [r,g,b]=SC.rgb(hex).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(mx===mn)return 30;let h;const d=mx-mn;
 if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;return Math.round((h*60+360)%360)};
SC.lightOf=function(hex){const c=SC.rgb(hex);return (Math.max(...c)+Math.min(...c))/510};
SC.hsl=function(h,s,l){const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1))};return SC.hex(f(0)*255,f(8)*255,f(4)*255)};
SC.gearCol=function(it){const M=SC.METALS[it.m||1];if(it.h===undefined||it.h===null)return [M.col,M.hi];const s=it.hs||.55;return [SC.hsl(it.h,s,SC.clamp(SC.lightOf(M.col),.3,.62)),SC.hsl(it.h,s*.8,SC.clamp(SC.lightOf(M.hi),.55,.85))]};
SC.salvage=function(it){const n=1+Math.floor((it.r|0)/2);const out=[SC.mkItem('ing.'+(it.m||1),{k:n,q:it.q})];if(it.g)out.push(SC.mkItem(it.g,{q:60}));if(it.g2)out.push(SC.mkItem(it.g2,{q:60}));return out};
SC.transmuteStone=function(it,R){const B=ITEMS[it.b];const opts=[];for(const id in ITEMS){const X=ITEMS[id];if((X.cat==='mineral'||X.cat==='gem'||X.cat==='ore')&&id!==it.b&&Math.abs((X.rar|0)-(B.rar|0))<=1)opts.push(id)}
 return SC.mkItem(SC.pick(R,opts),{q:it.q,k:1})};
SC.isStone=it=>{const B=ITEMS[it.b];return !!B&&(B.cat==='mineral'||B.cat==='ore'||B.cat==='gem'||B.cat==='rare')};
// ---------- loot ----------
SC.metalTierAt=d=>Math.max(1,Math.min(7,1+Math.floor(d/110)));
SC.loot=function(R,x,y,bi,n,bonus){const d=SC.dist(x,y),out=[];const mt=SC.metalTierAt(d);
 const tier=()=>Math.max(1,mt-Math.floor(R()*2.2));
 for(let i=0;i<n;i++){const r=SC.rollRarity(R,d,bonus||0),q=Math.floor(R()*100),roll=R();let it;
  if(roll<.18)it=SC.mkItem('rel.'+(SC.pick(R,[0,1,2])+3*(SC.BIOMES[bi].hybrid?SC.pick(R,[SC.BIOMES[bi].a,SC.BIOMES[bi].b]):bi)),{q});
  else if(roll<.29)it=SC.mkItem('gem.'+SC.GEMS[Math.min(15,Math.floor(R()*(6+d/40)))][0],{q});
  else if(roll<.42)it=SC.mkItem('ore.'+tier(),{q,k:1+Math.floor(R()*3)});
  else if(roll<.48)it=SC.mkItem('ing.'+tier(),{q});
  else if(roll<.55)it=SC.mkItem('pat.'+SC.pick(R,Object.keys(SC.WEAPONS).concat(Object.keys(SC.ARMORS))),{q});
  else if(roll<.65){it=SC.mkItem('w.'+SC.pick(R,Object.keys(SC.WEAPONS)),{m:tier(),r,q,c:SC.pname(R),cl:true});if(R()<.15+r*.08)it.g='gem.'+SC.GEMS[Math.floor(R()*16)][0];if(r>=4)it.n=SC.uniqueName(R)}
  else if(roll<.74){it=SC.mkItem('a.'+SC.pick(R,Object.keys(SC.ARMORS)),{m:tier(),r,q,c:SC.pname(R),cl:true});if(r>=4)it.n=SC.uniqueName(R)}
  else if(roll<.84)it=SC.mkItem('pot',{e:[Math.floor(R()*9),Math.floor(R()*9)],q,r:Math.min(r,3)});
  else if(roll<.9)it=SC.mkItem(SC.pick(R,['misc.bread','misc.mead','misc.torch','misc.chest']),{k:1+Math.floor(R()*2)});
  else{const sp=SC.SPECIES_BY_BIOME[bi];it=SC.mkItem(SC.pick(R,sp),{q})}
  if(it.r===undefined||ITEMS[it.b].cat!=='weapon'&&ITEMS[it.b].cat!=='armor')it.r=Math.max(it.r|0,Math.min(6,(ITEMS[it.b].rar|0)+(r>2?1:0)));
  out.push(it)}
 return out};
SC.speciesRoll=function(R,bi,cat){const list=SC.SPECIES_BY_BIOME[bi].filter(id=>!cat||ITEMS[id].cat===cat);return SC.wpick(R,list,id=>1/(1+ITEMS[id].rar*1.6))};
SC.starterKit=function(name){return [SC.mkItem('w.sword',{m:1,q:40,c:name,cl:true}),SC.mkItem('a.cloak',{m:1,q:40}),SC.mkItem('pot',{e:[0,2],q:40,k:3}),
 SC.mkItem('misc.chest',{k:2}),SC.mkItem('misc.torch',{k:1}),SC.mkItem('misc.bread',{k:4}),SC.mkItem('pat.dagger',{}),SC.mkItem('ore.1',{k:2,q:40})]};
SC.counts=()=>({base:Object.keys(ITEMS).length,species:SC.SPECIES.length});
})();
