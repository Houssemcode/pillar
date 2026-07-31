"use strict";
"use client";
'use strict';

var marquee = require('@ark-ui/react/marquee');
var createSlotRecipeContext = require('../../styled-system/create-slot-recipe-context.cjs');

const {
  withContext,
  useStyles: useMarqueeStyles,
  PropsProvider,
  withProvider
} = createSlotRecipeContext.createSlotRecipeContext({ key: "marquee" });
const MarqueeRootProvider = withProvider(marquee.Marquee.RootProvider, "root");
const MarqueeRoot = withProvider(
  marquee.Marquee.Root,
  "root"
);
const MarqueePropsProvider = PropsProvider;
const MarqueeContent = withContext(
  marquee.Marquee.Content,
  "content",
  { forwardAsChild: true }
);
const MarqueeViewport = withContext(marquee.Marquee.Viewport, "viewport", { forwardAsChild: true });
const MarqueeItem = withContext(
  marquee.Marquee.Item,
  "item",
  { forwardAsChild: true }
);
const MarqueeEdge = withContext(
  marquee.Marquee.Edge,
  "edge"
);

exports.MarqueeContent = MarqueeContent;
exports.MarqueeEdge = MarqueeEdge;
exports.MarqueeItem = MarqueeItem;
exports.MarqueePropsProvider = MarqueePropsProvider;
exports.MarqueeRoot = MarqueeRoot;
exports.MarqueeRootProvider = MarqueeRootProvider;
exports.MarqueeViewport = MarqueeViewport;
exports.useMarqueeStyles = useMarqueeStyles;
