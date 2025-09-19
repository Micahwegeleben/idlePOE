import { subscribe } from "../state/store.js";
import { createElement, clearChildren } from "../ui/dom.js";

export class InventoryPanel {
  constructor() {
    this.element = createElement("div", { className: "panel", attrs: { "data-area": "inventory" } });
    this.element.appendChild(createElement("h2", { text: "Inventory" }));
    this.content = createElement("div");
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
          text: "Select a hero from the guild to view their equipment and items.",
        }),
      );
      return;
    }

    const grid = createElement("div", { className: "inventory-grid" });
    hero.inventory.forEach((item, index) => {
      const slot = createElement("div", {
        className: `inventory-slot${item ? " has-item" : ""}`,
        attrs: { "data-slot": index },
      });
      if (item) {
        slot.title = item.name;
      }
      grid.appendChild(slot);
    });

    this.content.appendChild(grid);
  }
}
