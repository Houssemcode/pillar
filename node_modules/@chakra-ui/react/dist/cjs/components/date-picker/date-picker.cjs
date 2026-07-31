"use strict";
"use client";
'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('@ark-ui/react');
var datePicker = require('@ark-ui/react/date-picker');
var React = require('react');
var createSlotRecipeContext = require('../../styled-system/create-slot-recipe-context.cjs');
var factory = require('../../styled-system/factory.cjs');
var button = require('../button/button.cjs');
var icons = require('../icons.cjs');

const {
  withProvider,
  withContext,
  useStyles: useDatePickerStyles,
  PropsProvider
} = createSlotRecipeContext.createSlotRecipeContext({ key: "datePicker" });
const DatePickerRootProvider = withProvider(datePicker.DatePicker.RootProvider, "root", { forwardAsChild: true });
const DatePickerRoot = withProvider(
  datePicker.DatePicker.Root,
  "root",
  {
    forwardAsChild: true
  }
);
const DatePickerPropsProvider = PropsProvider;
const DatePickerClearTrigger = withContext(datePicker.DatePicker.ClearTrigger, "clearTrigger", {
  forwardAsChild: true,
  defaultProps: {
    children: /* @__PURE__ */ jsxRuntime.jsx(icons.CloseIcon, {})
  }
});
const DatePickerContent = withContext(datePicker.DatePicker.Content, "content", { forwardAsChild: true });
const DatePickerControl = withContext(datePicker.DatePicker.Control, "control", { forwardAsChild: true });
const DatePickerInput = withContext(datePicker.DatePicker.Input, "input", { forwardAsChild: true });
const DatePickerLabel = withContext(datePicker.DatePicker.Label, "label", { forwardAsChild: true });
const DatePickerMonthSelect = withContext(datePicker.DatePicker.MonthSelect, "monthSelect", { forwardAsChild: true });
const DatePickerNextTrigger = withContext(datePicker.DatePicker.NextTrigger, "nextTrigger", {
  forwardAsChild: true,
  defaultProps: {
    children: /* @__PURE__ */ jsxRuntime.jsx(icons.ChevronRightIcon, {})
  }
});
const DatePickerPositioner = withContext(datePicker.DatePicker.Positioner, "positioner", { forwardAsChild: true });
const DatePickerPresetTrigger = withContext(datePicker.DatePicker.PresetTrigger, "presetTrigger", { forwardAsChild: true });
const DatePickerPrevTrigger = withContext(datePicker.DatePicker.PrevTrigger, "prevTrigger", {
  forwardAsChild: true,
  defaultProps: {
    children: /* @__PURE__ */ jsxRuntime.jsx(icons.ChevronLeftIcon, {})
  }
});
const DatePickerRangeText = withContext(datePicker.DatePicker.RangeText, "rangeText", { forwardAsChild: true });
const DatePickerTable = withContext(datePicker.DatePicker.Table, "table", { forwardAsChild: true });
const DatePickerTableBody = withContext(datePicker.DatePicker.TableBody, "tableBody", { forwardAsChild: true });
const DatePickerTableCell = withContext(datePicker.DatePicker.TableCell, "tableCell", { forwardAsChild: true });
const DatePickerTableCellTrigger = withContext(datePicker.DatePicker.TableCellTrigger, "tableCellTrigger", { forwardAsChild: true });
const DatePickerTableHead = withContext(datePicker.DatePicker.TableHead, "tableHead", { forwardAsChild: true });
const DatePickerTableHeader = withContext(datePicker.DatePicker.TableHeader, "tableHeader", { forwardAsChild: true });
const DatePickerTableRow = withContext(datePicker.DatePicker.TableRow, "tableRow", { forwardAsChild: true });
const DatePickerTrigger = withContext(datePicker.DatePicker.Trigger, "trigger", {
  forwardAsChild: true
});
const DatePickerView = withContext(
  datePicker.DatePicker.View,
  "view",
  { forwardAsChild: true }
);
const DatePickerViewControl = withContext(datePicker.DatePicker.ViewControl, "viewControl", { forwardAsChild: true });
const DatePickerViewTrigger = withContext(datePicker.DatePicker.ViewTrigger, "viewTrigger", { forwardAsChild: true });
const DatePickerYearSelect = withContext(datePicker.DatePicker.YearSelect, "yearSelect", { forwardAsChild: true });
const DatePickerIndicatorGroup = withContext("div", "indicatorGroup");
const DatePickerWeekNumberHeaderCell = withContext(datePicker.DatePicker.WeekNumberHeaderCell, "tableHeader", {
  forwardAsChild: true,
  defaultProps: {
    "data-type": "week-number"
  }
});
const DatePickerWeekNumberCell = withContext(datePicker.DatePicker.WeekNumberCell, "tableCell", {
  forwardAsChild: true,
  defaultProps: {
    "data-type": "week-number"
  }
});
const DatePickerWeekNumberCellText = withContext("span", "tableCellTrigger", {
  forwardAsChild: true
});
const DatePickerHeader = (props) => {
  return /* @__PURE__ */ jsxRuntime.jsxs(DatePickerViewControl, { ...props, children: [
    /* @__PURE__ */ jsxRuntime.jsx(DatePickerPrevTrigger, {}),
    /* @__PURE__ */ jsxRuntime.jsx(DatePickerViewTrigger, { children: /* @__PURE__ */ jsxRuntime.jsx(DatePickerRangeText, {}) }),
    /* @__PURE__ */ jsxRuntime.jsx(DatePickerNextTrigger, {})
  ] });
};
const DatePickerDayTable = (props) => {
  const { offset, weekNumberLabel = "#", ...rest } = props;
  const ctx = datePicker.useDatePickerContext();
  const offsetDays = offset ? ctx.getOffset({ months: offset }) : void 0;
  const weeks = offsetDays ? offsetDays.weeks : ctx.weeks;
  return /* @__PURE__ */ jsxRuntime.jsxs(DatePickerTable, { ...rest, children: [
    /* @__PURE__ */ jsxRuntime.jsx(DatePickerTableHead, { children: /* @__PURE__ */ jsxRuntime.jsxs(DatePickerTableRow, { children: [
      ctx.showWeekNumbers && /* @__PURE__ */ jsxRuntime.jsx(DatePickerWeekNumberHeaderCell, { children: weekNumberLabel }),
      ctx.weekDays.map((weekDay, id) => /* @__PURE__ */ jsxRuntime.jsx(DatePickerTableHeader, { children: weekDay.narrow }, id))
    ] }) }),
    /* @__PURE__ */ jsxRuntime.jsx(DatePickerTableBody, { children: weeks.map((week, weekIndex) => /* @__PURE__ */ jsxRuntime.jsxs(DatePickerTableRow, { children: [
      ctx.showWeekNumbers && /* @__PURE__ */ jsxRuntime.jsx(DatePickerWeekNumberCell, { weekIndex, week, children: /* @__PURE__ */ jsxRuntime.jsx(DatePickerWeekNumberCellText, { children: ctx.getWeekNumber(week) }) }),
      week.map((day, id) => /* @__PURE__ */ jsxRuntime.jsx(
        DatePickerTableCell,
        {
          value: day,
          visibleRange: offsetDays?.visibleRange,
          children: /* @__PURE__ */ jsxRuntime.jsx(DatePickerTableCellTrigger, { children: day.day })
        },
        id
      ))
    ] }, weekIndex)) })
  ] });
};
const DatePickerMonthTable = (props) => {
  const datePicker$1 = datePicker.useDatePickerContext();
  const { columns = 4, format = "short", ...rest } = props;
  return /* @__PURE__ */ jsxRuntime.jsx(DatePickerTable, { ...rest, children: /* @__PURE__ */ jsxRuntime.jsx(DatePickerTableBody, { children: datePicker$1.getMonthsGrid({ columns, format }).map((months, id) => /* @__PURE__ */ jsxRuntime.jsx(DatePickerTableRow, { children: months.map((month, id2) => /* @__PURE__ */ jsxRuntime.jsx(DatePickerTableCell, { value: month.value, children: /* @__PURE__ */ jsxRuntime.jsx(DatePickerTableCellTrigger, { children: month.label }) }, id2)) }, id)) }) });
};
const DatePickerYearTable = (props) => {
  const datePicker$1 = datePicker.useDatePickerContext();
  const { columns = 4, ...rest } = props;
  return /* @__PURE__ */ jsxRuntime.jsx(DatePickerTable, { ...rest, children: /* @__PURE__ */ jsxRuntime.jsx(DatePickerTableBody, { children: datePicker$1.getYearsGrid({ columns }).map((years, id) => /* @__PURE__ */ jsxRuntime.jsx(DatePickerTableRow, { children: years.map((year, id2) => /* @__PURE__ */ jsxRuntime.jsx(DatePickerTableCell, { value: year.value, children: /* @__PURE__ */ jsxRuntime.jsx(DatePickerTableCellTrigger, { children: year.label }) }, id2)) }, id)) }) });
};
const DatePickerValue = (props) => {
  const { placeholder, value, ...rest } = props;
  const ctx = datePicker.useDatePickerContext();
  return /* @__PURE__ */ jsxRuntime.jsx(DatePickerTrigger, { asChild: true, unstyled: true, ...rest, children: /* @__PURE__ */ jsxRuntime.jsx(
    button.Button,
    {
      variant: "outline",
      width: "full",
      justifyContent: "flex-start",
      textAlign: "start",
      children: ctx.value.length ? ctx.value[0].toDate("UTC").toLocaleDateString() : placeholder ?? "Select date"
    }
  ) });
};
const DatePickerValueText = React.forwardRef((props, ref) => {
  const { children, placeholder, separator = ", ", ...localProps } = props;
  const ctx = datePicker.useDatePickerContext();
  const hasValue = ctx.value.length > 0;
  if (typeof children === "function") {
    return /* @__PURE__ */ jsxRuntime.jsx(React.Fragment, { children: hasValue ? ctx.value.map((value, index) => /* @__PURE__ */ jsxRuntime.jsx(React.Fragment, { children: children({
      value,
      index,
      valueAsString: ctx.valueAsString[index],
      remove: () => {
        ctx.setValue(ctx.value.filter((_, i) => i !== index));
      }
    }) }, index)) : placeholder });
  }
  return /* @__PURE__ */ jsxRuntime.jsx(factory.chakra.span, { ...localProps, ref, children: hasValue ? ctx.valueAsString.join(separator) : placeholder });
});
DatePickerValueText.displayName = "DatePickerValueText";

exports.DatePickerClearTrigger = DatePickerClearTrigger;
exports.DatePickerContent = DatePickerContent;
exports.DatePickerControl = DatePickerControl;
exports.DatePickerDayTable = DatePickerDayTable;
exports.DatePickerHeader = DatePickerHeader;
exports.DatePickerIndicatorGroup = DatePickerIndicatorGroup;
exports.DatePickerInput = DatePickerInput;
exports.DatePickerLabel = DatePickerLabel;
exports.DatePickerMonthSelect = DatePickerMonthSelect;
exports.DatePickerMonthTable = DatePickerMonthTable;
exports.DatePickerNextTrigger = DatePickerNextTrigger;
exports.DatePickerPositioner = DatePickerPositioner;
exports.DatePickerPresetTrigger = DatePickerPresetTrigger;
exports.DatePickerPrevTrigger = DatePickerPrevTrigger;
exports.DatePickerPropsProvider = DatePickerPropsProvider;
exports.DatePickerRangeText = DatePickerRangeText;
exports.DatePickerRoot = DatePickerRoot;
exports.DatePickerRootProvider = DatePickerRootProvider;
exports.DatePickerTable = DatePickerTable;
exports.DatePickerTableBody = DatePickerTableBody;
exports.DatePickerTableCell = DatePickerTableCell;
exports.DatePickerTableCellTrigger = DatePickerTableCellTrigger;
exports.DatePickerTableHead = DatePickerTableHead;
exports.DatePickerTableHeader = DatePickerTableHeader;
exports.DatePickerTableRow = DatePickerTableRow;
exports.DatePickerTrigger = DatePickerTrigger;
exports.DatePickerValue = DatePickerValue;
exports.DatePickerValueText = DatePickerValueText;
exports.DatePickerView = DatePickerView;
exports.DatePickerViewControl = DatePickerViewControl;
exports.DatePickerViewTrigger = DatePickerViewTrigger;
exports.DatePickerWeekNumberCell = DatePickerWeekNumberCell;
exports.DatePickerWeekNumberCellText = DatePickerWeekNumberCellText;
exports.DatePickerWeekNumberHeaderCell = DatePickerWeekNumberHeaderCell;
exports.DatePickerYearSelect = DatePickerYearSelect;
exports.DatePickerYearTable = DatePickerYearTable;
exports.useDatePickerStyles = useDatePickerStyles;
