import { actions, subscribe } from "../state/store.js";
import { createElement, clearChildren } from "../ui/dom.js";

const formatItemStats = (item) => {
  if (!item || !Array.isArray(item.stats) || item.stats.length === 0) {
    return ["No explicit modifiers."];
  }
  return item.stats;
};

export class CraftingPanel {
  constructor() {
    this.element = createElement("div", { className: "panel", attrs: { "data-area": "crafting" } });
    this.element.appendChild(createElement("h2", { text: "Crafting Bench" }));
    this.content = createElement("div", { className: "crafting-content" });
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

    const craftingState = state.crafting ?? {};
    const { benchItem, selectedMaterialId, lastCraftSummary } = craftingState;
    const selectedMaterial = state.currency.find((entry) => entry.id === selectedMaterialId);

    const materialsSection = createElement("div", { className: "crafting-materials" });
    materialsSection.appendChild(createElement("h3", { text: "Materials" }));

    if (!state.currency || state.currency.length === 0) {
      materialsSection.appendChild(
        createElement("div", {
          className: "empty-state subtle",
          text: "No currency stored yet. Map rewards will accumulate here.",
        }),
      );
    } else {
      const materialList = createElement("div", { className: "crafting-material-list" });
      state.currency.forEach((material) => {
        const isSelected = material.id === selectedMaterialId;
        const button = createElement("button", {
          className: `material-button${isSelected ? " selected" : ""}${material.amount <= 0 ? " depleted" : ""}`,
        });
        button.appendChild(createElement("div", { className: "material-name", text: material.name }));
        button.appendChild(createElement("div", { className: "material-amount", text: `x${material.amount}` }));
        button.addEventListener("click", () => actions.setSelectedCraftingMaterial(material.id));
        materialList.appendChild(button);
      });
      materialsSection.appendChild(materialList);
    }

    const benchSection = createElement("div", { className: "crafting-bench" });
    benchSection.appendChild(createElement("h3", { text: "Bench" }));

    const benchSlots = createElement("div", { className: "crafting-bench-slots" });
    const itemSlot = createElement("div", { className: `bench-slot${benchItem ? " filled" : ""}` });
    if (benchItem) {
      itemSlot.appendChild(
        createElement("div", { className: `bench-item-name rarity-${benchItem.rarity ?? "common"}`, text: benchItem.name }),
      );
      if (benchItem.baseLabel) {
        itemSlot.appendChild(createElement("div", { className: "bench-item-base", text: benchItem.baseLabel }));
      }
    } else {
      itemSlot.appendChild(
        createElement("div", {
          className: "bench-placeholder",
          text: "Select an item from your stash or equipment to work on.",
        }),
      );
    }
    benchSlots.appendChild(itemSlot);
    benchSection.appendChild(benchSlots);

    const materialInfo = createElement("div", { className: "bench-material-info" });
    if (selectedMaterial) {
      materialInfo.textContent = `Selected Material: ${selectedMaterial.name} (x${selectedMaterial.amount})`;
    } else {
      materialInfo.textContent = "Selected Material: None";
    }
    benchSection.appendChild(materialInfo);

    const benchControls = createElement("div", { className: "crafting-controls" });
    const craftButton = createElement("button", { text: "Craft" });
    craftButton.disabled = !benchItem || !selectedMaterial || selectedMaterial.amount <= 0;
    craftButton.addEventListener("click", () => actions.craftBenchItem());
    benchControls.appendChild(craftButton);

    if (benchItem) {
      const removeButton = createElement("button", { text: "Remove Item" });
      removeButton.addEventListener("click", () => actions.returnBenchItem());
      benchControls.appendChild(removeButton);
    }

    benchSection.appendChild(benchControls);

    if (lastCraftSummary) {
      const summary = createElement("div", {
        className: "crafting-last-result",
        text: `Applied ${lastCraftSummary.materialName} to ${lastCraftSummary.itemName}.`,
      });
      benchSection.appendChild(summary);
    }

    const statsSection = createElement("div", { className: "crafting-item-stats" });
    statsSection.appendChild(createElement("h3", { text: "Active Item Stats" }));
    const statsContent = createElement("div", { className: "crafting-item-stats-content" });
    if (benchItem) {
      statsContent.appendChild(
        createElement("div", { className: `bench-item-name rarity-${benchItem.rarity ?? "common"}`, text: benchItem.name }),
      );
      if (benchItem.baseLabel) {
        statsContent.appendChild(createElement("div", { className: "bench-item-base", text: benchItem.baseLabel }));
      }
      const statsList = createElement("ul", { className: "bench-stats-list" });
      formatItemStats(benchItem).forEach((line) => {
        statsList.appendChild(createElement("li", { text: line }));
      });
      statsContent.appendChild(statsList);
    } else {
      statsContent.appendChild(
        createElement("div", {
          className: "bench-placeholder",
          text: "Place an item in the bench to view its modifiers.",
        }),
      );
    }
    statsSection.appendChild(statsContent);

    this.content.appendChild(materialsSection);
    this.content.appendChild(benchSection);
    this.content.appendChild(statsSection);
  }
}
