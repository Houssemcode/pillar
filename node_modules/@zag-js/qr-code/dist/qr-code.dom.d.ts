import { Scope } from '@zag-js/core';

declare const getRootId: (scope: Scope) => any;
declare const getFrameId: (scope: Scope) => any;
declare const getFrameEl: (scope: Scope) => SVGSVGElement | null;

export { getFrameEl, getFrameId, getRootId };
