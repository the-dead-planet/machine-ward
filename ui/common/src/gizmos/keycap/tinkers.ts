import { KeycapProps } from "./model";
import {
    appearanceColorOptions,
    DEFAULT_COLOR,
    DEFAULT_SIZE,
    DEFAULT_SURFACE_VARIANT,
    sizeOptions,
    surfaceVariantOptions,
    FontType,
} from "../../design-system";
import { StoryControls } from "../../storybook";

export const KEYCAP_HEIGHT_INSET = 4;
export const KEYCAP_FONT_TYPE = FontType.Numeric;

export const keycapStoryArgs: KeycapProps = {
    children: "Ctrl",
    color: DEFAULT_COLOR,
    size: DEFAULT_SIZE,
    variant: DEFAULT_SURFACE_VARIANT,
    highlightColor: undefined,
    highlighted: false,
    disabled: false,
};

export const keycapStoryControls: StoryControls<KeycapProps> = {
    children: { control: "text" },
    color: { control: "select", options: appearanceColorOptions },
    size: { control: "select", options: sizeOptions },
    variant: { control: "select", options: surfaceVariantOptions },
    highlightColor: {
        control: "select",
        options: ["Default", ...appearanceColorOptions],
        mapping: { Default: undefined },
    },
    highlighted: { control: "boolean" },
    disabled: { control: "boolean" },
};
