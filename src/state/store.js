import { HERO_CLASSES, DEFAULT_STASH_TABS, DEFAULT_CURRENCY, DEFAULT_MAPS } from "../data/constants.js";

const MAX_GUILD_SIZE = 5;
const INVENTORY_COLUMNS = 12;
const INVENTORY_ROWS = 5;

const clone = (value) => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const createEmptyInventory = () =>
  Array.from({ length: INVENTORY_COLUMNS * INVENTORY_ROWS }, () => null);

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
    inventory: createEmptyInventory(),
    equipment: {
      weapon: null,
      offhand: null,
      helmet: null,
      bodyArmour: null,
      gloves: null,
      boots: null,
      belt: null,
      amulet: null,
      ring1: null,
      ring2: null,
    },
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
    tabs: DEFAULT_STASH_TABS.map((tab) => ({ ...tab })),
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

    // Drop placeholder loot into the active stash tab.
    const lootLabel = `${map.name} Spoils (${new Date().toLocaleTimeString()})`;
    state.stash.tabs = state.stash.tabs.map((tab) =>
      tab.id === state.stash.activeTabId
        ? {
            ...tab,
            items: [...tab.items, { id: generateId(), name: lootLabel }],
          }
        : tab,
    );

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
