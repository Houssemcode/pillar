"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/proxy-tab-focus.ts
var proxy_tab_focus_exports = {};
__export(proxy_tab_focus_exports, {
  proxyTabFocus: () => proxyTabFocus
});
module.exports = __toCommonJS(proxy_tab_focus_exports);
var import_event = require("./event.js");
var import_node = require("./node.js");
var import_raf = require("./raf.js");
var import_tabbable = require("./tabbable.js");
function proxyTabFocusImpl(container, options = {}) {
  const { triggerElement, onFocus, onFocusEnter, getShadowRoot } = options;
  const doc = container?.ownerDocument || document;
  const body = doc.body;
  function onKeyDown(event) {
    if (event.key !== "Tab") return;
    let elementToFocus = null;
    const [firstTabbable, lastTabbable] = (0, import_tabbable.getTabbableEdges)(container, { includeContainer: true, getShadowRoot });
    const nextTabbableAfterTrigger = (0, import_tabbable.getNextTabbable)(body, { current: triggerElement, getShadowRoot });
    const noTabbableElements = !firstTabbable && !lastTabbable;
    if (event.shiftKey && (0, import_node.isActiveElement)(nextTabbableAfterTrigger)) {
      onFocusEnter?.();
      elementToFocus = lastTabbable;
    } else if (event.shiftKey && ((0, import_node.isActiveElement)(firstTabbable) || noTabbableElements)) {
      elementToFocus = triggerElement;
    } else if (!event.shiftKey && (0, import_node.isActiveElement)(triggerElement)) {
      onFocusEnter?.();
      elementToFocus = firstTabbable;
    } else if (!event.shiftKey && ((0, import_node.isActiveElement)(lastTabbable) || noTabbableElements)) {
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
  return (0, import_event.addDomEvent)(doc, "keydown", onKeyDown, true);
}
function proxyTabFocus(container, options) {
  const { defer, triggerElement, ...restOptions } = options;
  const func = defer ? import_raf.raf : (v) => v();
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  proxyTabFocus
});
