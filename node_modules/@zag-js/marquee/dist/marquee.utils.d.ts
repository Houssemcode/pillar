import { Direction, Style } from '@zag-js/types';
import { Side } from './marquee.types.js';
import '@zag-js/core';

interface PositionOptions {
    side: Side;
    dir: Direction;
}
declare const getEdgePositionStyles: (options: PositionOptions) => Style;
declare const getMarqueeTranslate: (options: PositionOptions) => string;

export { getEdgePositionStyles, getMarqueeTranslate };
