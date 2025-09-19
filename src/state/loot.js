const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const ITEM_TYPES = [
  { id: "helmet", label: "Helmet" },
  { id: "chest", label: "Chest Armour" },
  { id: "ring", label: "Ring" },
  { id: "amulet", label: "Amulet" },
  { id: "belt", label: "Belt" },
  { id: "sword", label: "Sword" },
  { id: "wand", label: "Wand" },
  { id: "bow", label: "Bow" },
  { id: "axe", label: "Axe" },
  { id: "mace", label: "Mace" },
  { id: "staff", label: "Staff" },
  { id: "shield", label: "Shield" },
  { id: "boots", label: "Boots" },
  { id: "gloves", label: "Gloves" },
];

const PREFIX_TEMPLATES = [
  {
    name: "Stalwart",
    roll: (tier) => `+${randomInt(12, 18 + tier * 3)} Armour`,
  },
  {
    name: "Savage",
    roll: (tier) => `+${randomInt(4, 6 + tier)} to Physical Damage`,
  },
  {
    name: "Glimmering",
    roll: (tier) => `+${randomInt(18, 26 + tier * 4)} Energy Shield`,
  },
  {
    name: "Fleet",
    roll: (tier) => `+${randomInt(3, 5 + Math.ceil(tier / 2))}% Movement Speed`,
  },
  {
    name: "Arcane",
    roll: (tier) => `+${randomInt(6, 9 + tier)}% Spell Damage`,
  },
];

const SUFFIX_TEMPLATES = [
  {
    name: "of the Fox",
    roll: (tier) => `+${randomInt(16, 24 + tier * 3)} Evasion`,
  },
  {
    name: "of the Giant",
    roll: (tier) => `+${randomInt(25, 40 + tier * 6)} Maximum Life`,
  },
  {
    name: "of Flames",
    roll: (tier) => `+${randomInt(10, 15 + tier * 2)}% Fire Resistance`,
  },
  {
    name: "of Frost",
    roll: (tier) => `+${randomInt(10, 15 + tier * 2)}% Cold Resistance`,
  },
  {
    name: "of Precision",
    roll: (tier) => `+${randomInt(5, 8 + tier)}% Critical Strike Chance`,
  },
];

const RARE_NAME_PREFIXES = [
  "Vicious",
  "Gilded",
  "Empyrean",
  "Ghastly",
  "Arcane",
  "Ancient",
];

const RARE_NAME_SUFFIXES = [
  "Hope",
  "Ritual",
  "Legion",
  "Oath",
  "Bastion",
  "Legacy",
];

const chooseAndRemove = (array) => {
  if (array.length === 0) return null;
  const index = randomInt(0, array.length - 1);
  return array.splice(index, 1)[0];
};

const generateAffixes = (templates, count, tier) => {
  const pool = [...templates];
  const affixes = [];
  for (let i = 0; i < count; i += 1) {
    const template = chooseAndRemove(pool);
    if (!template) break;
    affixes.push({ name: template.name, stat: template.roll(tier) });
  }
  return affixes;
};

const determineRarity = (tier) => {
  const weights = {
    rare: 1 + tier,
    magic: 5 + tier * 1.5,
    common: 12,
  };
  const total = weights.rare + weights.magic + weights.common;
  const roll = Math.random() * total;
  if (roll < weights.rare) return "rare";
  if (roll < weights.rare + weights.magic) return "magic";
  return "common";
};

const buildMagicName = (baseLabel, prefixes, suffixes) => {
  const prefixName = prefixes[0]?.name ?? "";
  const suffixName = suffixes[0]?.name ?? "";
  if (prefixName && suffixName) {
    return `${prefixName} ${baseLabel} ${suffixName}`;
  }
  if (prefixName) {
    return `${prefixName} ${baseLabel}`;
  }
  if (suffixName) {
    return `${baseLabel} ${suffixName}`;
  }
  return `Enchanted ${baseLabel}`;
};

const buildRareName = (baseLabel) => {
  const prefix = RARE_NAME_PREFIXES[randomInt(0, RARE_NAME_PREFIXES.length - 1)];
  const suffix = RARE_NAME_SUFFIXES[randomInt(0, RARE_NAME_SUFFIXES.length - 1)];
  return `${prefix} ${suffix} ${baseLabel}`;
};

const generateItemId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const createRandomItem = (mapTier) => {
  const base = ITEM_TYPES[randomInt(0, ITEM_TYPES.length - 1)];
  const rarity = determineRarity(mapTier);

  let prefixCount = 0;
  let suffixCount = 0;

  if (rarity === "magic") {
    prefixCount = Math.random() < 0.5 ? 1 : 0;
    suffixCount = Math.random() < 0.5 ? 1 : 0;
    if (prefixCount === 0 && suffixCount === 0) {
      prefixCount = 1;
    }
  } else if (rarity === "rare") {
    prefixCount = randomInt(1, 3);
    suffixCount = randomInt(1, 3);
  }

  const prefixes = generateAffixes(PREFIX_TEMPLATES, prefixCount, mapTier);
  const suffixes = generateAffixes(SUFFIX_TEMPLATES, suffixCount, mapTier);
  const stats = [...prefixes, ...suffixes].map((affix) => affix.stat);

  let name = base.label;
  if (rarity === "magic") {
    name = buildMagicName(base.label, prefixes, suffixes);
  } else if (rarity === "rare") {
    name = buildRareName(base.label);
  } else {
    name = `Simple ${base.label}`;
  }

  return {
    id: generateItemId(),
    type: base.id,
    baseLabel: base.label,
    rarity,
    name,
    stats,
    prefixes,
    suffixes,
  };
};

export const rollLoot = (mapTier) => {
  const minDrops = 1;
  const maxDrops = Math.max(2, Math.ceil(mapTier / 2) + 2);
  const dropCount = randomInt(minDrops, maxDrops);
  return Array.from({ length: dropCount }, () => createRandomItem(mapTier));
};

export { ITEM_TYPES };
