// src/tour.dom.ts
import { getComputedStyle, raf } from "@zag-js/dom-query";
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
  return raf(() => {
    const contentEl = getContentEl(scope);
    if (!contentEl) return;
    const styles = getComputedStyle(contentEl);
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
export {
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
};
