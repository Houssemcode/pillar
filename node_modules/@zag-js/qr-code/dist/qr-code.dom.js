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

// src/qr-code.dom.ts
var qr_code_dom_exports = {};
__export(qr_code_dom_exports, {
  getFrameEl: () => getFrameEl,
  getFrameId: () => getFrameId,
  getRootId: () => getRootId
});
module.exports = __toCommonJS(qr_code_dom_exports);
var getRootId = (scope) => scope.ids?.root ?? `qrcode:${scope.id}:root`;
var getFrameId = (scope) => scope.ids?.frame ?? `qrcode:${scope.id}:frame`;
var getFrameEl = (scope) => scope.getById(getFrameId(scope));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getFrameEl,
  getFrameId,
  getRootId
});
