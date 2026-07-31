import type { Assign } from "@ark-ui/react";
import { Marquee as ArkMarquee } from "@ark-ui/react/marquee";
import { type HTMLChakraProps, type SlotRecipeProps, type UnstyledProp } from "../../styled-system";
declare const useMarqueeStyles: () => Record<string, import("../..").SystemStyleObject>;
export { useMarqueeStyles };
export interface MarqueeRootProviderBaseProps extends Assign<ArkMarquee.RootProviderBaseProps, SlotRecipeProps<"marquee">>, UnstyledProp {
}
export interface MarqueeRootProviderProps extends MarqueeRootProviderBaseProps {
    children: React.ReactNode;
}
export declare const MarqueeRootProvider: import("react").ForwardRefExoticComponent<MarqueeRootProviderProps & import("react").RefAttributes<HTMLDivElement>>;
export interface MarqueeRootBaseProps extends Assign<ArkMarquee.RootBaseProps, SlotRecipeProps<"marquee">>, UnstyledProp {
}
export interface MarqueeRootProps extends HTMLChakraProps<"div", MarqueeRootBaseProps> {
}
export declare const MarqueeRoot: import("react").ForwardRefExoticComponent<MarqueeRootProps & import("react").RefAttributes<HTMLDivElement>>;
export declare const MarqueePropsProvider: React.Provider<MarqueeRootBaseProps>;
export interface MarqueeContentProps extends HTMLChakraProps<"div", ArkMarquee.ContentBaseProps>, UnstyledProp {
}
export declare const MarqueeContent: import("react").ForwardRefExoticComponent<MarqueeContentProps & import("react").RefAttributes<HTMLDivElement>>;
export interface MarqueeViewportProps extends HTMLChakraProps<"div", ArkMarquee.ViewportBaseProps>, UnstyledProp {
}
export declare const MarqueeViewport: import("react").ForwardRefExoticComponent<MarqueeViewportProps & import("react").RefAttributes<HTMLDivElement>>;
export interface MarqueeItemProps extends HTMLChakraProps<"div", ArkMarquee.ItemBaseProps>, UnstyledProp {
}
export declare const MarqueeItem: import("react").ForwardRefExoticComponent<MarqueeItemProps & import("react").RefAttributes<HTMLDivElement>>;
export interface MarqueeEdgeProps extends HTMLChakraProps<"div">, Assign<ArkMarquee.EdgeBaseProps, UnstyledProp> {
}
export declare const MarqueeEdge: import("react").ForwardRefExoticComponent<MarqueeEdgeProps & import("react").RefAttributes<HTMLDivElement>>;
