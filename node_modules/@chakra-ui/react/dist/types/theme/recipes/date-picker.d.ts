export declare const datePickerSlotRecipe: import("../..").SlotRecipeDefinition<"root" | "positioner" | "content" | "control" | "label" | "nextTrigger" | "prevTrigger" | "trigger" | "valueText" | "view" | "clearTrigger" | "input" | "monthSelect" | "presetTrigger" | "rangeText" | "table" | "tableBody" | "tableCell" | "tableCellTrigger" | "tableHead" | "tableHeader" | "tableRow" | "viewControl" | "viewTrigger" | "yearSelect" | "indicatorGroup", {
    size: {
        xs: {
            root: {
                "--datepicker-input-height": "sizes.8";
                "--datepicker-input-px": "sizes.2";
                "--datepicker-indicators-offset": "sizes.2";
            };
            view: {
                "--table-cell-size": "sizes.8";
                "--datepicker-nav-trigger-size": "sizes.7";
                "--datepicker-select-height": "sizes.8";
            };
        };
        sm: {
            root: {
                "--datepicker-input-height": "sizes.9";
                "--datepicker-input-px": "sizes.2.5";
                "--datepicker-indicators-offset": "sizes.2.5";
            };
            view: {
                "--table-cell-size": "sizes.9";
                "--datepicker-nav-trigger-size": "sizes.8";
                "--datepicker-select-height": "sizes.9";
            };
        };
        md: {
            root: {
                "--datepicker-input-height": "sizes.10";
                "--datepicker-input-px": "sizes.3";
            };
            view: {
                "--table-cell-size": "sizes.10";
                "--datepicker-nav-trigger-size": "sizes.8";
                "--datepicker-select-height": "sizes.10";
            };
        };
        lg: {
            root: {
                "--datepicker-input-height": "sizes.11";
                "--datepicker-input-px": "sizes.4";
            };
            view: {
                "--table-cell-size": "sizes.10";
                "--datepicker-nav-trigger-size": "sizes.9";
                "--datepicker-select-height": "sizes.10";
            };
        };
        xl: {
            root: {
                "--datepicker-input-height": "sizes.12";
                "--datepicker-input-px": "sizes.4.5";
            };
            view: {
                "--table-cell-size": "sizes.10";
                "--datepicker-nav-trigger-size": "sizes.9";
                "--datepicker-select-height": "sizes.10";
            };
        };
    };
    hideOutsideDays: {
        true: {
            tableCellTrigger: {
                "&[data-outside-range]": {
                    visibility: "hidden";
                };
            };
        };
    };
    variant: {
        outline: {
            input: {
                bg: "transparent";
                borderWidth: "1px";
                borderColor: "border";
                focusVisibleRing: "inside";
                focusRingColor: "var(--focus-color)";
            };
        };
        subtle: {
            input: {
                borderWidth: "1px";
                borderColor: "transparent";
                bg: "bg.muted";
                focusVisibleRing: "inside";
                focusRingColor: "var(--focus-color)";
            };
        };
        flushed: {
            input: {
                bg: "transparent";
                borderBottomWidth: "1px";
                borderBottomColor: "border";
                borderRadius: "0";
                px: "0";
                _focusVisible: {
                    borderColor: "var(--focus-color)";
                    boxShadow: "0px 1px 0px 0px var(--focus-color)";
                    _invalid: {
                        borderColor: "var(--error-color)";
                        boxShadow: "0px 1px 0px 0px var(--error-color)";
                    };
                };
            };
            indicatorGroup: {
                insetEnd: "0";
            };
        };
    };
}>;
