import { createElement, clearChildren } from "./dom.js";

let activeTooltip = null;
let cleanupTooltipHandlers = null;

const closeTooltipHandlers = () => {
  if (cleanupTooltipHandlers) {
    cleanupTooltipHandlers();
    cleanupTooltipHandlers = null;
  }
};

export const closeItemTooltip = () => {
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
  closeTooltipHandlers();
};

const formatStatLines = (item) => {
  if (!item || !Array.isArray(item.stats) || item.stats.length === 0) {
    return ["No explicit modifiers."];
  }
  return item.stats;
};

export const buildItemTooltip = (item) => {
  if (!item) return "";
  const lines = [item.name];
  if (item.baseLabel) {
    lines.push(item.baseLabel);
  }
  if (item.rarity) {
    lines.push(`Rarity: ${item.rarity}`);
  }
  lines.push("", ...formatStatLines(item));
  return lines.join("\n");
};

const positionTooltip = (tooltip, anchor) => {
  const anchorRect = anchor.getBoundingClientRect();
  const { innerWidth, innerHeight } = window;
  const tooltipRect = tooltip.getBoundingClientRect();
  const spacing = 12;

  let top = window.scrollY + anchorRect.top;
  let left = window.scrollX + anchorRect.right + spacing;

  if (left + tooltipRect.width > window.scrollX + innerWidth - spacing) {
    left = window.scrollX + anchorRect.left - tooltipRect.width - spacing;
  }
  if (left < window.scrollX + spacing) {
    left = window.scrollX + spacing;
  }

  if (top + tooltipRect.height > window.scrollY + innerHeight - spacing) {
    top = window.scrollY + innerHeight - tooltipRect.height - spacing;
  }
  if (top < window.scrollY + spacing) {
    top = window.scrollY + spacing;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
};

const attachGlobalHandlers = (anchor) => {
  const handlePointerDown = (event) => {
    if (!activeTooltip) return;
    if (activeTooltip.contains(event.target) || anchor.contains(event.target)) {
      return;
    }
    closeItemTooltip();
  };
  const handleScroll = () => closeItemTooltip();
  const handleResize = () => closeItemTooltip();

  document.addEventListener("pointerdown", handlePointerDown, true);
  window.addEventListener("scroll", handleScroll, true);
  window.addEventListener("resize", handleResize, true);

  cleanupTooltipHandlers = () => {
    document.removeEventListener("pointerdown", handlePointerDown, true);
    window.removeEventListener("scroll", handleScroll, true);
    window.removeEventListener("resize", handleResize, true);
  };
};

const renderItemDetails = (container, item) => {
  clearChildren(container);
  if (!item) {
    container.appendChild(createElement("div", { className: "item-tooltip-empty", text: "No item selected." }));
    return;
  }
  container.appendChild(
    createElement("div", {
      className: `item-tooltip-name rarity-${item.rarity ?? "common"}`,
      text: item.name,
    }),
  );
  if (item.baseLabel) {
    container.appendChild(
      createElement("div", {
        className: "item-tooltip-base",
        text: item.baseLabel,
      }),
    );
  }
  const stats = formatStatLines(item);
  const list = createElement("ul", { className: "item-tooltip-stats" });
  stats.forEach((stat) => {
    list.appendChild(createElement("li", { text: stat }));
  });
  container.appendChild(list);
};

export const openItemOptionsTooltip = ({ anchor, item, options }) => {
  if (!anchor) return;
  closeItemTooltip();

  activeTooltip = createElement("div", { className: "item-tooltip" });
  activeTooltip.appendChild(createElement("div", { className: "item-tooltip-content" }));
  const content = activeTooltip.firstChild;
  renderItemDetails(content, item);

  const actionsContainer = createElement("div", { className: "item-tooltip-actions" });
  options
    .filter(Boolean)
    .forEach((option) => {
      const actionRow = createElement("div", { className: "item-tooltip-action-row" });
      const button = createElement("button", {
        className: "item-tooltip-action",
        text: option.label,
      });
      if (option.disabled) {
        button.disabled = true;
      }
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (option.disabled) return;
        closeItemTooltip();
        option.onSelect?.();
      });
      actionRow.appendChild(button);
      if (option.hint) {
        actionRow.appendChild(createElement("div", { className: "item-tooltip-hint", text: option.hint }));
      }
      actionsContainer.appendChild(actionRow);
    });

  if (!actionsContainer.hasChildNodes()) {
    actionsContainer.appendChild(
      createElement("div", { className: "item-tooltip-hint", text: "No actions available." }),
    );
  }

  activeTooltip.appendChild(actionsContainer);
  document.body.appendChild(activeTooltip);

  // Position after insertion to measure dimensions accurately.
  positionTooltip(activeTooltip, anchor);

  // Prevent the tooltip from closing when interacting with its contents.
  activeTooltip.addEventListener("pointerdown", (event) => event.stopPropagation());

  attachGlobalHandlers(anchor);
};
