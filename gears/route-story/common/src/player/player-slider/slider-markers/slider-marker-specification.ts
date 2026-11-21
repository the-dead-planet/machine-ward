import { ColorShade, DesignSystemColor } from "@ui";

interface SliderMarkerSpecification {
    color: DesignSystemColor;
    defaultShade: ColorShade;
    highlightedShade: ColorShade;
    borderShade: ColorShade;
    borderWidth: number;
    stickWidth: number;
    diamondSize: number;
}

export const sliderMarkerSpecification: SliderMarkerSpecification = {
    color: "tertiary",
    defaultShade: 500,
    highlightedShade: 800,
    borderShade: 500,
    borderWidth: 2,
    stickWidth: 2,
    diamondSize: 8,
};
