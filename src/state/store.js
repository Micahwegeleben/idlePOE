import {
  HERO_CLASSES,
  DEFAULT_STASH_TABS,
  DEFAULT_CURRENCY,
  DEFAULT_MAPS,
  STASH_COLUMNS,
  STASH_ROWS,
} from "../data/constants.js";
import { ITEM_TYPES, rollLoot } from "./loot.js";

const MAX_GUILD_SIZE = 5;
const STASH_SIZE = STASH_COLUMNS * STASH_ROWS;

const clone = (value) => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const createEmptyStashGrid = () => Array.from({ length: STASH_SIZE }, () => null);

const createEmptyEquipment = () => {
  const equipment = {};
  ITEM_TYPES.forEach((item) => {
    equipment[item.id] = null;
  });
  return equipment;
};

const deriveHeroStats = (hero) => {
  const base = HERO_CLASSES.find((cls) => cls.id === hero.classId)?.baseStats ?? {};
  return {
    level: hero.level,
    experience: hero.experience,
    experienceToNext: hero.experienceToNext,
    life: Math.round((base.life ?? 50) * (1 + (hero.level - 1) * 0.08)),
    energyShield: Math.round((base.energyShield ?? 0) * (1 + (hero.level - 1) * 0.09)),
    armour: Math.round((base.armour ?? 5) * (1 + (hero.level - 1) * 0.12)),
    evasion: Math.round((base.evasion ?? 5) * (1 + (hero.level - 1) * 0.11)),
    damage: Math.round((base.damage ?? 5) * (1 + (hero.level - 1) * 0.1)),
  };
};

const createHero = (classId, name) => {
  const classDef = HERO_CLASSES.find((cls) => cls.id === classId);
  const displayName = name?.trim() || classDef?.name || "Hero";
  return {
    id: generateId(),
    name: displayName,
    classId,
    level: 1,
    experience: 0,
    experienceToNext: 100,
    equipment: createEmptyEquipment(),
    stats: {},
  };
};

const initializeMaps = () =>
  DEFAULT_MAPS.map((map) => ({
    ...map,
    status: "idle",
    assignedHeroId: null,
    startedAt: null,
    duration: map.baseDuration,
    progress: 0,
  }));

const initialState = {
  guild: [],
  activeHeroId: null,
  stash: {
    tabs: DEFAULT_STASH_TABS.map((tab) => ({
      ...tab,
      grid: createEmptyStashGrid(),
    })),
    activeTabId: DEFAULT_STASH_TABS[0].id,
  },
  currency: DEFAULT_CURRENCY.map((currency) => ({ ...currency })),
  maps: initializeMaps(),
};

initialState.guild = initialState.guild.map((hero) => ({
  ...hero,
  stats: deriveHeroStats(hero),
}));

const subscribers = new Set();

const notify = () => {
  const snapshot = getState();
  subscribers.forEach((listener) => listener(snapshot));
};

export const subscribe = (listener) => {
  subscribers.add(listener);
  listener(getState());
  return () => subscribers.delete(listener);
};

export const getState = () => clone(state);

const updateHeroStats = (hero) => ({
  ...hero,
  stats: deriveHeroStats(hero),
});

const state = clone(initialState);

const heroNameCounts = new Map();

const assignHeroName = (classId) => {
  const classDef = HERO_CLASSES.find((cls) => cls.id === classId);
  const baseName = classDef ? classDef.name : "Exile";
  const count = (heroNameCounts.get(classId) ?? 0) + 1;
  heroNameCounts.set(classId, count);
  return `${baseName} ${count}`;
};

export const actions = {
  createHero(classId) {
    if (!classId) return;
    if (state.guild.length >= MAX_GUILD_SIZE) {
      alert("Guild is full. Retire a hero before recruiting another.");
      return;
    }
    const hero = createHero(classId, assignHeroName(classId));
    const enriched = updateHeroStats(hero);
    state.guild = [...state.guild, enriched];
    state.activeHeroId = hero.id;
    notify();
  },
  selectHero(heroId) {
    state.activeHeroId = heroId;
    notify();
  },
  renameStashTab(tabId, newName) {
    state.stash.tabs = state.stash.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, name: newName.trim() || tab.name } : tab,
    );
    notify();
  },
  setActiveStashTab(tabId) {
    state.stash.activeTabId = tabId;
    notify();
  },
  moveStashItem(tabId, fromIndex, toIndex) {
    const source = Number.parseInt(fromIndex, 10);
    const target = Number.parseInt(toIndex, 10);
    if (Number.isNaN(source) || Number.isNaN(target)) return;
    if (source === target) return;
    const tab = state.stash.tabs.find((entry) => entry.id === tabId);
    if (!tab) return;
    if (source < 0 || source >= tab.grid.length) return;
    if (target < 0 || target >= tab.grid.length) return;
    const item = tab.grid[source];
    if (!item) return;
    if (tab.grid[target]) return;
    const newGrid = tab.grid.slice();
    newGrid[source] = null;
    newGrid[target] = item;
    state.stash.tabs = state.stash.tabs.map((entry) =>
      entry.id === tabId ? { ...entry, grid: newGrid } : entry,
    );
    notify();
  },
  equipItemFromStash(tabId, fromIndex, slotId) {
    const hero = state.guild.find((h) => h.id === state.activeHeroId);
    if (!hero) {
      alert("Select a hero before equipping items.");
      return;
    }
    const tab = state.stash.tabs.find((entry) => entry.id === tabId);
    if (!tab) return;
    const index = Number.parseInt(fromIndex, 10);
    if (Number.isNaN(index) || index < 0 || index >= tab.grid.length) return;
    const item = tab.grid[index];
    if (!item) return;
    if (item.type !== slotId) {
      alert("This item cannot be equipped in that slot.");
      return;
    }
    if (hero.equipment[slotId]) {
      alert("That equipment slot is already occupied. Unequip the current item first.");
      return;
    }
    const newGrid = tab.grid.slice();
    newGrid[index] = null;
    const newEquipment = { ...hero.equipment, [slotId]: item };
    state.stash.tabs = state.stash.tabs.map((entry) =>
      entry.id === tabId ? { ...entry, grid: newGrid } : entry,
    );
    state.guild = state.guild.map((h) =>
      h.id === hero.id ? { ...h, equipment: newEquipment } : h,
    );
    notify();
  },
  moveEquipmentItemToStash(slotId, tabId, targetIndex) {
    const hero = state.guild.find((h) => h.id === state.activeHeroId);
    if (!hero) return;
    const item = hero.equipment[slotId];
    if (!item) return;
    const tab = state.stash.tabs.find((entry) => entry.id === tabId);
    if (!tab) return;
    const index = Number.parseInt(targetIndex, 10);
    if (Number.isNaN(index) || index < 0 || index >= tab.grid.length) return;
    if (tab.grid[index]) return;
    const newGrid = tab.grid.slice();
    newGrid[index] = item;
    const newEquipment = { ...hero.equipment, [slotId]: null };
    state.stash.tabs = state.stash.tabs.map((entry) =>
      entry.id === tabId ? { ...entry, grid: newGrid } : entry,
    );
    state.guild = state.guild.map((h) =>
      h.id === hero.id ? { ...h, equipment: newEquipment } : h,
    );
    notify();
  },
  startMap(mapId, heroId) {
    const hero = state.guild.find((h) => h.id === heroId);
    if (!hero) {
      alert("Select a hero before starting a map.");
      return;
    }
    state.maps = state.maps.map((map) => {
      if (map.id !== mapId) return map;
      if (map.status === "running") return map;
      return {
        ...map,
        status: "running",
        assignedHeroId: heroId,
        startedAt: Date.now(),
        progress: 0,
      };
    });
    notify();
  },
  completeMap(mapId) {
    const map = state.maps.find((entry) => entry.id === mapId);
    if (!map || map.status !== "completed") return;

    const hero = state.guild.find((h) => h.id === map.assignedHeroId);
    if (hero) {
      hero.experience += 30 + map.tier * 10;
      if (hero.experience >= hero.experienceToNext) {
        hero.level += 1;
        hero.experience -= hero.experienceToNext;
        hero.experienceToNext = Math.round(hero.experienceToNext * 1.35);
      }
      const updatedHero = updateHeroStats(hero);
      state.guild = state.guild.map((h) => (h.id === hero.id ? updatedHero : h));
    }

    // Currency rewards scale lightly with map tier.
    state.currency = state.currency.map((currency) => {
      if (currency.id === "chaos") {
        return { ...currency, amount: currency.amount + Math.max(1, Math.round(map.tier / 2)) };
      }
      if (currency.id === "alchemy") {
        return { ...currency, amount: currency.amount + Math.max(1, Math.floor(map.tier / 3)) };
      }
      return currency;
    });

    const activeTabId = state.stash.activeTabId;
    const lootDrops = rollLoot(map.tier);
    let overflow = false;

    state.stash.tabs = state.stash.tabs.map((tab) => {
      if (tab.id !== activeTabId) {
        return tab;
      }
      const newGrid = tab.grid.slice();
      lootDrops.forEach((item) => {
        const slotIndex = newGrid.findIndex((cell) => cell === null);
        if (slotIndex === -1) {
          overflow = true;
          return;
        }
        newGrid[slotIndex] = item;
      });
      return { ...tab, grid: newGrid };
    });

    if (overflow) {
      alert("The active stash tab is full. Some items could not be stored.");
    }

    state.maps = state.maps.map((entry) =>
      entry.id === mapId
        ? {
            ...entry,
            status: "idle",
            assignedHeroId: null,
            startedAt: null,
            progress: 0,
          }
        : entry,
    );
    notify();
  },
  resetMap(mapId) {
    state.maps = state.maps.map((map) =>
      map.id === mapId
        ? {
            ...map,
            status: "idle",
            assignedHeroId: null,
            startedAt: null,
            progress: 0,
          }
        : map,
    );
    notify();
  },
  tickMaps() {
    const now = Date.now();
    let changed = false;
    state.maps = state.maps.map((map) => {
      if (map.status !== "running" || !map.startedAt) return map;
      const elapsed = (now - map.startedAt) / 1000;
      const progress = Math.min(100, Math.round((elapsed / map.duration) * 100));
      if (progress !== map.progress) {
        changed = true;
      }
      if (progress >= 100) {
        return {
          ...map,
          status: "completed",
          progress: 100,
        };
      }
      return { ...map, progress };
    });
    if (changed) notify();
  },
};

setInterval(() => {
  actions.tickMaps();
}, 1000);
