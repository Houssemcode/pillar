import "./chunk-QZ7TP4HQ.mjs";

// src/proxy-tab-focus.ts
import { addDomEvent } from "./event.mjs";
import { isActiveElement } from "./node.mjs";
import { raf } from "./raf.mjs";
import { getNextTabbable, getTabbableEdges } from "./tabbable.mjs";
function proxyTabFocusImpl(container, options = {}) {
  const { triggerElement, onFocus, onFocusEnter, getShadowRoot } = options;
  const doc = container?.ownerDocument || document;
  const body = doc.body;
  function onKeyDown(event) {
    if (event.key !== "Tab") return;
    let elementToFocus = null;
    const [firstTabbable, lastTabbable] = getTabbableEdges(container, { includeContainer: true, getShadowRoot });
    const nextTabbableAfterTrigger = getNextTabbable(body, { current: triggerElement, getShadowRoot });
    const noTabbableElements = !firstTabbable && !lastTabbable;
    if (event.shiftKey && isActiveElement(nextTabbableAfterTrigger)) {
      onFocusEnter?.();
      elementToFocus = lastTabbable;
    } else if (event.shiftKey && (isActiveElement(firstTabbable) || noTabbableElements)) {
      elementToFocus = triggerElement;
    } else if (!event.shiftKey && isActiveElement(triggerElement)) {
      onFocusEnter?.();
      elementToFocus = firstTabbable;
    } else if (!event.shiftKey && (isActiveElement(lastTabbable) || noTabbableElements)) {
      elementToFocus = nextTabbableAfterTrigger;
    }
    if (!elementToFocus) return;
    event.preventDefault();
    if (typeof onFocus === "function") {
      onFocus(elementToFocus);
    } else {
      elementToFocus.focus();
    }
  }
  return addDomEvent(doc, "keydown", onKeyDown, true);
}
function proxyTabFocus(container, options) {
  const { defer, triggerElement, ...restOptions } = options;
  const func = defer ? raf : (v) => v();
  const cleanups = [];
  cleanups.push(
    func(() => {
      const node = typeof container === "function" ? container() : container;
      const trigger = typeof triggerElement === "function" ? triggerElement() : triggerElement;
      cleanups.push(proxyTabFocusImpl(node, { triggerElement: trigger, ...restOptions }));
    })
  );
  return () => {
    cleanups.forEach((fn) => fn?.());
  };
}
export {
  proxyTabFocus
};
