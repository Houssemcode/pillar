"use strict";
"use client";
import { jsx, jsxs } from 'react/jsx-runtime';
import '@ark-ui/react';
import { DatePicker, useDatePickerContext } from '@ark-ui/react/date-picker';
import { forwardRef, Fragment } from 'react';
import { createSlotRecipeContext } from '../../styled-system/create-slot-recipe-context.js';
import { chakra } from '../../styled-system/factory.js';
import { Button } from '../button/button.js';
import { CloseIcon, ChevronRightIcon, ChevronLeftIcon } from '../icons.js';

const {
  withProvider,
  withContext,
  useStyles: useDatePickerStyles,
  PropsProvider
} = createSlotRecipeContext({ key: "datePicker" });
const DatePickerRootProvider = withProvider(DatePicker.RootProvider, "root", { forwardAsChild: true });
const DatePickerRoot = withProvider(
  DatePicker.Root,
  "root",
  {
    forwardAsChild: true
  }
);
const DatePickerPropsProvider = PropsProvider;
const DatePickerClearTrigger = withContext(DatePicker.ClearTrigger, "clearTrigger", {
  forwardAsChild: true,
  defaultProps: {
    children: /* @__PURE__ */ jsx(CloseIcon, {})
  }
});
const DatePickerContent = withContext(DatePicker.Content, "content", { forwardAsChild: true });
const DatePickerControl = withContext(DatePicker.Control, "control", { forwardAsChild: true });
const DatePickerInput = withContext(DatePicker.Input, "input", { forwardAsChild: true });
const DatePickerLabel = withContext(DatePicker.Label, "label", { forwardAsChild: true });
const DatePickerMonthSelect = withContext(DatePicker.MonthSelect, "monthSelect", { forwardAsChild: true });
const DatePickerNextTrigger = withContext(DatePicker.NextTrigger, "nextTrigger", {
  forwardAsChild: true,
  defaultProps: {
    children: /* @__PURE__ */ jsx(ChevronRightIcon, {})
  }
});
const DatePickerPositioner = withContext(DatePicker.Positioner, "positioner", { forwardAsChild: true });
const DatePickerPresetTrigger = withContext(DatePicker.PresetTrigger, "presetTrigger", { forwardAsChild: true });
const DatePickerPrevTrigger = withContext(DatePicker.PrevTrigger, "prevTrigger", {
  forwardAsChild: true,
  defaultProps: {
    children: /* @__PURE__ */ jsx(ChevronLeftIcon, {})
  }
});
const DatePickerRangeText = withContext(DatePicker.RangeText, "rangeText", { forwardAsChild: true });
const DatePickerTable = withContext(DatePicker.Table, "table", { forwardAsChild: true });
const DatePickerTableBody = withContext(DatePicker.TableBody, "tableBody", { forwardAsChild: true });
const DatePickerTableCell = withContext(DatePicker.TableCell, "tableCell", { forwardAsChild: true });
const DatePickerTableCellTrigger = withContext(DatePicker.TableCellTrigger, "tableCellTrigger", { forwardAsChild: true });
const DatePickerTableHead = withContext(DatePicker.TableHead, "tableHead", { forwardAsChild: true });
const DatePickerTableHeader = withContext(DatePicker.TableHeader, "tableHeader", { forwardAsChild: true });
const DatePickerTableRow = withContext(DatePicker.TableRow, "tableRow", { forwardAsChild: true });
const DatePickerTrigger = withContext(DatePicker.Trigger, "trigger", {
  forwardAsChild: true
});
const DatePickerView = withContext(
  DatePicker.View,
  "view",
  { forwardAsChild: true }
);
const DatePickerViewControl = withContext(DatePicker.ViewControl, "viewControl", { forwardAsChild: true });
const DatePickerViewTrigger = withContext(DatePicker.ViewTrigger, "viewTrigger", { forwardAsChild: true });
const DatePickerYearSelect = withContext(DatePicker.YearSelect, "yearSelect", { forwardAsChild: true });
const DatePickerIndicatorGroup = withContext("div", "indicatorGroup");
const DatePickerWeekNumberHeaderCell = withContext(DatePicker.WeekNumberHeaderCell, "tableHeader", {
  forwardAsChild: true,
  defaultProps: {
    "data-type": "week-number"
  }
});
const DatePickerWeekNumberCell = withContext(DatePicker.WeekNumberCell, "tableCell", {
  forwardAsChild: true,
  defaultProps: {
    "data-type": "week-number"
  }
});
const DatePickerWeekNumberCellText = withContext("span", "tableCellTrigger", {
  forwardAsChild: true
});
const DatePickerHeader = (props) => {
  return /* @__PURE__ */ jsxs(DatePickerViewControl, { ...props, children: [
    /* @__PURE__ */ jsx(DatePickerPrevTrigger, {}),
    /* @__PURE__ */ jsx(DatePickerViewTrigger, { children: /* @__PURE__ */ jsx(DatePickerRangeText, {}) }),
    /* @__PURE__ */ jsx(DatePickerNextTrigger, {})
  ] });
};
const DatePickerDayTable = (props) => {
  const { offset, weekNumberLabel = "#", ...rest } = props;
  const ctx = useDatePickerContext();
  const offsetDays = offset ? ctx.getOffset({ months: offset }) : void 0;
  const weeks = offsetDays ? offsetDays.weeks : ctx.weeks;
  return /* @__PURE__ */ jsxs(DatePickerTable, { ...rest, children: [
    /* @__PURE__ */ jsx(DatePickerTableHead, { children: /* @__PURE__ */ jsxs(DatePickerTableRow, { children: [
      ctx.showWeekNumbers && /* @__PURE__ */ jsx(DatePickerWeekNumberHeaderCell, { children: weekNumberLabel }),
      ctx.weekDays.map((weekDay, id) => /* @__PURE__ */ jsx(DatePickerTableHeader, { children: weekDay.narrow }, id))
    ] }) }),
    /* @__PURE__ */ jsx(DatePickerTableBody, { children: weeks.map((week, weekIndex) => /* @__PURE__ */ jsxs(DatePickerTableRow, { children: [
      ctx.showWeekNumbers && /* @__PURE__ */ jsx(DatePickerWeekNumberCell, { weekIndex, week, children: /* @__PURE__ */ jsx(DatePickerWeekNumberCellText, { children: ctx.getWeekNumber(week) }) }),
      week.map((day, id) => /* @__PURE__ */ jsx(
        DatePickerTableCell,
        {
          value: day,
          visibleRange: offsetDays?.visibleRange,
          children: /* @__PURE__ */ jsx(DatePickerTableCellTrigger, { children: day.day })
        },
        id
      ))
    ] }, weekIndex)) })
  ] });
};
const DatePickerMonthTable = (props) => {
  const datePicker = useDatePickerContext();
  const { columns = 4, format = "short", ...rest } = props;
  return /* @__PURE__ */ jsx(DatePickerTable, { ...rest, children: /* @__PURE__ */ jsx(DatePickerTableBody, { children: datePicker.getMonthsGrid({ columns, format }).map((months, id) => /* @__PURE__ */ jsx(DatePickerTableRow, { children: months.map((month, id2) => /* @__PURE__ */ jsx(DatePickerTableCell, { value: month.value, children: /* @__PURE__ */ jsx(DatePickerTableCellTrigger, { children: month.label }) }, id2)) }, id)) }) });
};
const DatePickerYearTable = (props) => {
  const datePicker = useDatePickerContext();
  const { columns = 4, ...rest } = props;
  return /* @__PURE__ */ jsx(DatePickerTable, { ...rest, children: /* @__PURE__ */ jsx(DatePickerTableBody, { children: datePicker.getYearsGrid({ columns }).map((years, id) => /* @__PURE__ */ jsx(DatePickerTableRow, { children: years.map((year, id2) => /* @__PURE__ */ jsx(DatePickerTableCell, { value: year.value, children: /* @__PURE__ */ jsx(DatePickerTableCellTrigger, { children: year.label }) }, id2)) }, id)) }) });
};
const DatePickerValue = (props) => {
  const { placeholder, value, ...rest } = props;
  const ctx = useDatePickerContext();
  return /* @__PURE__ */ jsx(DatePickerTrigger, { asChild: true, unstyled: true, ...rest, children: /* @__PURE__ */ jsx(
    Button,
    {
      variant: "outline",
      width: "full",
      justifyContent: "flex-start",
      textAlign: "start",
      children: ctx.value.length ? ctx.value[0].toDate("UTC").toLocaleDateString() : placeholder ?? "Select date"
    }
  ) });
};
const DatePickerValueText = forwardRef((props, ref) => {
  const { children, placeholder, separator = ", ", ...localProps } = props;
  const ctx = useDatePickerContext();
  const hasValue = ctx.value.length > 0;
  if (typeof children === "function") {
    return /* @__PURE__ */ jsx(Fragment, { children: hasValue ? ctx.value.map((value, index) => /* @__PURE__ */ jsx(Fragment, { children: children({
      value,
      index,
      valueAsString: ctx.valueAsString[index],
      remove: () => {
        ctx.setValue(ctx.value.filter((_, i) => i !== index));
      }
    }) }, index)) : placeholder });
  }
  return /* @__PURE__ */ jsx(chakra.span, { ...localProps, ref, children: hasValue ? ctx.valueAsString.join(separator) : placeholder });
});
DatePickerValueText.displayName = "DatePickerValueText";

export { DatePickerClearTrigger, DatePickerContent, DatePickerControl, DatePickerDayTable, DatePickerHeader, DatePickerIndicatorGroup, DatePickerInput, DatePickerLabel, DatePickerMonthSelect, DatePickerMonthTable, DatePickerNextTrigger, DatePickerPositioner, DatePickerPresetTrigger, DatePickerPrevTrigger, DatePickerPropsProvider, DatePickerRangeText, DatePickerRoot, DatePickerRootProvider, DatePickerTable, DatePickerTableBody, DatePickerTableCell, DatePickerTableCellTrigger, DatePickerTableHead, DatePickerTableHeader, DatePickerTableRow, DatePickerTrigger, DatePickerValue, DatePickerValueText, DatePickerView, DatePickerViewControl, DatePickerViewTrigger, DatePickerWeekNumberCell, DatePickerWeekNumberCellText, DatePickerWeekNumberHeaderCell, DatePickerYearSelect, DatePickerYearTable, useDatePickerStyles };
