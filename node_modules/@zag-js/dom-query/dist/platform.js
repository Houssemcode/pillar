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

// src/platform.ts
var platform_exports = {};
__export(platform_exports, {
  getPlatform: () => getPlatform,
  getUserAgent: () => getUserAgent,
  isAndroid: () => isAndroid,
  isApple: () => isApple,
  isChrome: () => isChrome,
  isDom: () => isDom,
  isFirefox: () => isFirefox,
  isIPad: () => isIPad,
  isIPhone: () => isIPhone,
  isIos: () => isIos,
  isMac: () => isMac,
  isSafari: () => isSafari,
  isTouchDevice: () => isTouchDevice,
  isWebKit: () => isWebKit
});
module.exports = __toCommonJS(platform_exports);
var isDom = () => typeof document !== "undefined";
function getPlatform() {
  const agent = navigator.userAgentData;
  return agent?.platform ?? navigator.platform;
}
function getUserAgent() {
  const ua2 = navigator.userAgentData;
  if (ua2 && Array.isArray(ua2.brands)) {
    return ua2.brands.map(({ brand, version }) => `${brand}/${version}`).join(" ");
  }
  return navigator.userAgent;
}
var pt = (v) => isDom() && v.test(getPlatform());
var ua = (v) => isDom() && v.test(getUserAgent());
var vn = (v) => isDom() && v.test(navigator.vendor);
var isTouchDevice = () => isDom() && !!navigator.maxTouchPoints;
var isIPhone = () => pt(/^iPhone/i);
var isIPad = () => pt(/^iPad/i) || isMac() && navigator.maxTouchPoints > 1;
var isIos = () => isIPhone() || isIPad();
var isApple = () => isMac() || isIos();
var isMac = () => pt(/^Mac/i);
var isSafari = () => isApple() && vn(/apple/i);
var isFirefox = () => ua(/Firefox/i);
var isChrome = () => ua(/Chrome/i);
var isWebKit = () => ua(/AppleWebKit/i) && !isChrome();
var isAndroid = () => ua(/Android/i);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPlatform,
  getUserAgent,
  isAndroid,
  isApple,
  isChrome,
  isDom,
  isFirefox,
  isIPad,
  isIPhone,
  isIos,
  isMac,
  isSafari,
  isTouchDevice,
  isWebKit
});
