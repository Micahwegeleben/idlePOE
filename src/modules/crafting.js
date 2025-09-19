import { subscribe } from "../state/store.js";
import { createElement, clearChildren } from "../ui/dom.js";

export class CraftingPanel {
  constructor() {
    this.element = createElement("div", { className: "panel", attrs: { "data-area": "crafting" } });
    this.element.appendChild(createElement("h2", { text: "Crafting Materials" }));
    this.content = createElement("div", { className: "currency-grid" });
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
    if (!state.currency || state.currency.length === 0) {
      this.content.appendChild(
        createElement("div", {
          className: "empty-state",
          text: "No currency stored yet. Map rewards will accumulate here.",
        }),
      );
      return;
    }
    state.currency.forEach((currency) => {
      const tile = createElement("div", { className: "currency-tile" });
      tile.appendChild(createElement("div", { html: `<strong>${currency.name}</strong>` }));
      tile.appendChild(createElement("div", { text: `x${currency.amount}` }));
      this.content.appendChild(tile);
    });
  }
}
