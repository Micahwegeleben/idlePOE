import {
  HERO_CLASSES,
  DEFAULT_STASH_TABS,
  DEFAULT_CURRENCY,
  DEFAULT_MAPS,
  STASH_COLUMNS,
  STASH_ROWS,
} from "../data/constants.js";
import { EQUIPMENT_SLOTS, rollLoot } from "./loot.js";

const MAX_GUILD_SIZE = 5;
const STASH_SIZE = STASH_COLUMNS * STASH_ROWS;

// Temporary debug helper to shorten how long map runs take.
const DEBUG_MAP_DURATION_SECONDS = 5;

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
  EQUIPMENT_SLOTS.forEach((slot) => {
    equipment[slot.id] = null;
  });
  return equipment;
};

const itemAllowsSlot = (item, slotId) =>
  Array.isArray(item?.allowedSlots) && item.allowedSlots.includes(slotId);

const isTwoHanded = (item) => (item?.hands ?? 0) === 2;

const canEquipItemInSlot = (hero, item, slotId) => {
  if (!hero || !item) return false;
  if (!itemAllowsSlot(item, slotId)) return false;
  const equipment = hero.equipment ?? {};
  if (slotId === "mainHand") {
    if (equipment.mainHand) return false;
    if (isTwoHanded(item) && equipment.offHand) return false;
    return true;
  }
  if (slotId === "offHand") {
    if (equipment.offHand) return false;
    if (equipment.mainHand && isTwoHanded(equipment.mainHand)) return false;
    return true;
  }
  if (slotId === "quiver") {
    if (equipment.quiver) return false;
    if (!equipment.mainHand || !equipment.mainHand.allowsQuiver) return false;
    return true;
  }
  return !equipment[slotId];
};

const equipItemOnHero = (hero, item, slotId) => {
  if (!canEquipItemInSlot(hero, item, slotId)) return null;
  const equipment = { ...hero.equipment, [slotId]: item };
  let quiverToReturn = null;
  if (slotId === "mainHand") {
    if (isTwoHanded(item)) {
      equipment.offHand = null;
    }
    if (hero.equipment.quiver && !item.allowsQuiver) {
      quiverToReturn = hero.equipment.quiver;
      equipment.quiver = null;
    }
  }
  return { equipment, quiverToReturn };
};

const removeItemFromHero = (hero, slotId) => {
  const existing = hero.equipment[slotId];
  if (!existing) return null;
  const equipment = { ...hero.equipment, [slotId]: null };
  let quiverToReturn = null;
  if (slotId === "mainHand" && hero.equipment.quiver) {
    quiverToReturn = hero.equipment.quiver;
    equipment.quiver = null;
  }
  return { equipment, item: existing, quiverToReturn };
};

const takeItemFromTab = (tab, index) => {
  const parsedIndex = Number.parseInt(index, 10);
  if (Number.isNaN(parsedIndex) || parsedIndex < 0 || parsedIndex >= tab.grid.length) {
    return null;
  }
  const item = tab.grid[parsedIndex];
  if (!item) return null;
  const newGrid = tab.grid.slice();
  newGrid[parsedIndex] = null;
  return { item, newGrid, index: parsedIndex };
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
    duration: DEBUG_MAP_DURATION_SECONDS,
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
  crafting: {
    benchItem: null,
    benchSource: null,
    selectedMaterialId: null,
    lastCraftSummary: null,
  },
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

const getActiveHero = () => state.guild.find((h) => h.id === state.activeHeroId);

const getHeroById = (heroId) => state.guild.find((h) => h.id === heroId);

const findTabById = (tabId) => state.stash.tabs.find((entry) => entry.id === tabId);

const insertItemIntoGrid = (grid, item, preferredIndex) => {
  const newGrid = grid.slice();
  if (
    preferredIndex != null &&
    preferredIndex >= 0 &&
    preferredIndex < newGrid.length &&
    newGrid[preferredIndex] === null
  ) {
    newGrid[preferredIndex] = item;
    return { grid: newGrid, index: preferredIndex };
  }
  const emptyIndex = newGrid.findIndex((cell) => cell === null);
  if (emptyIndex === -1) {
    return null;
  }
  newGrid[emptyIndex] = item;
  return { grid: newGrid, index: emptyIndex };
};

const placeItemInStash = (item, { preferredTabId, preferredIndex } = {}) => {
  if (!item) return false;
  const preferredTab = preferredTabId ? findTabById(preferredTabId) : null;
  const orderedTabs = [];
  const seen = new Set();
  if (preferredTab) {
    orderedTabs.push(preferredTab);
    seen.add(preferredTab.id);
  }
  state.stash.tabs.forEach((tab) => {
    if (!seen.has(tab.id)) {
      orderedTabs.push(tab);
      seen.add(tab.id);
    }
  });

  for (const tab of orderedTabs) {
    const attempt = insertItemIntoGrid(tab.grid, item, tab === preferredTab ? preferredIndex ?? null : null);
    if (attempt) {
      state.stash.tabs = state.stash.tabs.map((entry) =>
        entry.id === tab.id ? { ...entry, grid: attempt.grid } : entry,
      );
      return true;
    }
  }
  return false;
};

const commitHeroEquipment = (hero, equipment) => {
  const updatedHero = updateHeroStats({ ...hero, equipment });
  state.guild = state.guild.map((h) => (h.id === hero.id ? updatedHero : h));
  return updatedHero;
};

const countEmptyStashSlots = () =>
  state.stash.tabs.reduce(
    (total, tab) => total + tab.grid.filter((cell) => cell === null).length,
    0,
  );

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
    const hero = getActiveHero();
    if (!hero) {
      alert("Select a hero before equipping items.");
      return;
    }
    const tab = findTabById(tabId);
    if (!tab) return;
    const parsedIndex = Number.parseInt(fromIndex, 10);
    if (Number.isNaN(parsedIndex) || parsedIndex < 0 || parsedIndex >= tab.grid.length) return;
    const item = tab.grid[parsedIndex];
    if (!item) return;
    const equipResult = equipItemOnHero(hero, item, slotId);
    if (!equipResult) {
      alert("This item cannot be equipped in that slot right now.");
      return;
    }
    const removal = takeItemFromTab(tab, parsedIndex);
    if (!removal) return;
    state.stash.tabs = state.stash.tabs.map((entry) =>
      entry.id === tab.id ? { ...entry, grid: removal.newGrid } : entry,
    );
    const updatedHero = commitHeroEquipment(hero, equipResult.equipment);
    if (equipResult.quiverToReturn) {
      const placed = placeItemInStash(equipResult.quiverToReturn, {
        preferredTabId: tab.id,
        preferredIndex: removal.index,
      });
      if (!placed) {
        alert("Stash is full. Unable to store the unequipped quiver.");
      }
    }
    if (updatedHero.id === state.activeHeroId) {
      state.activeHeroId = updatedHero.id;
    }
    notify();
  },
  unequipItemToStash(slotId) {
    const hero = getActiveHero();
    if (!hero) return;
    let requiredSlots = 1;
    if (slotId === "mainHand" && hero.equipment.quiver) {
      requiredSlots += 1;
    }
    if (countEmptyStashSlots() < requiredSlots) {
      alert("Stash is full. Free up space before unequipping.");
      return;
    }
    const removal = removeItemFromHero(hero, slotId);
    if (!removal) return;
    const targetTabId = state.stash.activeTabId;
    const placed = placeItemInStash(removal.item, { preferredTabId: targetTabId });
    if (!placed) {
      alert("Stash is full. Unable to unequip this item.");
      return;
    }
    const updatedHero = commitHeroEquipment(hero, removal.equipment);
    if (removal.quiverToReturn) {
      const placedQuiver = placeItemInStash(removal.quiverToReturn, { preferredTabId: targetTabId });
      if (!placedQuiver) {
        alert("Stash is full. Unable to store the quiver.");
      }
    }
    if (updatedHero.id === state.activeHeroId) {
      state.activeHeroId = updatedHero.id;
    }
    notify();
  },
  placeItemInBenchFromStash(tabId, fromIndex) {
    if (state.crafting.benchItem) {
      alert("The crafting bench is already holding an item.");
      return;
    }
    const tab = findTabById(tabId);
    if (!tab) return;
    const removal = takeItemFromTab(tab, fromIndex);
    if (!removal) return;
    state.stash.tabs = state.stash.tabs.map((entry) =>
      entry.id === tab.id ? { ...entry, grid: removal.newGrid } : entry,
    );
    state.crafting = {
      ...state.crafting,
      benchItem: removal.item,
      benchSource: { type: "stash", tabId: tab.id, index: removal.index },
      lastCraftSummary: null,
    };
    notify();
  },
  placeItemInBenchFromEquipment(slotId) {
    if (state.crafting.benchItem) {
      alert("The crafting bench is already holding an item.");
      return;
    }
    const hero = getActiveHero();
    if (!hero) {
      alert("Select a hero before moving equipment to the crafting bench.");
      return;
    }
    if (slotId === "mainHand" && hero.equipment.quiver && countEmptyStashSlots() < 1) {
      alert("Stash is full. Free up a slot before moving this weapon to the bench.");
      return;
    }
    const removal = removeItemFromHero(hero, slotId);
    if (!removal) return;
    const updatedHero = commitHeroEquipment(hero, removal.equipment);
    if (removal.quiverToReturn) {
      const placedQuiver = placeItemInStash(removal.quiverToReturn, {
        preferredTabId: state.stash.activeTabId,
      });
      if (!placedQuiver) {
        alert("Stash is full. Unable to store the quiver.");
      }
    }
    state.crafting = {
      ...state.crafting,
      benchItem: removal.item,
      benchSource: { type: "equipment", slotId, heroId: updatedHero.id },
      lastCraftSummary: null,
    };
    notify();
  },
  returnBenchItem() {
    const { benchItem, benchSource } = state.crafting;
    if (!benchItem) return;
    let returned = false;
    if (benchSource?.type === "stash") {
      returned = placeItemInStash(benchItem, {
        preferredTabId: benchSource.tabId,
        preferredIndex: benchSource.index,
      });
    } else if (benchSource?.type === "equipment") {
      const hero = getHeroById(benchSource.heroId);
      if (hero) {
        const equipResult = equipItemOnHero(hero, benchItem, benchSource.slotId);
        if (equipResult) {
          const updatedHero = commitHeroEquipment(hero, equipResult.equipment);
          if (equipResult.quiverToReturn) {
            const placed = placeItemInStash(equipResult.quiverToReturn, {
              preferredTabId: state.stash.activeTabId,
            });
            if (!placed) {
              alert("Stash is full. Unable to store the quiver.");
            }
          }
          if (updatedHero.id === state.activeHeroId) {
            state.activeHeroId = updatedHero.id;
          }
          returned = true;
        }
      }
      if (!returned) {
        returned = placeItemInStash(benchItem, { preferredTabId: state.stash.activeTabId });
      }
    } else {
      returned = placeItemInStash(benchItem, { preferredTabId: state.stash.activeTabId });
    }
    if (!returned) {
      alert("Stash is full. Unable to remove the item from the crafting bench.");
      return;
    }
    state.crafting = {
      ...state.crafting,
      benchItem: null,
      benchSource: null,
    };
    notify();
  },
  setSelectedCraftingMaterial(materialId) {
    if (!materialId) {
      state.crafting = { ...state.crafting, selectedMaterialId: null };
      notify();
      return;
    }
    const material = state.currency.find((entry) => entry.id === materialId);
    if (!material) {
      state.crafting = { ...state.crafting, selectedMaterialId: null };
      notify();
      return;
    }
    state.crafting = { ...state.crafting, selectedMaterialId: materialId };
    notify();
  },
  craftBenchItem() {
    const { benchItem, selectedMaterialId } = state.crafting;
    if (!benchItem) {
      alert("Place an item in the crafting bench before crafting.");
      return;
    }
    if (!selectedMaterialId) {
      alert("Select a crafting material first.");
      return;
    }
    const material = state.currency.find((entry) => entry.id === selectedMaterialId);
    if (!material || material.amount <= 0) {
      alert("You do not have any of that crafting material available.");
      return;
    }
    state.currency = state.currency.map((entry) =>
      entry.id === material.id ? { ...entry, amount: entry.amount - 1 } : entry,
    );
    state.crafting = {
      ...state.crafting,
      lastCraftSummary: {
        materialId: material.id,
        materialName: material.name,
        itemId: benchItem.id,
        itemName: benchItem.name,
        timestamp: Date.now(),
      },
    };
    notify();
  },
  startMap(mapId, heroId) {
    const hero = state.guild.find((h) => h.id === heroId);
    if (!hero) {
      alert("Select a hero before starting a map.");
      return;
    }
    const runningMap = state.maps.find(
      (entry) => entry.status === "running" && entry.assignedHeroId === heroId,
    );
    if (runningMap) {
      alert(`${hero.name} is already running another map.`);
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
        duration: DEBUG_MAP_DURATION_SECONDS,
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
            duration: DEBUG_MAP_DURATION_SECONDS,
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
            duration: DEBUG_MAP_DURATION_SECONDS,
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
