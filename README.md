# SortCraft

A browser RPG about exploring outward, collecting and sorting. The world is generated from a seed and grows forever in every direction. Biomes get stranger, deadlier and richer the farther you go from the World Tree.

**Rated 16+:** fantasy violence and blood (blood can be switched off in Settings).

## Play

Open the GitHub Pages site for this repository (see *Publish* below). No install or account needed.

- **Host:** type a name, pick or roll a seed, then **Create & host**. Your browser runs the world.
- **Invite:** open **Settings → Multiplayer** and send the invite code (it looks like `SEED.abcd1234`) to friends.
- **Join:** friends open the same site, paste the code under **Join a friend**, and they're in.

The world only exists while the host has it open, so keep the host's tab open (and preferably in front). Each player's character, inventory, compendium and explored map are saved in their own browser. **Settings → Saves → Export** downloads a save file; **Load save file…** on the title screen restores it.

### Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move (walk into a low rock to jump over it) |
| Left click | Walk to a tile; clicking a creature, NPC, chest, ore or tent walks there and uses it |
| Middle-drag | Pan the view (middle-click or Home to recentre) |
| Space or E | Talk, attack, open, mine, pick up, enter tents |
| 1 / 2 / 3 | Dig / Blink / Bamf |
| Q | Drink best healing potion |
| 4–8 | Quick slots (abilities and spells) |
| G | Tent |
| R | Tame the creature you face (once it's below half health) |
| P | Companions |
| L | Appearance editor |
| F5 | Console |
| B | Spellbook |
| I / J / K / M | Inventory / Compendium / Skills / Map |
| T | Chat |
| Mouse wheel, + / − | Zoom |
| Esc | Close windows / Settings |

## Features at a glance

- Infinite seeded world; creature levels run from 1 to 9001, rising with distance from the World Tree.
- Tame any creature (a host setting), then name it, recolour it and keep up to 12 companions.
- Appearance editor: hue, saturation, brightness and pixel painting on front/back/side, up to 3 pixels past the sprite's edge.
- Readable items (scrolls, journals, Wisppers) with rich text: `[c=#ff8800]colour[/c]`, `[c=red]…[/c]`, `[b]`, `[i]`, `[h]heading[/h]`, `[br]` or new lines. Sign to seal the words forever.
- Tents with storage furniture inside (chest, crate, barrel, wardrobe).
- Biome mist and ambient music that crossfade as you travel (music fades over about 20 seconds; default volume 15%).
- Terrain: forests, trees and bushes can be walked through at half speed; water too, but it costs 5% of your health every second (molten streams in the Emberwaste, 20%). Half-height rocks can be jumped; full boulders cannot.
- Sight radius is 1.5× your base sight by day and 1.25× by night.

## Editing names and biomes

The `data/` folder holds CSV exports of every name in the game (items, biomes, creatures, NPC kinds, the 100 NPC name adjectives, encounter responses, skills, abilities and more), plus `biomes.csv` with every biome setting. Edit them in any spreadsheet app and send them back to have the changes built into the game. The game doesn't read these files directly yet.

## Publish on GitHub Pages

1. Create a new repository on GitHub (it can be public or, on paid plans, private) and upload every file in this folder, keeping the `css/`, `js/` and `audio/` folders. The web uploader takes up to 100 files at a time; if it complains, upload the `audio/` folder in a second batch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, choose the `main` branch and the `/ (root)` folder, then **Save**.
4. After a minute or two the site appears at `https://<your-username>.github.io/<repository-name>/`. Share that link with friends.

## How multiplayer works

Players find each other through the free public [PeerJS](https://peerjs.com) broker, then connect **directly, browser to browser** (WebRTC). The host's browser runs the monsters, chests, NPCs and encounters and streams them to everyone else. No game server is needed.

- Most home networks connect fine. A few strict corporate or mobile networks block direct connections; if a friend can't connect, add a TURN relay in `js/config.js`.
- To avoid relying on the public broker, run your own [PeerServer](https://github.com/peers/peerjs-server) and put its address in `js/config.js`.

## Files

- `index.html`, `css/style.css`: page and interface
- `js/config.js`: network settings
- `js/core.js`, `js/data.js`, `js/items.js`: utilities, realms, creatures, encounters, abilities, item database
- `js/world.js`, `js/host.js`: infinite world generation and the host simulation
- `js/icons.js`, `js/render.js`: item icons and the WebGL renderer
- `js/extras.js`: new creatures, portraits, appearance editing, readable text, mist and music
- `js/ui.js`, `js/ui2.js`, `js/powers.js`, `js/main.js`: interface, abilities and tents, and the game loop with networking
- `audio/`: biome music

## Credits

- Music: **Ars Sonor** (the `.ogg` tracks in `audio/`). Check the licence the tracks were released under before publishing, and keep this credit.
- Fonts: Averia Serif Libre and MedievalSharp (Google Fonts).
- Multiplayer: [PeerJS](https://peerjs.com) over WebRTC.
