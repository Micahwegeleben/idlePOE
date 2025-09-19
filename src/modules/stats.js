import { HERO_CLASSES } from "../data/constants.js";
import { subscribe } from "../state/store.js";
import { createElement, clearChildren } from "../ui/dom.js";

export class StatsPanel {
  constructor() {
    this.element = createElement("div", { className: "panel", attrs: { "data-area": "stats" } });
    this.element.appendChild(createElement("h2", { text: "Stats" }));
    this.content = createElement("div", { className: "stats-grid" });
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
          text: "Select a hero to inspect their offensive and defensive stats.",
        }),
      );
      return;
    }

    const overview = createElement("div", { className: "stats-card" });
    overview.appendChild(createElement("div", { html: `<strong>${hero.name}</strong>` }));
    const className = HERO_CLASSES.find((cls) => cls.id === hero.classId)?.name ?? hero.classId;
    overview.appendChild(createElement("div", { text: `Class: ${className}` }));
    overview.appendChild(
      createElement("div", {
        text: `Level ${hero.level} — XP ${hero.experience} / ${hero.experienceToNext}`,
      }),
    );

    const defense = createElement("div", { className: "stats-card" });
    defense.appendChild(createElement("div", { html: "<strong>Defense</strong>" }));
    defense.appendChild(createElement("div", { text: `Life: ${hero.stats.life}` }));
    defense.appendChild(createElement("div", { text: `Energy Shield: ${hero.stats.energyShield}` }));
    defense.appendChild(createElement("div", { text: `Armour: ${hero.stats.armour}` }));
    defense.appendChild(createElement("div", { text: `Evasion: ${hero.stats.evasion}` }));

    const offense = createElement("div", { className: "stats-card" });
    offense.appendChild(createElement("div", { html: "<strong>Offense</strong>" }));
    offense.appendChild(createElement("div", { text: `Base Damage: ${hero.stats.damage}` }));
    offense.appendChild(
      createElement("div", {
        text: `Attack Speed: ${(1 + (hero.level - 1) * 0.02).toFixed(2)}`,
      }),
    );
    offense.appendChild(
      createElement("div", {
        text: `Critical Chance: ${(5 + hero.level * 0.2).toFixed(1)}%`,
      }),
    );

    this.content.appendChild(overview);
    this.content.appendChild(defense);
    this.content.appendChild(offense);
  }
}
