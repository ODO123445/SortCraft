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
| WASD / arrows | Move |
| Space or E | Talk, attack, open, mine, pick up, enter tents |
| 1 / 2 / 3 | Dig / Blink / Bamf |
| Q | Drink best healing potion |
| 4–8 | Quick slots (abilities and spells) |
| G | Tent |
| B | Spellbook |
| I / J / K / M | Inventory / Compendium / Skills / Map |
| T | Chat |
| Mouse wheel, + / − | Zoom |
| Esc | Close windows / Settings |

## Publish on GitHub Pages

1. Create a new repository on GitHub (it can be public or, on paid plans, private) and upload every file in this folder, keeping the `css/` and `js/` folders.
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
- `js/ui.js`, `js/powers.js`, `js/main.js`: interface, abilities and tents, and the game loop with networking
