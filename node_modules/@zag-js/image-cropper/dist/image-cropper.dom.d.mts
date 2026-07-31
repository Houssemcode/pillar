import { Scope } from '@zag-js/core';
import { ImageCropperService } from './image-cropper.types.mjs';
import '@zag-js/types';

declare const getRootId: (ctx: Scope) => any;
declare const getViewportId: (ctx: Scope) => any;
declare const getImageId: (ctx: Scope) => any;
declare const getSelectionId: (ctx: Scope) => any;
declare const getHandleId: (ctx: Scope, position: string) => any;
declare const getRootEl: (ctx: Scope) => HTMLElement | null;
declare const getViewportEl: (ctx: Scope) => HTMLElement | null;
declare const getImageEl: (ctx: Scope) => HTMLImageElement | null;
declare const getSelectionEl: (ctx: Scope) => HTMLElement | null;
declare const getHandleEl: (ctx: Scope, position: string) => HTMLElement | null;
declare function drawCroppedImageToCanvas(params: ImageCropperService): HTMLCanvasElement | null;

export { drawCroppedImageToCanvas, getHandleEl, getHandleId, getImageEl, getImageId, getRootEl, getRootId, getSelectionEl, getSelectionId, getViewportEl, getViewportId };
