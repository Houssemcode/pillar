"use client";

// src/refs.ts
import { useRef } from "react";
function useRefs(refs) {
  const ref = useRef(refs);
  return {
    get(key) {
      return ref.current[key];
    },
    set(key, value) {
      ref.current[key] = value;
    }
  };
}
export {
  useRefs
};
