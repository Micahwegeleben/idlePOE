import { STASH_COLUMNS } from "../data/constants.js";
import { actions, subscribe } from "../state/store.js";
import { createElement, clearChildren } from "../ui/dom.js";
import { parseDragData } from "../ui/drag.js";
import { buildItemTooltip } from "../ui/items.js";

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

      slot.addEventListener("dragover", (event) => {
        const payload = parseDragData(event);
        const slotOccupied = Boolean(activeTab.grid[index]);
        if (!payload || slotOccupied) return;
        if (payload.type === "stash-item" && payload.tabId === activeTab.id && payload.index !== index) {
          event.preventDefault();
          slot.classList.add("drag-over");
        } else if (payload.type === "equipment-item") {
          event.preventDefault();
          slot.classList.add("drag-over");
        }
      });

      slot.addEventListener("dragleave", () => {
        slot.classList.remove("drag-over");
      });

      slot.addEventListener("drop", (event) => {
        const payload = parseDragData(event);
        slot.classList.remove("drag-over");
        if (!payload) return;
        event.preventDefault();
        if (payload.type === "stash-item" && payload.tabId === activeTab.id) {
          actions.moveStashItem(activeTab.id, payload.index, index);
        } else if (payload.type === "equipment-item") {
          actions.moveEquipmentItemToStash(payload.slotId, activeTab.id, index);
        }
      });

      if (item) {
        const itemElement = createElement("div", {
          className: `stash-item rarity-${item.rarity ?? "common"}`,
          text: item.name,
          attrs: { draggable: "true" },
        });
        itemElement.title = buildItemTooltip(item);
        itemElement.addEventListener("dragstart", (event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(
            "application/json",
            JSON.stringify({
              type: "stash-item",
              tabId: activeTab.id,
              index,
              itemType: item.type,
            }),
          );
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
          text: "This stash tab is empty. Complete maps to discover loot, then drag and drop to organize it.",
        }),
      );
    }
  }
}
