// SortCraft — realms, biomes, creatures, NPC descriptors, encounter responses, skills
(function(){
'use strict';
const SC=globalThis.SC;

// ---------- the nine realms (generic fantasy) ----------
// el = alchemical element; tier = how far out it starts appearing
SC.ELEMENTS=['Earth','Light','Life','Might','Frost','Flame','Shadow','Death','Glory'];
SC.ELCOL=['#8a6a3a','#f4e7a0','#5ac86a','#a08060','#9ad8f8','#ff7a30','#8a5ad8','#9aa890','#f0c040'];
SC.REALMS=[
 {key:'heartlands',name:'The Heartlands',sub:'Realm of Mortals',el:0,tier:0,tree:'round',special:'hay',spSolid:0,spGlow:0,
  pal:{g:['#5ca83e','#4f9a35','#6cbc4b'],det:['#f5e663','#f08ac0','#ffffff'],path:'#c8a26a',water:'#3c7fd6',deep:'#2d62b5',leaf:'#2f7a2c',trunk:'#6b4423',rock:'#8a8a92',sp:'#d8b850',shore:'#e6d38f'},
  amb:[1,1,1],water:.30,trees:.55,rocks:.04,sp:.03,
  pre:['Meadow','Hearth','Oak','Barley','Field','Brook','Miller','Raven']},
 {key:'lumenvale',name:'Lumen Vale',sub:'Realm of the Light-Folk',el:1,tier:1,tree:'glow',special:'lumflower',spSolid:0,spGlow:1,
  pal:{g:['#8fd0a0','#9ad8b0','#a8e0b8'],det:['#ffffff','#f8f0a8','#c8f0ff'],path:'#e8e0c8',water:'#7ad0e8',deep:'#4aa0c8',leaf:'#f0e8a0',trunk:'#e8e4d8',rock:'#c8c8d8',sp:'#fff6b0',shore:'#f0ecd8'},
  amb:[1.05,1.05,.95],water:.32,trees:.5,rocks:.03,sp:.05,
  pre:['Gleam','Dawn','Silver','Lumen','Star','Pale','Glimmer','Halo']},
 {key:'wildgrove',name:'Wildgrove',sub:'Realm of the Wild Kin',el:2,tier:1,tree:'jungle',special:'bigfern',spSolid:1,spGlow:0,
  pal:{g:['#3f8a2a','#367a24','#4a9a34'],det:['#e84a4a','#f0a030','#f070c0'],path:'#a08050',water:'#2a8a7a',deep:'#1a6a62',leaf:'#1f6a1a',trunk:'#5a3a1a',rock:'#6a7a5a',sp:'#2a8a3a',shore:'#c8b878'},
  amb:[.95,1.05,.95],water:.36,trees:.68,rocks:.03,sp:.06,
  pre:['Wild','Verdant','Seer','Rain','Thorn','Fertile','Honey','Grove']},
 {key:'titanreach',name:'Titanreach',sub:'Realm of the Giants',el:3,tier:2,tree:'pine',special:'boulder',spSolid:1,spGlow:0,
  pal:{g:['#8a8a72','#7a7a64','#969680'],det:['#a8a890','#6a6a58','#c8c0a0'],path:'#a89878',water:'#4a6a8a',deep:'#344e6a',leaf:'#2a4a3a',trunk:'#4a3a2a',rock:'#6a6a70',sp:'#7a7a80',shore:'#9a9488'},
  amb:[.95,.95,1],water:.28,trees:.45,rocks:.10,sp:.05,
  pre:['Giant','Crag','Boulder','Thunder','Grim','Tundra','Stone','Troll']},
 {key:'frostmere',name:'Frostmere',sub:'Realm of Mist and Ice',el:4,tier:2,tree:'icepine',special:'ice',spSolid:0,spGlow:0,
  pal:{g:['#dde8f0','#d0dee8','#e8f0f8'],det:['#b8d0e0','#ffffff','#a8c8e0'],path:'#b8c8d4',water:'#6a9ac8',deep:'#4a78a8',leaf:'#8ab0c0',trunk:'#5a6a78',rock:'#9aa8b8',sp:'#a8d8f8',shore:'#c8d8e4'},
  amb:[.85,.92,1.08],water:.30,trees:.42,rocks:.05,sp:.08,
  pre:['Frost','Rime','Mist','Hoar','Ice','Shiver','Snow','Fog']},
 {key:'emberwaste',name:'Emberwaste',sub:'Realm of Fire and Ash',el:5,tier:2,tree:'charred',special:'lava',spSolid:1,spGlow:1,
  pal:{g:['#4a2a20','#3e241c','#583226'],det:['#7a3a1a','#ff8a3a','#2a1a14'],path:'#6a4a3a',water:'#ff6020',deep:'#d84010',leaf:'#3a2018',trunk:'#2a1a14',rock:'#3a2a28',sp:'#ff7020',shore:'#5a3a2a'},
  amb:[1.1,.85,.75],water:.18,trees:.30,rocks:.08,sp:.07,
  pre:['Ember','Cinder','Ash','Blaze','Scorch','Magma','Flame','Soot']},
 {key:'underdeep',name:'The Underdeep',sub:'Realm of Delvers and Shadow-Folk',el:6,tier:1,tree:'mushroom',special:'crystal',spSolid:1,spGlow:1,
  pal:{g:['#2a2a34','#24242e','#32323e'],det:['#4a4a5a','#6a4aa0','#2a3a4a'],path:'#4a4a52',water:'#1a2a4a',deep:'#101a34',leaf:'#6a4aa0',trunk:'#4a3a5a',rock:'#3a3a48',sp:'#b070ff',shore:'#3a3a44'},
  amb:[.7,.7,.85],water:.24,trees:.42,rocks:.10,sp:.06,
  pre:['Gloom','Deep','Shade','Dusk','Hollow','Ore','Night','Murk']},
 {key:'gravemoor',name:'Gravemoor',sub:'Realm of the Restless Dead',el:7,tier:3,tree:'dead',special:'bones',spSolid:0,spGlow:0,
  pal:{g:['#5a5a58','#50504e','#646462'],det:['#d8d4c8','#7a7a70','#3a3a3a'],path:'#6a6a64',water:'#3a4a3a',deep:'#2a362a',leaf:'#3a3a3a',trunk:'#2a2a2a',rock:'#4a4a4a',sp:'#e0dccc',shore:'#5a5a50'},
  amb:[.7,.78,.72],water:.26,trees:.40,rocks:.06,sp:.07,
  pre:['Grave','Bone','Wither','Pale','Corpse','Shroud','Ghost','Rot']},
 {key:'skyhold',name:'Skyhold',sub:'Realm of the Exalted',el:8,tier:3,tree:'golden',special:'pillar',spSolid:1,spGlow:0,
  pal:{g:['#e8d890','#dccc80','#f0e0a0'],det:['#ffffff','#f0c040','#a8d8f8'],path:'#f0f0e8',water:'#60b0f0',deep:'#3a88d0',leaf:'#e0b040',trunk:'#8a6a3a',rock:'#e8e8e0',sp:'#f4f4ec',shore:'#f0e8c0'},
  amb:[1.1,1.05,.92],water:.28,trees:.40,rocks:.04,sp:.05,
  pre:['Gold','Glory','Valor','Sun','Hall','Rune','Bright','Throne']}
];

// ---------- 24 hybrid biomes: two realms + a rare element ----------
const HY=[
 ['Mistmeadow',0,4,'Dewglass','#c8f0ff'],['Emberfield',0,5,'Hearthcoal','#ff9040'],['Gloamwood',1,6,'Twilight Pearl','#c8a0f0'],
 ['Verdant Halls',2,8,'Goldsap','#ffd050'],['Rimeforge',3,5,'Forgefrost','#80e0ff'],['Frostfire Wastes',4,5,'Steam Pearl','#f0f0ff'],
 ['Barrowfen',2,7,'Gravebloom','#a0e080'],['Starhollow',1,8,'Aether Shard','#a0f0ff'],['Deepgreen',2,6,'Rootstone','#60c070'],
 ['Giantsmere',3,0,'Titanbone','#e8dcc0'],['Ashen Reach',5,7,'Soulcinder','#ff5060'],['Wraithwood',1,7,'Ghostlight','#c0ffd0'],
 ['Icemarrow',4,7,'Marrowice','#d0e8ff'],['Runehollow',6,8,'Living Rune','#40f0c0'],['Thunderfells',3,8,'Stormglass','#80a0ff'],
 ['Blossomfire',2,5,'Phoenix Petal','#ff6080'],['Silverfrost',1,4,'Moonrime','#e0e8ff'],['Duskforge',6,5,'Blackflame Ore','#a040ff'],
 ['Wildgiant Steppe',2,3,'Mammoth Ivory','#f0e8d0'],['Shadowmere',6,4,'Abyssal Pearl','#4060c0'],['Hallowed Barrows',8,7,'Seraph Feather','#f8f8ff'],
 ['Sunken Glade',0,2,'Nixie Scale','#40d0b0'],['Shimmerdunes',1,5,'Sunglass','#ffe080'],['Prism Rim',0,8,'Prism Shard','#ff80ff']];
SC.HYBRIDS=HY.map((h,i)=>{const A=SC.REALMS[h[1]],B=SC.REALMS[h[2]];const m=(a,b)=>SC.mix(a,b,.5);
 return {key:'hy'+i,name:h[0],sub:`Where ${A.name} meets ${B.name}`,hybrid:true,a:h[1],b:h[2],rare:h[3],rareCol:h[4],el:A.el,el2:B.el,tier:Math.max(A.tier,B.tier,1)+1,
  tree:A.tree,special:'rare',spSolid:1,spGlow:1,
  pal:{g:A.pal.g.map((c,j)=>m(c,B.pal.g[j])),det:[A.pal.det[0],B.pal.det[1],h[4]],path:m(A.pal.path,B.pal.path),water:m(A.pal.water,B.pal.water),deep:m(A.pal.deep,B.pal.deep),
   leaf:m(A.pal.leaf,B.pal.leaf),trunk:A.pal.trunk,rock:B.pal.rock,sp:h[4],shore:m(A.pal.shore,B.pal.shore)},
  amb:A.amb.map((v,j)=>(v+B.amb[j])/2),water:(A.water+B.water)/2,trees:(A.trees+B.trees)/2,rocks:(A.rocks+B.rocks)/2,sp:.035,
  pre:A.pre.slice(0,4).concat(B.pre.slice(4,8))}});
SC.BIOMES=SC.REALMS.concat(SC.HYBRIDS); // 33 biomes

// ---------- monsters (aggressive creatures) ----------
// shape: hum | quad | blob | bat | wisp | serpent | bird
SC.MONSTERS=[
 {n:'Greyling',s:'hum',c:['#8a8a90','#5a5a60'],hp:7,atk:2,spd:520,r:0},{n:'Wild Boar',s:'quad',c:['#7a5a3a','#4a3420'],hp:10,atk:3,spd:600,r:0},{n:'Moss Slime',s:'blob',c:['#5ad06a','#2f8a3e'],hp:6,atk:2,spd:760,r:0},
 {n:'Light Wisp',s:'wisp',c:['#fff6b0','#f0d060'],hp:6,atk:3,spd:420,r:1},{n:'Thorn Sprite',s:'bat',c:['#a0e0a0','#508050'],hp:5,atk:3,spd:380,r:1},{n:'Pale Stag',s:'quad',c:['#e8e4d8','#a8a498'],hp:12,atk:3,spd:520,r:1},
 {n:'Vine Stalker',s:'serpent',c:['#3a9a2a','#1f6a1a'],hp:10,atk:4,spd:560,r:2},{n:'Bog Lurker',s:'blob',c:['#4a7a5a','#2a4a3a'],hp:13,atk:3,spd:700,r:2},{n:'Wild Hound',s:'quad',c:['#8a6a4a','#5a4030'],hp:11,atk:4,spd:460,r:2},
 {n:'Frost Troll',s:'hum',c:['#7a9aa8','#4a6a78'],hp:20,atk:6,spd:640,r:3},{n:'Rock Crawler',s:'quad',c:['#7a7a70','#4a4a44'],hp:16,atk:4,spd:620,r:3},{n:'Stone Golem',s:'hum',c:['#9a9a92','#6a6a62'],hp:24,atk:5,spd:760,r:3},
 {n:'Mist Wraith',s:'wisp',c:['#d0e0f0','#8aa8c8'],hp:12,atk:5,spd:440,r:4},{n:'Ice Drake',s:'serpent',c:['#a8d8f8','#5a8ab8'],hp:16,atk:6,spd:520,r:4},{n:'Snow Wolf',s:'quad',c:['#f0f0f8','#a8b0c0'],hp:14,atk:5,spd:420,r:4},
 {n:'Fire Imp',s:'hum',c:['#e84a2a','#8a2010'],hp:11,atk:6,spd:460,r:5},{n:'Magma Hound',s:'quad',c:['#ff7a30','#a83a10'],hp:16,atk:6,spd:480,r:5},{n:'Ember Bat',s:'bat',c:['#ff8a3a','#8a3010'],hp:9,atk:5,spd:360,r:5},
 {n:'Cave Spider',s:'quad',c:['#3a3a4a','#1a1a2a'],hp:12,atk:5,spd:440,r:6},{n:'Dark Elf Raider',s:'hum',c:['#5a4a7a','#2a2040'],hp:15,atk:6,spd:500,r:6},{n:'Gloom Bat',s:'bat',c:['#7a4ab0','#3a2060'],hp:9,atk:4,spd:360,r:6},
 {n:'Barrow Wight',s:'hum',c:['#6a7a6a','#3a4a3a'],hp:20,atk:7,spd:600,r:7},{n:'Bone Hound',s:'quad',c:['#e0dccc','#9a968a'],hp:16,atk:7,spd:460,r:7},{n:'Grave Wisp',s:'wisp',c:['#a0f0a0','#40a060'],hp:12,atk:6,spd:420,r:7},
 {n:'Exalted Shade',s:'hum',c:['#f0d070','#a08030'],hp:24,atk:8,spd:540,r:8},{n:'Gold Serpent',s:'serpent',c:['#f0c040','#a07a20'],hp:20,atk:8,spd:500,r:8},{n:'Storm Raven',s:'bird',c:['#3a3a4a','#f0f0f8'],hp:14,atk:8,spd:380,r:8}];
SC.monstersFor=function(bi){const b=SC.BIOMES[bi];if(!b.hybrid)return SC.MONSTERS.map((m,i)=>i).filter(i=>SC.MONSTERS[i].r===bi);
 return SC.MONSTERS.map((m,i)=>i).filter(i=>SC.MONSTERS[i].r===b.a||SC.MONSTERS[i].r===b.b).concat([1000+bi])}; // 1000+bi = rare elemental
SC.monDef=function(id){if(id<1000)return SC.MONSTERS[id];const b=SC.BIOMES[id-1000];return {n:b.rare+' Elemental',s:'wisp',c:[b.rareCol,SC.shade(b.rareCol,-70)],hp:22,atk:8,spd:480,r:-1,rare:true}};

// ---------- NPC kinds: humanoids, creatures, talking structures ----------
// realms: list of realm indices (or 'all')
SC.NPCKINDS=[
 {n:'Farmer',t:'hum',re:[0],c:['#8a6a3a','#5a4020']},{n:'Bard',t:'hum',re:[0,8],c:['#3a6ab8','#24448a']},{n:'Hunter',t:'hum',re:[0,2,3],c:['#4a7a3a','#2a4a20']},
 {n:'Trader',t:'hum',re:'all',c:['#b8863a','#7a5420']},{n:'Light Elf',t:'hum',re:[1],c:['#f0f0d0','#c8c0a0']},{n:'Grove Seer',t:'hum',re:[2],c:['#2a8a6a','#1a5a44']},
 {n:'Giant',t:'hum',re:[3],c:['#8a7a6a','#5a4a3a'],big:1},{n:'Troll',t:'hum',re:[3,4],c:['#6a8a7a','#3a5a4a'],big:1},{n:'Frost Witch',t:'hum',re:[4],c:['#a8c8e8','#6a88a8']},
 {n:'Fire Giant',t:'hum',re:[5],c:['#c84a2a','#7a2010'],big:1},{n:'Dwarf Smith',t:'hum',re:[6,3],c:['#7a4a2a','#4a2a14']},{n:'Dark Elf',t:'hum',re:[6],c:['#4a3a6a','#2a1a40']},
 {n:'Barrow Wight',t:'hum',re:[7,4],c:['#5a6a5a','#2a3a2a']},{n:'Shade',t:'hum',re:[7],c:['#7a7a8a','#4a4a5a']},{n:'Winged Sentinel',t:'hum',re:[8],c:['#e8e8f0','#a0a8c0']},
 {n:'Exalted Knight',t:'hum',re:[8],c:['#d0a040','#8a6a20']},{n:'Wanderer',t:'hum',re:'all',c:['#6a6a7a','#3a3a4a']},{n:'Hermit',t:'hum',re:'all',c:['#7a6a5a','#4a3a2a']},
 {n:'Raven',t:'cre',s:'bird',re:'all',c:['#2a2a34','#14141a']},{n:'Wolf',t:'cre',s:'quad',re:[0,3,4],c:['#7a7a80','#4a4a50']},{n:'Old Bear',t:'cre',s:'quad',re:[0,2],c:['#6a4a2a','#3a2a14']},
 {n:'Elk',t:'cre',s:'quad',re:[0,1],c:['#8a6a4a','#5a4030']},{n:'Serpent',t:'cre',s:'serpent',re:[2,5,7],c:['#4a8a4a','#2a5a2a']},{n:'Owl',t:'cre',s:'bird',re:[1,6],c:['#a8906a','#6a5a40']},
 {n:'Fox',t:'cre',s:'quad',re:[0,2],c:['#e07a2e','#924d1a']},{n:'Salamander',t:'cre',s:'serpent',re:[5],c:['#ff7a30','#a83a10']},{n:'Frost Hare',t:'cre',s:'quad',re:[4],c:['#f0f0f8','#b0b8c8']},
 {n:'Stag of Light',t:'cre',s:'quad',re:[1,8],c:['#fff6c0','#d0c080']},{n:'Grave Hound',t:'cre',s:'quad',re:[7],c:['#4a4a4a','#1a1a1a']},
 {n:'Runestone',t:'str',s:'stone',re:'all',c:['#7a7a82','#4a4a52']},{n:'Shrine',t:'str',s:'shrine',re:'all',c:['#9a7a5a','#6a4a2a']},{n:'Ancient Well',t:'str',s:'well',re:[0,2],c:['#8a8a8a','#5a5a5a']},
 {n:'Talking Tree',t:'str',s:'tree',re:[1,2],c:['#5a3a1a','#2f7a2c']},{n:'Stone Door',t:'str',s:'door',re:[6,3],c:['#6a6a72','#3a3a42']},{n:'Idol',t:'str',s:'idol',re:[5,7],c:['#8a5a3a','#4a2a14']},
 {n:'Bone Throne',t:'str',s:'throne',re:[7],c:['#e0dccc','#8a867a']},{n:'Forge Spirit',t:'str',s:'idol',re:[6,5],c:['#ff9a40','#8a3a10']},{n:'Ice Monolith',t:'str',s:'stone',re:[4],c:['#c8e8ff','#7aa8d8']},
 {n:'Golden Statue',t:'str',s:'statue',re:[8],c:['#f0c040','#a07a20']}];
SC.kindsFor=function(bi){const b=SC.BIOMES[bi];const rs=b.hybrid?[b.a,b.b]:[bi];return SC.NPCKINDS.map((k,i)=>i).filter(i=>{const re=SC.NPCKINDS[i].re;return re==='all'||re.some(r=>rs.includes(r))})};

// ---------- 100 descriptors, each with trait tags ----------
const D='Mad:mad|Greedy:greed|Skillful:wise,pride|Wise:wise|Cowardly:fear|Proud:pride|Generous:kind|Cunning:cunning|Weary:frail,sorrow|Lost:fear,sorrow|Hungry:frail,greed|Curious:wise,mystic|Pious:faith|Vengeful:hostile,pride|Cheerful:kind|Gloomy:sorrow|Ancient:wise,mystic|Young:kind,fear|Wounded:frail,sorrow|Drunk:mad,kind|Honest:kind,faith|Deceitful:cunning|Brave:pride,strong|Fearful:fear|Bored:pride|Lonely:sorrow,kind|Paranoid:fear,hostile|Boastful:pride|Humble:kind,faith|Cursed:mystic,sorrow|Blessed:faith,mystic|Feral:hostile,strong|Noble:pride,kind|Ragged:frail,greed|Scholarly:wise|Superstitious:faith,fear|Lucky:cunning|Unlucky:sorrow,frail|Jealous:greed,hostile|Kind:kind|Cruel:hostile|Silent:mystic|Talkative:kind,cunning|Sleepy:frail|Restless:mad,strong|Grieving:sorrow|Joyful:kind|Stubborn:pride,strong|Gentle:kind,frail|Wrathful:hostile,strong|Melancholy:sorrow,mystic|Mysterious:mystic,cunning|Forgetful:mad|Sharp-eyed:wise,cunning|Clumsy:frail|Graceful:pride,mystic|Haughty:pride,greed|Shy:fear,kind|Bold:strong|Thieving:greed,cunning|Loyal:faith,kind|Treacherous:cunning,hostile|Zealous:faith,hostile|Reclusive:fear,wise|Wandering:wise,sorrow|Exiled:sorrow,pride|Hunted:fear|Haunted:mystic,fear|Starving:frail,greed|Wealthy:greed,pride|Destitute:greed,frail|Ailing:frail|Hardy:strong|Frail:frail|Towering:strong|Tiny:fear,cunning|Scarred:strong,hostile|Painted:mystic,faith|Masked:cunning,mystic|Hooded:cunning|Singing:kind,mad|Weeping:sorrow|Laughing:mad,kind|Whispering:mystic,cunning|Prophetic:mystic,wise|Oathbound:faith,pride|Runebound:mystic|Frost-touched:mystic,strong|Fire-touched:hostile,mystic|Shadow-touched:cunning,mystic|Gilded:greed,pride|Rotting:frail,hostile|Blooming:kind,mystic|Moss-covered:wise,frail|Iron-willed:strong,pride|Bewitched:mad,mystic|Sly:cunning|Pompous:pride,greed|Patient:wise,kind|Hasty:mad,fear';
SC.DESCRIPTORS=D.split('|').map(s=>{const [w,t]=s.split(':');return {w,t:t.split(',')}});
SC.TRAITDISP={hostile:2,greed:.5,pride:.3,cunning:.3,strong:.2,mad:.3,kind:-1.6,faith:-.5,fear:-.4,sorrow:-.6,frail:-.3,wise:-.4,mystic:0};

// ---------- 6 skills ----------
SC.SKILLS=[
 {k:'crafting',n:'Crafting',ic:'⚒',d:'Smelt ore, forge weapons and armour, set gems. Higher levels forge finer metals and appraise items.'},
 {k:'botanist',n:'Botanist',ic:'❦',d:'Identify plants and fungi: their names, Latin names and properties, a little more each level.'},
 {k:'hunter',n:'Hunter',ic:'➶',d:'Identify creatures and specimens, track and tame beasts, and hit harder against monsters.'},
 {k:'geologist',n:'Geologist',ic:'◆',d:'Identify minerals and gems, mine ore, and Dig (level 1). Buried caches glint for experts.'},
 {k:'alchemist',n:'Alchemist',ic:'⚗',d:'Brew potions by dropping one ingredient onto another. Reveals the elements in everything.'},
 {k:'wizardry',n:'Wizardry',ic:'✶',d:'Magic: Blink at level 2, Bamf at level 4. Raises magic and the power of rune-socketed gear.'}];
SC.SKI={};SC.SKILLS.forEach((s,i)=>SC.SKI[s.k]=i);
SC.xpFor=l=>Math.round(25*Math.pow(l+1,1.6));
SC.ACTIONS=[
 {k:'dig',n:'Dig',key:'1',sk:'geologist',lv:1,mp:0,d:'Dig the ground you are standing on.'},
 {k:'blink',n:'Blink',key:'2',sk:'wizardry',lv:2,mp:6,d:'Teleport forward 3–10 tiles (range grows with Wizardry).'},
 {k:'bamf',n:'Bamf',key:'3',sk:'wizardry',lv:4,mp:20,d:'Teleport to anywhere you have explored, taking adjacent players with you.'},
 {k:'potion',n:'Quaff',key:'Q',sk:null,lv:0,mp:0,d:'Drink your best healing potion.'},
 {k:'map',n:'Map',key:'M',sk:null,lv:0,mp:0,d:'Open the world map.'}];

// ---------- 30 encounter responses ----------
// aff: trait → chance modifier. sk: linked skill ('study'/'inspect' resolve per NPC type). for: which NPC types may offer it
SC.RESPONSES=[
 {k:'avoid',l:'Avoid',b:.8,aff:{hostile:-.25},f:'hcs',win:['safe'],lose:['dmg']},
 {k:'attack',l:'Attack',b:.55,aff:{frail:.2,strong:-.15},f:'hcs',win:['first','fight'],lose:['fight']},
 {k:'honor',l:'Honor',b:.45,aff:{pride:.3,faith:.15,hostile:-.2},f:'hs',win:['item','reveal'],lose:['nothing']},
 {k:'aid',l:'Aid',b:.5,aff:{frail:.25,sorrow:.25,kind:.1,hostile:-.3},f:'hc',win:['item','xp'],lose:['dmg']},
 {k:'bargain',l:'Bargain',sk:'crafting',b:.4,aff:{greed:.25,cunning:.1},f:'h',win:['item','gold'],lose:['nothing']},
 {k:'bribe',l:'Bribe',b:.5,aff:{greed:.35,faith:-.2,pride:-.1},f:'h',cost:'gold',win:['safe','reveal'],lose:['loseGold']},
 {k:'deceive',l:'Deceive',b:.35,aff:{mad:.2,frail:.1,wise:-.3,cunning:-.25},f:'h',win:['gold'],lose:['fight']},
 {k:'intimidate',l:'Intimidate',b:.35,aff:{fear:.35,frail:.15,strong:-.3,pride:-.15},f:'hc',win:['gold','safe'],lose:['fight']},
 {k:'flatter',l:'Flatter',b:.4,aff:{pride:.35,greed:.1,wise:-.2},f:'hs',win:['gold','item'],lose:['nothing']},
 {k:'question',l:'Question',b:.5,aff:{wise:.2,kind:.15,mad:-.25},f:'hs',win:['reveal','xpany'],lose:['nothing']},
 {k:'pray',l:'Pray',sk:'wizardry',b:.35,aff:{faith:.35,mystic:.15},f:'s',win:['heal','buff'],lose:['nothing']},
 {k:'steal',l:'Steal',b:.3,aff:{frail:.15,mad:.15,cunning:-.3,fear:.1},f:'hs',win:['item','gold'],lose:['fight','dmg']},
 {k:'trade',l:'Trade',sk:'crafting',b:.55,aff:{greed:.2,kind:.1,hostile:-.3},f:'h',cost:'gold',win:['item'],lose:['loseGold']},
 {k:'heal',l:'Heal',sk:'alchemist',b:.35,aff:{frail:.35,sorrow:.15},f:'hc',cost:'mp',win:['rareitem','xp'],lose:['nothing']},
 {k:'study',l:'Study',sk:'study',b:.4,aff:{mystic:.2,wise:.1},f:'hcs',win:['specimen','xp'],lose:['nothing']},
 {k:'tame',l:'Tame',sk:'hunter',b:.25,aff:{fear:.15,hostile:-.1,frail:.1},f:'c',win:['specimen','xp','buff'],lose:['dmg']},
 {k:'sing',l:'Sing',b:.35,aff:{mad:.25,kind:.15,sorrow:.15},f:'hcs',win:['buff','gold'],lose:['nothing']},
 {k:'riddle',l:'Riddle',sk:'wizardry',b:.35,aff:{wise:.2,mystic:.2,mad:.15},f:'hs',win:['rareitem','xp'],lose:['dmg']},
 {k:'gift',l:'Gift Herbs',sk:'botanist',b:.5,aff:{greed:.2,kind:.2,sorrow:.15},f:'hcs',win:['item','xp'],lose:['nothing']},
 {k:'listen',l:'Listen',b:.55,aff:{sorrow:.25,wise:.15,mystic:.15,hostile:-.25},f:'hcs',win:['reveal','xpany'],lose:['nothing']},
 {k:'mock',l:'Mock',b:.25,aff:{fear:.2,pride:-.35,frail:.1},f:'hc',win:['gold'],lose:['fight']},
 {k:'duel',l:'Duel',b:.4,aff:{pride:.25,strong:-.1,frail:.2},f:'h',win:['gold','item'],lose:['dmg','loseGold']},
 {k:'comfort',l:'Comfort',b:.45,aff:{sorrow:.35,fear:.2,hostile:-.2},f:'hc',win:['item','buff'],lose:['nothing']},
 {k:'bless',l:'Bless',sk:'wizardry',b:.35,aff:{faith:.25,frail:.15},f:'hcs',cost:'mp',win:['item','xp'],lose:['nothing']},
 {k:'inspect',l:'Inspect',sk:'inspect',b:.5,aff:{mystic:.15},f:'s',win:['specimen','reveal','xp'],lose:['dmg']},
 {k:'forage',l:'Share Forage',sk:'botanist',b:.45,aff:{frail:.3,kind:.1,greed:.1},f:'hc',win:['item','xp'],lose:['nothing']},
 {k:'warn',l:'Warn',b:.45,aff:{fear:.25,kind:.1},f:'hc',win:['reveal','gold'],lose:['nothing']},
 {k:'brew',l:'Offer a Brew',sk:'alchemist',b:.4,aff:{mad:.2,sorrow:.15,frail:.15},f:'h',win:['rareitem','xp'],lose:['dmg']},
 {k:'track',l:'Track',sk:'hunter',b:.45,aff:{},f:'c',win:['reveal','specimen','xp'],lose:['nothing']},
 {k:'flee',l:'Flee',b:.7,aff:{strong:-.1},f:'hcs',win:['safe'],lose:['dmg']}];
SC.RESI={};SC.RESPONSES.forEach((r,i)=>SC.RESI[r.k]=i);

SC.OUTCOME={
 avoid:['You give {name} a wide berth, keeping to the shadows until they are well behind you.','You try to slip past, but {name} lunges. Something sharp opens a shallow, stinging gash along your ribs.'],
 attack:['You strike first, and your blade bites deep into {name}\'s shoulder. Blood sprays across the ground as they reel back, snarling, and turn to fight.','{name} sees it coming and twists aside. Steel is drawn on both sides; this ends with one of you bleeding out.'],
 honor:['You bow and speak the old words of respect. {name}\'s hard face softens, and they share something of value.','Your words ring hollow. {name} spits at your feet.'],
 aid:['You help bind {name}\'s wounds, getting their blood to the elbows. Grateful, they press a gift into your sticky palm.','Your help goes badly. In the scramble a blade slips, and it\'s your own flesh that tears.'],
 bargain:['A hard bargain, fairly won. {name} parts with something useful, muttering about thieves.','{name} laughs in your face and turns away.'],
 bribe:['The coin vanishes into {name}\'s keeping. They point you down a hidden trail and forget they ever saw you.','{name} pockets the coin, grins with broken teeth, and gives you nothing.'],
 deceive:['{name} swallows your story whole and pays you for the "favour".','{name} sees straight through the lie, and their hand goes to their knife.'],
 intimidate:['You let {name} see exactly what you\'d do to them. They go pale and hand over what they carry.','{name} isn\'t afraid of you. Not even slightly.'],
 flatter:['Your praise lands. {name} preens like a crow on a corpse, and rewards you.','{name} narrows their eyes at your honeyed words.'],
 question:['{name} answers freely, describing the land around you, and where the bodies are buried.','{name} only mutters nonsense and picks at a scab.'],
 pray:['A warmth floods your veins as {name} accepts your prayer. Your wounds knit closed.','Silence. {name} gives no sign of having heard you.'],
 steal:['Quick fingers! You lift something from {name} without them noticing.','Caught red-handed. {name} grabs your wrist and twists until something cracks.'],
 trade:['Coin changes hands, and {name} passes over something they were carrying.','The trade goes badly; you overpay for worthless junk.'],
 heal:['Your remedy draws the rot out of {name}\'s wound. They give you something rare in thanks.','Your remedy does nothing. The wound only weeps darker.'],
 study:['You study {name} closely, scars, stains and all, and learn a great deal.','{name} won\'t hold still long enough to study.'],
 tame:['{name} settles, sniffs your bloodied hand, and lets you take a shed specimen.','{name} snaps, and its teeth meet in the meat of your forearm before it bolts.'],
 sing:['Your song lifts the spirits of everyone nearby, {name} included.','Your voice cracks. {name} winces and turns away.'],
 riddle:['You answer the riddle of {name}. Something rare is your reward.','Wrong answer. {name} punishes your ignorance, and it hurts.'],
 gift:['{name} accepts your herbs gladly and returns the kindness.','{name} sniffs the herbs and grinds them into the dirt.'],
 listen:['You listen. {name} speaks of paths, ruins and the places where travellers vanish.','{name} falls silent and will say no more.'],
 mock:['Your jeering sends {name} scrambling, dropping coins as they go.','{name} does not appreciate being mocked, and shows you with their fists.'],
 duel:['Steel rings. You open a long cut across {name}\'s arm, and they yield, bleeding, and toss you their purse.','{name} bests you soundly, leaves you bloodied in the dirt, and takes a purse of their own.'],
 comfort:['Your words ease {name}\'s burden. They give you a keepsake.','{name} is beyond comfort today.'],
 bless:['Your blessing settles on {name} like light. They repay it.','The blessing sputters out like a wet torch.'],
 inspect:['You read the seams and old stains on {name}: a story of violence, and a few loose stones worth keeping.','A shard bursts from {name} and slices your palm open.'],
 forage:['You share your forage with {name}, who shows you where better grows.','{name} isn\'t hungry for what you have.'],
 warn:['{name} heeds your warning and repays you with directions.','{name} ignores you.'],
 brew:['{name} drains your brew and gives you something rare in thanks.','The brew disagrees with {name}. They vomit blood, and blame you for it.'],
 track:['You read the blood trail around {name} and find where it has been feeding.','The trail is cold.'],
 flee:['You run, lungs burning, and {name} lets you go.','You stumble as you flee, and {name} drags you down by the leg before you tear free.']};

// ---------- scenario text (16+) ----------
SC.SCEN={
 hum:['{name} is hunched over a campfire, roasting something that may once have walked on two legs.','{name} blocks the path, leaning on a {weapon} still tacky with someone else\'s blood.','{name} is arguing loudly with a corpse propped against a tree.',
  '{name} kneels beside an overturned cart. The driver lies face-down nearby, an arrow through the neck, and {plant} is spilled everywhere.','{name} is carving marks into a fallen log, one for every kill.','{name} counts coins on a flat stone. Some are still red at the edges.',
  '{name} stands beneath a gibbet where a crow-picked body turns in the wind.','{name} tends a small patch of {plant}, fertilised with something you\'d rather not think about.','{name} sharpens a {weapon} with slow, deliberate strokes, watching you the whole time.',
  '{name} sits beneath a tree with a fresh {creature} skull in their lap, still scraping it clean.','{name} stops mid-song, blood drying on their knuckles.','{name} has set a snare. Something in it is still twitching.'],
 cre:['{name} lifts its muzzle from a half-eaten carcass, gore dripping from its jaws, and watches you.','{name} circles you slowly, sniffing the blood on your boots.','{name} is caught in a bramble thicket, thrashing, its hide torn and bleeding.',
  '{name} guards a nest ringed with gnawed bones.','{name} drinks from a pool clouded red; something died in it recently.','{name} stares at you with uncanny intelligence. When it speaks, its voice is low and wet.'],
 str:['{name} hums faintly, runes pulsing along its face. Old blood is baked into the grooves.','{name}, half sunk in the earth, is crusted with {mineral} and dark stains. A voice grinds from within the stone.','{name} is ringed with offerings: coins, bones, a severed hand, a sprig of {plant}.',
  'Moss parts across {name} to reveal two glowing eyes and a mouth full of broken teeth.','{name} speaks in the voice of the wind through {realm}, and the wind smells of rot.']};
SC.INTENT={
 friendly:['They want to trade a little of what they carry for something from your pack.','They ask for help: someone they love went missing near here, and they fear the worst.','They offer to share what they know of the paths through {realm}, and which ones not to take.',
  'They are starving, and quietly ask if you have anything to spare.','They want company and a story, and someone to watch their back tonight.','They seek a blessing before a long and dangerous road.'],
 neutral:['They demand to know your business in {realm}.','They are guarding something, and their hand never leaves their weapon.','They propose a wager: a contest of wits, or first blood.',
  'They want a toll for passage, and they\'ve clearly collected it the hard way before.','They claim the {plant} here belongs to them.','They test every traveller who passes. The last one failed; you can see what\'s left of them.'],
 hostile:['They mean to cut your purse, and your throat if you resist.','They intend to drive you out of {realm}, and leave you face-down in a ditch.','They hunger for a fight, and they want to see you bleed.',
  'They believe you killed one of theirs, and they want blood for blood.','They want your {weapon}, and they will take it off your corpse if they have to.'],
 str:['It asks for an offering. Blood will do.','It poses a question and awaits an answer. Bones of those who answered wrong lie at its base.','It warns of slaughter ahead.','It hungers for blood.','It offers knowledge, for a price paid in pain.']};
SC.RARITY=['Common','Uncommon','Rare','Epic','Legendary','Mythic','Worldborn'];
SC.RARCOL=['#d8d0c0','#6fdc8c','#5ab0ff','#c070ff','#ffb040','#ff5a7a','#7affd8'];
SC.RARMUL=[1,1.15,1.32,1.55,1.85,2.2,2.7];
// rarity rises with distance from the world's centre
SC.rollRarity=function(R,dist,bonus){const k=2.3/(1+dist/220)-(bonus||0)*.15;let w=[],t=0;for(let i=0;i<7;i++){const v=Math.exp(-i*Math.max(.35,k));w.push(v);t+=v}let r=R()*t;for(let i=0;i<7;i++){r-=w[i];if(r<=0)return i}return 0};
SC.levelAt=(x,y)=>1+Math.floor(SC.dist(x,y)/45);
})();

// ---------- abilities: 10 per skill, scaling with level (L) ----------
(function(){const SC=globalThis.SC;
const A=(sk,lv,k,n,act,mp,cd,d)=>({sk,lv,k,n,act:!!act,mp:mp||0,cd:cd||0,d});
SC.ABILITIES=[
 A('crafting',1,'appraise','Appraise',0,0,0,L=>`See the true gold value of items (+${L*3}% when selling).`),
 A('crafting',2,'smithing','Smithing',0,0,0,L=>'Smelt ore onto ore into ingots, and forge ingots onto patterns.'),
 A('crafting',4,'salvage','Salvage',0,0,0,L=>'Break weapons and armour back into ingots (button in item details). Any set gem is returned.'),
 A('crafting',6,'gemcutter','Gemcutter',0,0,0,L=>'Setting a gem also raises the item\'s quality by 10.'),
 A('crafting',8,'reforge','Reforge',0,0,0,L=>'Spend one matching ingot to re-roll an item\'s quality, with a chance of higher rarity.'),
 A('crafting',10,'masterwork','Masterwork',0,0,0,L=>`Forged items gain +${5+L} quality and roll higher rarity.`),
 A('crafting',15,'runesmith','Runesmith',0,0,0,L=>'Gear can hold a second gem.'),
 A('crafting',20,'alloying','Alloying',0,0,0,L=>'Drop an ingot onto a different ingot to make an ingot of the next metal tier.'),
 A('crafting',25,'satchel','Tinker\'s Satchel',0,0,0,L=>'+12 inventory slots.'),
 A('crafting',30,'legendforge','Legendary Forge',0,0,0,L=>'Everything you forge is at least Epic.'),
 A('botanist',1,'floralore','Flora Lore',0,0,0,L=>'Identify plants and fungi.'),
 A('botanist',2,'forager','Forager',0,0,0,L=>`${20+L*2}% chance to harvest two plants at once.`),
 A('botanist',4,'poultice','Poultice',1,0,8,L=>`Crush one plant from your bag into a poultice: heal ${6+L*3}.`),
 A('botanist',6,'senseflora','Sense Flora',0,0,0,L=>'Plants show on your minimap.'),
 A('botanist',8,'masterdyer','Master Dyer',0,0,0,L=>'Your dyes come out richer and more vivid.'),
 A('botanist',10,'thornward','Thornward',1,8,45,L=>`For 60s, anything that strikes you takes ${Math.ceil(L/2)} damage back.`),
 A('botanist',15,'verdant','Verdant Stride',0,0,0,L=>'+10% movement speed.'),
 A('botanist',20,'seedcall','Seedcall',1,10,180,L=>'Call 2–4 wild plants of the land you stand in into your bag.'),
 A('botanist',25,'lifebloom','Lifebloom',0,0,0,L=>`Regenerate ${(L*.15).toFixed(1)} extra health per second.`),
 A('botanist',30,'ancientherb','Ancient Herbalism',0,0,0,L=>'Brews made from two plants gain +1 rarity and 20% potency.'),
 A('hunter',1,'beastlore','Beast Lore',0,0,0,L=>'Identify creatures and specimens.'),
 A('hunter',2,'tracker','Tracker',0,0,0,L=>'Monsters show their level and health from farther away, and on your minimap.'),
 A('hunter',4,'skinning','Skinning',0,0,0,L=>`+${L*2}% chance of extra specimens from kills.`),
 A('hunter',6,'bleed','Serrated Strike',1,0,12,L=>`Your next 3 hits make the target bleed for ${(L*.8+1).toFixed(1)} damage a second.`),
 A('hunter',8,'fleetfoot','Fleet Foot',0,0,0,L=>'+10% movement speed.'),
 A('hunter',10,'mark','Hunter\'s Mark',1,4,20,L=>'Mark the nearest monster: it takes 30% more damage from you for 20s.'),
 A('hunter',15,'ambush','Ambush',0,0,0,L=>'Hits against unwounded monsters deal double damage.'),
 A('hunter',20,'volley','Volley',1,6,12,L=>'Strike every monster within 3 tiles for 70% of your attack.'),
 A('hunter',25,'apex','Apex Predator',0,0,0,L=>`+${Math.floor(L/2)} attack.`),
 A('hunter',30,'beastlord','Beastlord',0,0,0,L=>'Monsters five or more levels below you will not attack you.'),
 A('geologist',1,'stonelore','Stone Lore',0,0,0,L=>'Identify minerals and gems. Dig (key 1).'),
 A('geologist',2,'prospector','Prospector',0,0,0,L=>`Buried caches glint from ${1+L*2} tiles away.`),
 A('geologist',4,'stoneskin','Stoneskin',1,6,60,L=>`+${L} armour for 60s.`),
 A('geologist',6,'richveins','Rich Veins',0,0,0,L=>'+1 ore every time you mine.'),
 A('geologist',8,'gemfinder','Gemfinder',0,0,0,L=>`+${L*2}% chance of a gem when mining.`),
 A('geologist',10,'tunnel','Tunnel',1,5,3,L=>'Smash through the rock in front of you.'),
 A('geologist',15,'seismic','Seismic Sense',1,10,60,L=>`Reveal the land within ${12+L} tiles.`),
 A('geologist',20,'transmute','Transmute Stone',0,0,0,L=>'Turn a mineral into another mineral, gem or ore (button in item details).'),
 A('geologist',25,'quake','Earthshaker',1,14,15,L=>`Monsters within 2 tiles take ${Math.round(L*2.5)} damage.`),
 A('geologist',30,'mountainheart','Heart of the Mountain',0,0,0,L=>`+${Math.floor(L/2)} armour.`),
 A('alchemist',1,'elementlore','Element Lore',0,0,0,L=>'See the elements in things. Drop one ingredient onto another to brew.'),
 A('alchemist',2,'steadyhands','Steady Hands',0,0,0,L=>`Brews gain +${L*6} quality.`),
 A('alchemist',4,'distill','Distill',0,0,0,L=>'Drop a potion onto an identical potion to distil one stronger potion.'),
 A('alchemist',6,'potionlore','Potion Lore',0,0,0,L=>`Potions heal ${L*5}% more.`),
 A('alchemist',8,'flask','Volatile Flask',1,0,6,L=>`Hurl a potion from your bag: it bursts for ${8+L*3} damage around the target.`),
 A('alchemist',10,'transmutation','Transmutation',0,0,0,L=>'Drop ore onto a potion to turn it into ore of the next metal tier.'),
 A('alchemist',15,'elixirmastery','Elixir Mastery',0,0,0,L=>'Potion effects last twice as long.'),
 A('alchemist',20,'philosopher','Philosopher\'s Draught',1,0,600,L=>'Fully restore health and magic.'),
 A('alchemist',25,'catalyst','Catalyst',0,0,0,L=>'Every brew yields two potions.'),
 A('alchemist',30,'quicksilver','Quicksilver Veins',0,0,0,L=>'+15% movement speed.'),
 A('wizardry',2,'blink','Blink',1,6,1,L=>`Teleport forward up to ${Math.min(12,3+L-2)} tiles.`),
 A('wizardry',4,'bamf','Bamf',1,20,10,L=>'Teleport anywhere you have explored, taking adjacent players with you.'),
 A('wizardry',4,'heal','Heal',1,8,4,L=>`Instantly heal ${10+L*4}.`),
 A('wizardry',6,'tentcraft','Tentcraft',0,0,0,L=>`Enlarge your tent with a consumable and an ore (up to ${3+2*Math.floor((L-2)/4)}×${3+2*Math.floor((L-2)/4)} at this level).`),
 A('wizardry',10,'mending','Mending',1,14,20,L=>`Heal ${(2+L*.6).toFixed(1)} every second for 20 seconds.`),
 A('wizardry',15,'bolt','Arcane Bolt',1,6,1.2,L=>`A bolt hits the first monster ahead within 7 tiles for ${8+L*3}.`),
 A('wizardry',20,'ward','Ward',1,18,30,L=>`A shield absorbs the next ${L*4} damage (60s).`),
 A('wizardry',25,'chain','Chain Lightning',1,20,8,L=>`Lightning arcs to up to 3 monsters within 5 tiles for ${Math.round(6+L*2.5)} each.`),
 A('wizardry',30,'timeslip','Time Slip',1,15,30,L=>`Move 60% faster for ${10+Math.floor(L/3)} seconds.`),
 A('wizardry',35,'starfall','Starfall',1,35,20,L=>`Stars fall 3 tiles ahead: ${15+L*4} damage to all within 3 tiles.`)];
SC.ABI={};SC.ABILITIES.forEach(a=>SC.ABI[a.k]=a);
SC.hasAb=(sk,k)=>{const a=SC.ABI[k];return a&&(sk[SC.SKI[a.sk]]|0)>=a.lv};
// ---------- spellcraft aspects (unlocked when every skill is level 2) ----------
// W = Wizardry level. cost = magic cost contribution.
SC.ASPECTS=[
 {k:'heal',n:'Mend Flesh',cost:6,d:W=>`Heal ${6+W*2}.`},
 {k:'mana',n:'Draw Aether',cost:0,d:W=>`Restore ${4+W} magic (but costs health instead).`},
 {k:'bolt',n:'Bolt',cost:5,el:true,d:W=>`Hit the first monster ahead (7 tiles) for ${5+W*2}.`},
 {k:'nova',n:'Nova',cost:8,el:true,d:W=>`Burst for ${Math.round(4+W*1.5)} damage to monsters within 2 tiles.`},
 {k:'bleed',n:'Haemorrhage',cost:4,d:W=>`Your next 2 hits cause bleeding (${(1+W*.5).toFixed(1)}/s).`},
 {k:'haste',n:'Haste',cost:6,d:W=>W>=20?`+${20+W}% speed for 15s, and +1% speed permanently (up to +30%).`:`+${20+W}% speed for 15s. (Permanent gains at Wizardry 20.)`},
 {k:'armour',n:'Ironhide',cost:5,d:W=>`+${2+W} armour for 45s.`},
 {k:'might',n:'Fury',cost:5,d:W=>`+${2+Math.ceil(W/2)} attack for 45s.`},
 {k:'veil',n:'Veil',cost:6,d:W=>`Monsters ignore you for ${20+W}s.`},
 {k:'sight',n:'Farsight',cost:5,d:W=>`Reveal the land within ${8+W} tiles.`},
 {k:'light',n:'Lantern',cost:3,d:W=>`+3 sight for ${60+W*5}s.`},
 {k:'blink',n:'Step',cost:5,d:W=>`Teleport ${3+Math.floor(W/4)} tiles forward.`},
 {k:'ward',n:'Aegis',cost:8,d:W=>`Absorb ${W*3+5} damage.`},
 {k:'thorns',n:'Thorns',cost:5,d:W=>`Attackers take ${1+Math.ceil(W/2)} damage for 45s.`},
 {k:'grow',n:'Bloom',cost:6,d:W=>'Call a wild plant of this land into your bag.'},
 {k:'transmute',n:'Transmute',cost:8,d:W=>'The selected item, if it is rock, ore, mineral or gem, becomes a different inorganic object.'},
 {k:'dye',n:'Chromatic',cost:3,el:true,d:W=>'Recolour the selected gear in the chosen element\'s hue.'}];
SC.ASI={};SC.ASPECTS.forEach(a=>SC.ASI[a.k]=a);
SC.SKILLS.forEach(s=>{s.d=s.d.replace('Blink at level 2, Bamf at level 4','Blink, Bamf, Heal, Mending and spells up to level 35')});
})();
