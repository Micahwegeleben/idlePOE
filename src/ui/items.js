export const buildItemTooltip = (item) => {
  if (!item) return "";
  const lines = [item.name];
  if (item.stats && item.stats.length > 0) {
    lines.push("", ...item.stats);
  }
  return lines.join("\n");
};
