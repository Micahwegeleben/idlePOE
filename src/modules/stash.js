import { STASH_COLUMNS } from "../data/constants.js";
import { EQUIPMENT_SLOTS } from "../state/loot.js";
import { actions, subscribe } from "../state/store.js";
import { createElement, clearChildren } from "../ui/dom.js";
import { buildItemTooltip, openItemOptionsTooltip, closeItemTooltip } from "../ui/items.js";

const SLOT_LABELS = EQUIPMENT_SLOTS.reduce((map, slot) => {
  map[slot.id] = slot.label;
  return map;
}, {});

const evaluateEquipSlot = (hero, item, slotId) => {
  if (!hero || !item) {
    return { allowed: false, hint: "Select a hero first." };
  }
  if (!Array.isArray(item.allowedSlots) || !item.allowedSlots.includes(slotId)) {
    return { allowed: false, hint: "Incompatible slot." };
  }
  const equipment = hero.equipment ?? {};
  if (slotId === "mainHand") {
    if (equipment.mainHand) {
      return { allowed: false, hint: "Main hand is occupied." };
    }
    if ((item.hands ?? 0) === 2 && equipment.offHand) {
      return { allowed: false, hint: "Off-hand must be empty." };
    }
    return { allowed: true };
  }
  if (slotId === "offHand") {
    if (equipment.offHand) {
      return { allowed: false, hint: "Off-hand is occupied." };
    }
    if (equipment.mainHand && (equipment.mainHand.hands ?? 0) === 2) {
      return { allowed: false, hint: "Main hand item uses both hands." };
    }
    return { allowed: true };
  }
  if (slotId === "quiver") {
    if (equipment.quiver) {
      return { allowed: false, hint: "Quiver slot is occupied." };
    }
    if (!equipment.mainHand || !equipment.mainHand.allowsQuiver) {
      return { allowed: false, hint: "Requires a bow equipped." };
    }
    return { allowed: true };
  }
  if (equipment[slotId]) {
    return { allowed: false, hint: "Slot is already occupied." };
  }
  return { allowed: true };
};

export class StashPanel {
  constructor() {
    this.element = createElement("div", { className: "panel", attrs: { "data-area": "stash" } });
    this.element.appendChild(createElement("h2", { text: "Stash" }));
    this.tabsContainer = createElement("div", { className: "stash-tabs" });
    this.itemsContainer = createElement("div", { className: "stash-items" });
    this.element.appendChild(this.tabsContainer);
    this.element.appendChild(this.itemsContainer);
    this.unsubscribe = null;
  }

  mount() {
    if (this.unsubscribe) return;
    this.unsubscribe = subscribe((state) => this.render(state));
  }

  unmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  render(state) {
    clearChildren(this.tabsContainer);
    closeItemTooltip();
    const { tabs, activeTabId } = state.stash;

    tabs.forEach((tab) => {
      const tabElement = createElement("div", {
        className: `stash-tab${tab.id === activeTabId ? " active" : ""}`,
        text: tab.name,
      });
      tabElement.addEventListener("click", () => actions.setActiveStashTab(tab.id));
      tabElement.addEventListener("dblclick", () => {
        const newName = prompt("Rename stash tab", tab.name);
        if (newName !== null) {
          actions.renameStashTab(tab.id, newName);
        }
      });
      this.tabsContainer.appendChild(tabElement);
    });

    clearChildren(this.itemsContainer);
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab) {
      this.itemsContainer.appendChild(
        createElement("div", {
          className: "empty-state",
          text: "Select a stash tab to view stored loot.",
        }),
      );
      return;
    }

    const grid = createElement("div", { className: "stash-grid" });
    grid.style.setProperty("--stash-columns", String(STASH_COLUMNS));

    const isTabEmpty = activeTab.grid.every((cell) => cell === null);

    activeTab.grid.forEach((item, index) => {
      const slot = createElement("div", {
        className: `stash-slot${item ? " filled" : ""}`,
        attrs: { "data-slot": index },
      });

      if (item) {
        const itemElement = createElement("div", {
          className: `stash-item rarity-${item.rarity ?? "common"}`,
          text: item.name,
        });
        itemElement.title = buildItemTooltip(item);
        itemElement.addEventListener("click", (event) => {
          event.stopPropagation();
          const hero = state.guild.find((h) => h.id === state.activeHeroId);
          const benchOccupied = Boolean(state.crafting?.benchItem);
          let equipOptions = [];
          if (hero) {
            equipOptions = (item.allowedSlots ?? []).map((slotId) => {
              const evaluation = evaluateEquipSlot(hero, item, slotId);
              return {
                label: `Equip (${SLOT_LABELS[slotId] ?? slotId})`,
                disabled: !evaluation.allowed,
                hint: evaluation.allowed ? undefined : evaluation.hint,
                onSelect: () => actions.equipItemFromStash(activeTab.id, index, slotId),
              };
            });
            if (equipOptions.length === 0) {
              equipOptions.push({
                label: "Equip",
                disabled: true,
                hint: "This item cannot be equipped by the current hero.",
              });
            }
          } else {
            equipOptions = [
              {
                label: "Equip",
                disabled: true,
                hint: "Select a hero to equip items.",
              },
            ];
          }

          openItemOptionsTooltip({
            anchor: itemElement,
            item,
            options: [
              ...equipOptions,
              {
                label: "Place in crafting bench",
                disabled: benchOccupied,
                hint: benchOccupied ? "Bench already contains an item." : undefined,
                onSelect: () => actions.placeItemInBenchFromStash(activeTab.id, index),
              },
            ],
          });
        });
        slot.appendChild(itemElement);
      }

      grid.appendChild(slot);
    });

    this.itemsContainer.appendChild(grid);

    if (isTabEmpty) {
      this.itemsContainer.appendChild(
        createElement("div", {
          className: "empty-state subtle",
          text: "This stash tab is empty. Complete maps to discover loot, then click items to manage them.",
        }),
      );
    }
  }
}
