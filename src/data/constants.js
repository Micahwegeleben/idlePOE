export const HERO_CLASSES = [
  {
    id: "marauder",
    name: "Marauder",
    description: "Strength-focused juggernaut thriving on raw power and endurance.",
    baseStats: { life: 60, energyShield: 0, armour: 12, evasion: 6, damage: 5 },
  },
  {
    id: "ranger",
    name: "Ranger",
    description: "Agile hunter wielding bows and traps with deadly precision.",
    baseStats: { life: 50, energyShield: 0, armour: 6, evasion: 14, damage: 6 },
  },
  {
    id: "witch",
    name: "Witch",
    description: "Master of the arcane arts commanding elemental and chaos power.",
    baseStats: { life: 48, energyShield: 20, armour: 4, evasion: 8, damage: 7 },
  },
  {
    id: "duelist",
    name: "Duelist",
    description: "Hybrid fighter dancing between blades and agility based defenses.",
    baseStats: { life: 55, energyShield: 0, armour: 10, evasion: 10, damage: 6 },
  },
  {
    id: "templar",
    name: "Templar",
    description: "Devout spellblade balancing divine spells with martial prowess.",
    baseStats: { life: 54, energyShield: 12, armour: 8, evasion: 6, damage: 6 },
  },
];

export const DEFAULT_STASH_TABS = Array.from({ length: 10 }, (_, index) => ({
  id: `tab-${index + 1}`,
  name: `Tab ${index + 1}`,
  items: [],
}));

export const DEFAULT_CURRENCY = [
  { id: "transmutation", name: "Orb of Transmutation", amount: 20 },
  { id: "alchemy", name: "Orb of Alchemy", amount: 12 },
  { id: "chaos", name: "Chaos Orb", amount: 4 },
  { id: "exalted", name: "Exalted Orb", amount: 1 },
  { id: "scouring", name: "Orb of Scouring", amount: 8 },
  { id: "binding", name: "Orb of Binding", amount: 16 },
];

export const DEFAULT_MAPS = [
  {
    id: "dunes",
    name: "Dunes Map",
    tier: 1,
    baseDuration: 120,
    description: "A serene desert hideout overrun by corrupted wildlife.",
  },
  {
    id: "jungle-valley",
    name: "Jungle Valley Map",
    tier: 3,
    baseDuration: 180,
    description: "Dense overgrowth concealing primal terrors and hidden caches.",
  },
  {
    id: "glacier",
    name: "Glacier Map",
    tier: 5,
    baseDuration: 240,
    description: "Frozen cliffs echoing with the whispers of ancient exiles.",
  },
];
