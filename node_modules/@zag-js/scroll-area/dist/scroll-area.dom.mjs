import "./chunk-QZ7TP4HQ.mjs";

// src/scroll-area.dom.ts
import { query } from "@zag-js/dom-query";
var getRootId = (ctx) => ctx.ids?.root ?? `scroll-area-${ctx.id}`;
var getViewportId = (ctx) => ctx.ids?.viewport ?? `scroll-area-${ctx.id}:viewport`;
var getContentId = (ctx) => ctx.ids?.content ?? `scroll-area-${ctx.id}:content`;
var getRootEl = (ctx) => ctx.getById(getRootId(ctx));
var getViewportEl = (ctx) => ctx.getById(getViewportId(ctx));
var getContentEl = (ctx) => ctx.getById(getContentId(ctx));
var getScrollbarXEl = (ctx) => query(getRootEl(ctx), `[data-part=scrollbar][data-orientation=horizontal][data-ownedby="${getRootId(ctx)}"]`);
var getScrollbarYEl = (ctx) => query(getRootEl(ctx), `[data-part=scrollbar][data-orientation=vertical][data-ownedby="${getRootId(ctx)}"]`);
var getThumbXEl = (ctx) => query(getScrollbarXEl(ctx), `[data-part=thumb][data-orientation=horizontal][data-ownedby="${getRootId(ctx)}"]`);
var getThumbYEl = (ctx) => query(getScrollbarYEl(ctx), `[data-part=thumb][data-orientation=vertical][data-ownedby="${getRootId(ctx)}"]`);
var getCornerEl = (ctx) => query(getRootEl(ctx), `[data-part=corner][data-ownedby="${getRootId(ctx)}"]`);
export {
  getContentEl,
  getContentId,
  getCornerEl,
  getRootEl,
  getRootId,
  getScrollbarXEl,
  getScrollbarYEl,
  getThumbXEl,
  getThumbYEl,
  getViewportEl,
  getViewportId
};
