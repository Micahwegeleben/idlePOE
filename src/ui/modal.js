import { createElement, clearChildren } from "./dom.js";

let modalContainer = null;

const ensureContainer = () => {
  if (!modalContainer) {
    modalContainer = createElement("div", { className: "modal-overlay" });
    document.body.appendChild(modalContainer);
  }
  return modalContainer;
};

export const closeModal = () => {
  if (!modalContainer) return;
  modalContainer.remove();
  modalContainer = null;
};

export const openModal = ({ title, render }) => {
  closeModal();
  const overlay = ensureContainer();
  clearChildren(overlay);

  const modal = createElement("div", { className: "modal" });
  const heading = createElement("h3", { text: title });
  const closeButton = createElement("button", {
    text: "Close",
    className: "modal-close-button",
  });
  closeButton.addEventListener("click", () => closeModal());

  modal.appendChild(heading);
  const content = createElement("div");
  render(content, closeModal);
  modal.appendChild(content);
  modal.appendChild(closeButton);

  overlay.appendChild(modal);
};
