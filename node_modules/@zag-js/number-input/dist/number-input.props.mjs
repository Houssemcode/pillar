// src/number-input.props.ts
import { createProps } from "@zag-js/types";
import { createSplitProps } from "@zag-js/utils";
var props = createProps()([
  "allowMouseWheel",
  "allowOverflow",
  "clampValueOnBlur",
  "dir",
  "disabled",
  "focusInputOnChange",
  "form",
  "formatOptions",
  "getRootNode",
  "id",
  "ids",
  "inputMode",
  "invalid",
  "locale",
  "max",
  "min",
  "name",
  "onFocusChange",
  "onValueChange",
  "onValueCommit",
  "onValueInvalid",
  "pattern",
  "required",
  "readOnly",
  "spinOnPress",
  "step",
  "translations",
  "value",
  "defaultValue"
]);
var splitProps = createSplitProps(props);
export {
  props,
  splitProps
};
