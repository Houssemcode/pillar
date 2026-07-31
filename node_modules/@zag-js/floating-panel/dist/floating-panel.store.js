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

// src/floating-panel.store.ts
var floating_panel_store_exports = {};
__export(floating_panel_store_exports, {
  panelStack: () => panelStack
});
module.exports = __toCommonJS(floating_panel_store_exports);
var import_store = require("@zag-js/store");
var panelStack = (0, import_store.proxy)({
  stack: [],
  count() {
    return this.stack.length;
  },
  add(panelId) {
    if (this.stack.includes(panelId)) return;
    this.stack.push(panelId);
  },
  remove(panelId) {
    const index = this.stack.indexOf(panelId);
    if (index < 0) return;
    this.stack.splice(index, 1);
  },
  bringToFront(id) {
    this.remove(id);
    this.add(id);
  },
  isTopmost(id) {
    return this.stack[this.stack.length - 1] === id;
  },
  indexOf(id) {
    return this.stack.indexOf(id);
  }
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  panelStack
});
