import { HERO_CLASSES } from "../data/constants.js";
import { actions, subscribe } from "../state/store.js";
import { createElement, clearChildren } from "../ui/dom.js";
import { openModal, closeModal } from "../ui/modal.js";

const MAX_GUILD_SIZE = 5;

const createHeroCard = (hero, isActive) => {
  const slot = createElement("div", {
    className: `hero-slot${isActive ? " active" : ""}`,
  });

  if (!hero) {
    const emptyLabel = createElement("span", { text: "Empty slot" });
    const addButton = createElement("button", { text: "+ Recruit" });
    addButton.addEventListener("click", () => openHeroModal());
    slot.appendChild(emptyLabel);
    slot.appendChild(addButton);
    return slot;
  }

  const info = createElement("div");
  const name = createElement("div", { html: `<strong>${hero.name}</strong>` });
  const classInfo = createElement("div", {
    text: HERO_CLASSES.find((cls) => cls.id === hero.classId)?.name || "Unknown",
  });
  const levelInfo = createElement("div", { text: `Level ${hero.level}` });

  info.appendChild(name);
  info.appendChild(classInfo);
  info.appendChild(levelInfo);

  const selectButton = createElement("button", { text: "Select" });
  selectButton.addEventListener("click", () => actions.selectHero(hero.id));

  slot.appendChild(info);
  slot.appendChild(selectButton);
  return slot;
};

const openHeroModal = () => {
  openModal({
    title: "Recruit a Hero",
    render: (content) => {
      const grid = createElement("div", { className: "hero-class-grid" });
      HERO_CLASSES.forEach((heroClass) => {
        const card = createElement("div", { className: "hero-class-card" });
        const name = createElement("div", { html: `<strong>${heroClass.name}</strong>` });
        const description = createElement("div", { text: heroClass.description });
        card.appendChild(name);
        card.appendChild(description);
        card.addEventListener("click", () => {
          actions.createHero(heroClass.id);
          closeModal();
        });
        grid.appendChild(card);
      });
      content.appendChild(grid);
    },
  });
};

export class GuildPanel {
  constructor() {
    this.element = createElement("div", { className: "panel", attrs: { "data-area": "guild" } });
    this.element.appendChild(createElement("h2", { text: "Guild" }));
    this.list = createElement("div", { className: "grid-list" });
    this.element.appendChild(this.list);
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
    clearChildren(this.list);
    for (let i = 0; i < MAX_GUILD_SIZE; i += 1) {
      const hero = state.guild[i];
      const isActive = hero && hero.id === state.activeHeroId;
      const card = createHeroCard(hero, isActive);
      this.list.appendChild(card);
    }
    if (state.guild.length === 0) {
      const emptyState = createElement("div", {
        className: "empty-state",
        text: "Recruit your first hero to begin mapping adventures.",
      });
      this.list.appendChild(emptyState);
    }
  }
}
