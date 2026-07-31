"use strict";
"use client";
import { Marquee } from '@ark-ui/react/marquee';
import { createSlotRecipeContext } from '../../styled-system/create-slot-recipe-context.js';

const {
  withContext,
  useStyles: useMarqueeStyles,
  PropsProvider,
  withProvider
} = createSlotRecipeContext({ key: "marquee" });
const MarqueeRootProvider = withProvider(Marquee.RootProvider, "root");
const MarqueeRoot = withProvider(
  Marquee.Root,
  "root"
);
const MarqueePropsProvider = PropsProvider;
const MarqueeContent = withContext(
  Marquee.Content,
  "content",
  { forwardAsChild: true }
);
const MarqueeViewport = withContext(Marquee.Viewport, "viewport", { forwardAsChild: true });
const MarqueeItem = withContext(
  Marquee.Item,
  "item",
  { forwardAsChild: true }
);
const MarqueeEdge = withContext(
  Marquee.Edge,
  "edge"
);

export { MarqueeContent, MarqueeEdge, MarqueeItem, MarqueePropsProvider, MarqueeRoot, MarqueeRootProvider, MarqueeViewport, useMarqueeStyles };
