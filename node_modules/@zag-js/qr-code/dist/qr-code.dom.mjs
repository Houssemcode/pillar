// src/qr-code.dom.ts
var getRootId = (scope) => scope.ids?.root ?? `qrcode:${scope.id}:root`;
var getFrameId = (scope) => scope.ids?.frame ?? `qrcode:${scope.id}:frame`;
var getFrameEl = (scope) => scope.getById(getFrameId(scope));
export {
  getFrameEl,
  getFrameId,
  getRootId
};
