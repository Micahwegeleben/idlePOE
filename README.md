# Idle Guild of Exiles

A browser-based idle management prototype inspired by Path of Exile's economy and crafting systems. Players recruit a guild of heroes, assign them to map runs, and manage loot, stash tabs, and crafting currency without direct combat.

## Features

- **Guild Roster:** Recruit up to five heroes across classic Path of Exile archetypes. The active hero drives equipment, map assignments, and stat panels.
- **Equipment Loadouts:** Gear each hero across fourteen dedicated slots (helm, armour, jewellery, weapons, and accessories) with drag-and-drop support from the stash.
- **Shared Stash:** Organize loot across ten customizable tabs using a grid-based storage layout that mirrors ARPG stash pages.
- **Dynamic Loot:** Complete maps to earn randomised common, magic, and rare items with procedurally rolled affixes alongside currency rewards.
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

- Expand loot pools with more base types, affixes, and implicit modifiers.
- Introduce background job scheduling so multiple heroes can run maps simultaneously.
- Persist game state using local storage.

Contributions and design iterations are welcome as we continue building out the idle Path of Exile experience.
