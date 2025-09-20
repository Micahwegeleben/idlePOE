import { actions, subscribe } from "../state/store.js";
import { createElement, clearChildren, formatSeconds } from "../ui/dom.js";

const statusLabel = (map, heroes) => {
  if (map.status === "idle") {
    return "Idle";
  }
  if (map.status === "running") {
    const hero = heroes.find((h) => h.id === map.assignedHeroId);
    return hero ? `Running — ${hero.name}` : "Running";
  }
  if (map.status === "completed") {
    return "Completed — Claim rewards";
  }
  return map.status;
};

const createProgressBar = (map) => {
  const wrapper = createElement("div", { className: "map-progress" });
  const bar = createElement("div", {
    className: "map-progress-bar",
  });
  bar.style.width = `${map.progress}%`;
  wrapper.appendChild(bar);
  return wrapper;
};

const renderControls = (map, state) => {
  const controls = createElement("div", { className: "map-controls" });
  if (map.status === "idle") {
    const runButton = createElement("button", { text: "Assign & Run" });
    if (!state.activeHeroId) {
      runButton.disabled = true;
      runButton.title = "Select a hero from the guild to start this map.";
    } else {
      const heroBusy = state.maps.some(
        (entry) => entry.status === "running" && entry.assignedHeroId === state.activeHeroId,
      );
      if (heroBusy) {
        runButton.disabled = true;
        runButton.title = "Selected hero is already running another map.";
      }
    }
    runButton.addEventListener("click", () => actions.startMap(map.id, state.activeHeroId));
    controls.appendChild(runButton);
  } else if (map.status === "running") {
    const abortButton = createElement("button", { text: "Abort Run" });
    abortButton.addEventListener("click", () => actions.resetMap(map.id));
    controls.appendChild(abortButton);
  } else if (map.status === "completed") {
    const claimButton = createElement("button", { text: "Claim Rewards" });
    claimButton.addEventListener("click", () => actions.completeMap(map.id));
    controls.appendChild(claimButton);
  }
  return controls;
};

const describeTimers = (map) => {
  if (map.status === "idle") {
    return `Estimated run time: ${formatSeconds(map.duration)}`;
  }
  if (map.status === "running") {
    const elapsed = Math.round((map.progress / 100) * map.duration);
    const remaining = Math.max(map.duration - elapsed, 0);
    return `Time remaining: ${formatSeconds(remaining)}`;
  }
  if (map.status === "completed") {
    return "Awaiting reward claim";
  }
  return "";
};

export class MapsPanel {
  constructor() {
    this.element = createElement("div", { className: "panel", attrs: { "data-area": "maps" } });
    this.element.appendChild(createElement("h2", { text: "Maps" }));
    this.list = createElement("div", { className: "maps-list" });
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
    state.maps.forEach((map) => {
      const card = createElement("div", { className: "map-card" });
      card.appendChild(createElement("div", { html: `<strong>${map.name}</strong>` }));
      card.appendChild(createElement("div", { text: `Tier ${map.tier}` }));
      card.appendChild(createElement("div", { text: map.description }));
      card.appendChild(createElement("div", { text: statusLabel(map, state.guild) }));
      card.appendChild(createElement("div", { text: describeTimers(map) }));
      card.appendChild(createProgressBar(map));
      card.appendChild(renderControls(map, state));
      this.list.appendChild(card);
    });
  }
}
