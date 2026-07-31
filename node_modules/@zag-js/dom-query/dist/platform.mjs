import "./chunk-QZ7TP4HQ.mjs";

// src/platform.ts
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
export {
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
};
