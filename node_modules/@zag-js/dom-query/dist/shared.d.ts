import { Booleanish } from './types.js';
import '@zag-js/types';

declare const clamp: (value: number) => number;
declare const wrap: <T>(v: T[], idx: number) => T[];
declare const pipe: <T>(...fns: Array<(arg: T) => T>) => (arg: T) => T;
declare const noop: () => undefined;
declare const isObject: (v: unknown) => v is Record<string, unknown>;
declare const MAX_Z_INDEX = 2147483647;
declare const dataAttr: (guard: boolean | undefined) => Booleanish;
declare const ariaAttr: (guard: boolean | undefined) => "true" | undefined;
declare const sanitize: (str: string) => string;

export { MAX_Z_INDEX, ariaAttr, clamp, dataAttr, isObject, noop, pipe, sanitize, wrap };
