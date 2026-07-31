"use strict";
'use strict';

var marquee = require('./marquee.cjs');
var namespace = require('./namespace.cjs');
var marquee$1 = require('@ark-ui/react/marquee');



exports.MarqueeContent = marquee.MarqueeContent;
exports.MarqueeEdge = marquee.MarqueeEdge;
exports.MarqueeItem = marquee.MarqueeItem;
exports.MarqueePropsProvider = marquee.MarqueePropsProvider;
exports.MarqueeRoot = marquee.MarqueeRoot;
exports.MarqueeRootProvider = marquee.MarqueeRootProvider;
exports.MarqueeViewport = marquee.MarqueeViewport;
exports.useMarqueeStyles = marquee.useMarqueeStyles;
exports.Marquee = namespace;
Object.defineProperty(exports, "useMarquee", {
  enumerable: true,
  get: function () { return marquee$1.useMarquee; }
});
Object.defineProperty(exports, "useMarqueeContext", {
  enumerable: true,
  get: function () { return marquee$1.useMarqueeContext; }
});
