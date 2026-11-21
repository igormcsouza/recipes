import "@testing-library/jest-dom/vitest";

// jsdom has no modal <dialog> behavior; emulate the open state.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};
