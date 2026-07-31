import "./chunk-QZ7TP4HQ.mjs";

// src/initial-focus.ts
import { isActiveElement } from "./node.mjs";
import { getTabbableEdges, getTabbables } from "./tabbable.mjs";
function getInitialFocus(options) {
  const { root, getInitialEl, filter, enabled = true } = options;
  if (!enabled) return;
  let node = null;
  node || (node = typeof getInitialEl === "function" ? getInitialEl() : getInitialEl);
  node || (node = root?.querySelector("[data-autofocus],[autofocus]"));
  if (!node) {
    const tabbables = getTabbables(root);
    node = filter ? tabbables.filter(filter)[0] : tabbables[0];
  }
  return node || root || void 0;
}
function isValidTabEvent(event) {
  const container = event.currentTarget;
  if (!container) return false;
  const [firstTabbable, lastTabbable] = getTabbableEdges(container);
  if (isActiveElement(firstTabbable) && event.shiftKey) return false;
  if (isActiveElement(lastTabbable) && !event.shiftKey) return false;
  if (!firstTabbable && !lastTabbable) return false;
  return true;
}
export {
  getInitialFocus,
  isValidTabEvent
};
