import { actions, subscribe } from "../state/store.js";
import { createElement, clearChildren } from "../ui/dom.js";

export class StashPanel {
  constructor() {
    this.element = createElement("div", { className: "panel", attrs: { "data-area": "stash" } });
    this.element.appendChild(createElement("h2", { text: "Stash" }));
    this.tabsContainer = createElement("div", { className: "stash-tabs" });
    this.itemsContainer = createElement("div", { className: "stash-items" });
    this.itemsContainer.appendChild(
      createElement("div", {
        className: "empty-state",
        text: "Drag items here from hero inventories to store them for later.",
      }),
    );
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
    if (!activeTab || activeTab.items.length === 0) {
      this.itemsContainer.appendChild(
        createElement("div", {
          className: "empty-state",
          text: "This stash tab is empty. Loot will be shown here after map runs.",
        }),
      );
      return;
    }

    const list = createElement("div", { className: "grid-list" });
    activeTab.items.forEach((item) => {
      const entry = createElement("div", {
        className: "inventory-slot has-item",
        text: item.name,
      });
      list.appendChild(entry);
    });
    this.itemsContainer.appendChild(list);
  }
}
