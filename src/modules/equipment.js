import { EQUIPMENT_SLOTS } from "../state/loot.js";
import { actions, subscribe } from "../state/store.js";
import { createElement, clearChildren } from "../ui/dom.js";
import { buildItemTooltip, openItemOptionsTooltip, closeItemTooltip } from "../ui/items.js";

const SLOT_LABELS = EQUIPMENT_SLOTS.reduce((map, slot) => {
  map[slot.id] = slot.label;
  return map;
}, {});

export class EquipmentPanel {
  constructor() {
    this.element = createElement("div", { className: "panel", attrs: { "data-area": "equipment" } });
    this.element.appendChild(createElement("h2", { text: "Equipment" }));
    this.content = createElement("div", { className: "equipment-content" });
    this.element.appendChild(this.content);
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
    clearChildren(this.content);
    closeItemTooltip();
    const hero = state.guild.find((h) => h.id === state.activeHeroId);

    if (!hero) {
      this.content.appendChild(
        createElement("div", {
          className: "empty-state",
          text: "Select a hero to manage their equipment.",
        }),
      );
      return;
    }

    const grid = createElement("div", { className: "equipment-grid" });

    const stashHasSpace = state.stash.tabs.some((tab) => tab.grid.some((cell) => cell === null));
    const benchOccupied = Boolean(state.crafting?.benchItem);
    const mainHandItem = hero.equipment.mainHand;
    const mainHandIsTwoHanded = Boolean(mainHandItem && (mainHandItem.hands ?? 0) === 2);
    const mainHandAllowsQuiver = Boolean(mainHandItem?.allowsQuiver);

    EQUIPMENT_SLOTS.forEach((slot) => {
      const equippedItem = hero.equipment[slot.id];
      const slotElement = createElement("div", {
        className: `equipment-slot${equippedItem ? " filled" : ""}`,
        attrs: { "data-slot": slot.id },
      });

      const label = createElement("div", {
        className: "slot-label",
        text: SLOT_LABELS[slot.id] ?? slot.label,
      });
      slotElement.appendChild(label);

      if (equippedItem) {
        const itemElement = createElement("div", {
          className: `equipment-item rarity-${equippedItem.rarity ?? "common"}`,
          text: equippedItem.name,
        });
        itemElement.title = buildItemTooltip(equippedItem);
        itemElement.addEventListener("click", (event) => {
          event.stopPropagation();
          openItemOptionsTooltip({
            anchor: itemElement,
            item: equippedItem,
            options: [
              {
                label: "Unequip to stash",
                disabled: !stashHasSpace,
                hint: stashHasSpace ? undefined : "No space available in stash.",
                onSelect: () => actions.unequipItemToStash(slot.id),
              },
              {
                label: "Move to crafting bench",
                disabled: benchOccupied,
                hint: benchOccupied ? "Bench already contains an item." : undefined,
                onSelect: () => actions.placeItemInBenchFromEquipment(slot.id),
              },
            ],
          });
        });
        slotElement.appendChild(itemElement);
      } else {
        const hint = createElement("div", {
          className: "slot-hint",
          text:
            slot.id === "offHand" && mainHandIsTwoHanded
              ? "Main hand item requires both hands."
              : slot.id === "quiver" && !mainHandAllowsQuiver
              ? "Equip a bow to use a quiver."
              : "Click stash items to equip.",
        });
        slotElement.appendChild(hint);
      }

      grid.appendChild(slotElement);
    });

    this.content.appendChild(grid);
  }
}
