import { ITEM_TYPES } from "../state/loot.js";
import { actions, subscribe } from "../state/store.js";
import { createElement, clearChildren } from "../ui/dom.js";
import { parseDragData } from "../ui/drag.js";
import { buildItemTooltip } from "../ui/items.js";

const SLOT_LABELS = ITEM_TYPES.reduce((map, slot) => {
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

    ITEM_TYPES.forEach((slot) => {
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

      slotElement.addEventListener("dragover", (event) => {
        const payload = parseDragData(event);
        if (!payload || equippedItem) return;
        if (payload.type === "stash-item" && payload.itemType === slot.id) {
          event.preventDefault();
          slotElement.classList.add("drag-over");
        }
      });

      slotElement.addEventListener("dragleave", () => {
        slotElement.classList.remove("drag-over");
      });

      slotElement.addEventListener("drop", (event) => {
        const payload = parseDragData(event);
        slotElement.classList.remove("drag-over");
        if (!payload || equippedItem) return;
        if (payload.type === "stash-item" && payload.itemType === slot.id) {
          event.preventDefault();
          actions.equipItemFromStash(payload.tabId, payload.index, slot.id);
        }
      });

      if (equippedItem) {
        const itemElement = createElement("div", {
          className: `equipment-item rarity-${equippedItem.rarity ?? "common"}`,
          text: equippedItem.name,
          attrs: { draggable: "true" },
        });
        itemElement.title = buildItemTooltip(equippedItem);
        itemElement.addEventListener("dragstart", (event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(
            "application/json",
            JSON.stringify({
              type: "equipment-item",
              slotId: slot.id,
              itemType: equippedItem.type,
            }),
          );
        });
        slotElement.appendChild(itemElement);
      } else {
        const hint = createElement("div", {
          className: "slot-hint",
          text: "Drag matching loot here",
        });
        slotElement.appendChild(hint);
      }

      grid.appendChild(slotElement);
    });

    this.content.appendChild(grid);
  }
}
