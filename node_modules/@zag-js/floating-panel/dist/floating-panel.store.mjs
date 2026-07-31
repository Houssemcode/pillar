// src/floating-panel.store.ts
import { proxy } from "@zag-js/store";
var panelStack = proxy({
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
export {
  panelStack
};
