# Idle Guild of Exiles

A browser-based idle management prototype inspired by Path of Exile's economy and crafting systems. Players recruit a guild of heroes, assign them to map runs, and manage loot, stash tabs, and crafting currency without direct combat.

## Features

- **Guild Roster:** Recruit up to five heroes across classic Path of Exile archetypes. The active hero drives inventory, map assignments, and stat panels.
- **Inventory Panel:** View the currently selected hero's 12x5 grid inventory layout styled after ARPG backpack systems.
- **Shared Stash:** Manage ten customizable tabs. Double-click a tab header to rename it and track loot packages generated from completed maps.
- **Crafting Materials:** Track core currency items with space reserved for future crafting interactions.
- **Map Operations:** Assign the active hero to thematic maps, watch progress tick in real time, and claim rewards to earn hero experience, currency, and stash loot.
- **Stat Overview:** Inspect offensive and defensive derived stats for the selected hero, including level progression.

## Getting Started

This prototype is implemented with vanilla JavaScript modules—no build step is required. To run the game locally:

1. Serve the project root with any static file server (e.g., `python -m http.server 8000`).
2. Open `http://localhost:8000` in a modern browser.
3. Recruit your first hero from the Guild panel and start mapping!

> **Note:** Since there is no bundler or backend, ensure you access the app over HTTP (not the `file://` protocol) so ES module imports load correctly.

## Project Structure

```
index.html          # Entry point
styles/             # Global styling (dark ARPG theme)
src/
  app.js            # Application bootstrap
  data/             # Static data definitions (hero classes, defaults)
  modules/          # UI panels for each window (guild, stash, maps, etc.)
  state/            # Centralized store with game state and actions
  ui/               # DOM utilities and modal helper
```

## Next Steps

- Implement drag-and-drop interactions between inventory and stash.
- Expand loot generation with item rarity, affixes, and crafting hooks.
- Introduce background job scheduling so multiple heroes can run maps simultaneously.
- Persist game state using local storage.

Contributions and design iterations are welcome as we continue building out the idle Path of Exile experience.
