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

// src/tour.dom.ts
var tour_dom_exports = {};
__export(tour_dom_exports, {
  getArrowId: () => getArrowId,
  getBackdropEl: () => getBackdropEl,
  getBackdropId: () => getBackdropId,
  getContentEl: () => getContentEl,
  getContentId: () => getContentId,
  getDescriptionId: () => getDescriptionId,
  getPositionerEl: () => getPositionerEl,
  getPositionerId: () => getPositionerId,
  getTitleId: () => getTitleId,
  syncZIndex: () => syncZIndex
});
module.exports = __toCommonJS(tour_dom_exports);
var import_dom_query = require("@zag-js/dom-query");
var getPositionerId = (ctx) => ctx.ids?.positioner ?? `tour-positioner-${ctx.id}`;
var getContentId = (ctx) => ctx.ids?.content ?? `tour-content-${ctx.id}`;
var getTitleId = (ctx) => ctx.ids?.title ?? `tour-title-${ctx.id}`;
var getDescriptionId = (ctx) => ctx.ids?.description ?? `tour-desc-${ctx.id}`;
var getArrowId = (ctx) => ctx.ids?.arrow ?? `tour-arrow-${ctx.id}`;
var getBackdropId = (ctx) => ctx.ids?.backdrop ?? `tour-backdrop-${ctx.id}`;
var getContentEl = (ctx) => ctx.getById(getContentId(ctx));
var getPositionerEl = (ctx) => ctx.getById(getPositionerId(ctx));
var getBackdropEl = (ctx) => ctx.getById(getBackdropId(ctx));
function syncZIndex(scope) {
  return (0, import_dom_query.raf)(() => {
    const contentEl = getContentEl(scope);
    if (!contentEl) return;
    const styles = (0, import_dom_query.getComputedStyle)(contentEl);
    const positionerEl = getPositionerEl(scope);
    const backdropEl = getBackdropEl(scope);
    if (positionerEl) {
      positionerEl.style.setProperty("--z-index", styles.zIndex);
      positionerEl.style.setProperty("z-index", "var(--z-index)");
    }
    if (backdropEl) {
      backdropEl.style.setProperty("--z-index", styles.zIndex);
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getArrowId,
  getBackdropEl,
  getBackdropId,
  getContentEl,
  getContentId,
  getDescriptionId,
  getPositionerEl,
  getPositionerId,
  getTitleId,
  syncZIndex
});
