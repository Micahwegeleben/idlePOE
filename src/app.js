import { CraftingPanel } from "./modules/crafting.js";
import { EquipmentPanel } from "./modules/equipment.js";
import { GuildPanel } from "./modules/guild.js";
import { MapsPanel } from "./modules/maps.js";
import { StashPanel } from "./modules/stash.js";
import { StatsPanel } from "./modules/stats.js";
import { createElement } from "./ui/dom.js";

class AppShell {
  constructor(root) {
    this.root = root;
    this.panels = [];
  }

  initialize() {
    if (this.panels.length > 0) {
      return;
    }
    const title = createElement("div", { className: "app-title", text: "Idle Guild of Exiles" });
    const layout = createElement("div", { className: "layout" });

    const guild = new GuildPanel();
    const stash = new StashPanel();
    const equipment = new EquipmentPanel();
    const crafting = new CraftingPanel();
    const maps = new MapsPanel();
    const stats = new StatsPanel();

    this.panels = [guild, stash, equipment, crafting, maps, stats];

    layout.appendChild(guild.element);
    layout.appendChild(stash.element);
    layout.appendChild(equipment.element);
    layout.appendChild(crafting.element);
    layout.appendChild(maps.element);
    layout.appendChild(stats.element);

    this.root.appendChild(title);
    this.root.appendChild(layout);
  }

  mount() {
    this.initialize();
    this.panels.forEach((panel) => panel.mount());
  }
}

const root = document.getElementById("app");
const app = new AppShell(root);
app.mount();
