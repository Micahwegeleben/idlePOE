export const createElement = (tag, options = {}) => {
  const el = document.createElement(tag);
  if (options.className) {
    el.className = options.className;
  }
  if (options.text) {
    el.textContent = options.text;
  }
  if (options.html) {
    el.innerHTML = options.html;
  }
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      if (value != null) {
        el.setAttribute(key, value);
      }
    });
  }
  return el;
};

export const clearChildren = (node) => {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
};

export const formatSeconds = (seconds) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};
