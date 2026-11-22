import { SliderProps, SliderRange } from "./model";
import {
    allColorShades,
    activeGlowOptions,
    appearanceColorOptions,
    DEFAULT_COLOR,
    DEFAULT_FILL_VARIANT,
    DEFAULT_SIZE,
    fillVariantOptions,
    sizeOptions,
    ColorShade,
    ThemeMode,
} from "../../design-system";
import { StoryControls } from "../../storybook";
import { stepControlsPropsStoryControl } from "../step-controls";

export const getSliderRatio = (
    value: number,
    min: number,
    max: number,
): number =>
    max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;

export const SLIDER_RANGE_EXTRA_THICKNESS = 4;

export const sliderRangeShades: Record<ThemeMode, ColorShade> = {
    light: 600,
    dark: 400,
};

export const getSliderRanges = (
    ranges: readonly SliderRange[],
    min: number,
    max: number,
): SliderRange[] => {
    if (!Array.isArray(ranges) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
        return [];
    }
    const normalized = ranges
        .filter((range: SliderRange) => range && Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start)
        .map(({ start, end }) => ({
            start: getSliderRatio(start, min, max),
            end: getSliderRatio(end, min, max),
        }))
        .filter(({ start, end }) => end > start)
        .sort((first, second) => first.start - second.start);
    const merged: SliderRange[] = [];
    for (const range of normalized) {
        const previous = merged[merged.length - 1];
        if (previous && range.start <= previous.end) {
            previous.end = Math.max(previous.end, range.end);
        } else {
            merged.push(range);
        }
    }
    return merged;
};

export const snapSliderValue = (
    value: number,
    min: number,
    max: number,
    step: number,
): number => {
    if (max <= min) {
        return min;
    }
    const interval = step > 0 ? step : 1;
    const snapped = Number(
        (min + Math.round((value - min) / interval) * interval).toPrecision(15),
    );
    return Math.max(min, Math.min(max, snapped));
};

export const sliderStoryArgs: SliderProps = {
    value: 50,
    ranges: [
        {
            start: 10,
            end: 30,
        },
        {
            start: 60,
            end: 85,
        },
    ],
    min: 0,
    max: 100,
    step: 1,
    label: "Slider",
    color: DEFAULT_COLOR,
    variant: DEFAULT_FILL_VARIANT,
    size: DEFAULT_SIZE,
    activeGlow: "none",
    highlighted: false,
    disabled: false,
    showNumberInput: false,
    showStepControls: false,
    stepControlsProps: undefined,
};

export const sliderStoryControls: StoryControls<SliderProps> = {
    ranges: {
        control: "object",
    },
    color: {
        control: "select",
        options: appearanceColorOptions,
    },
    highlightColor: {
        control: "select",
        options: ["Default", ...appearanceColorOptions],
        mapping: { Default: undefined },
    },
    glyphsShade: {
        control: "select",
        options: ["Default", ...allColorShades],
        mapping: { Default: undefined },
    },
    highlightGlyphsShade: {
        control: "select",
        options: ["Default", ...allColorShades],
        mapping: { Default: undefined },
    },
    variant: {
        control: "select",
        options: fillVariantOptions,
    },
    size: {
        control: "select",
        options: sizeOptions,
    },
    activeGlow: {
        control: "select",
        options: activeGlowOptions,
    },
    value: {
        control: {
            type: "number",
        },
    },
    min: {
        control: {
            type: "number",
        },
    },
    max: {
        control: {
            type: "number",
        },
    },
    step: {
        control: {
            type: "number",
        },
    },
    label: { control: "text" },
    highlighted: { control: "boolean" },
    disabled: { control: "boolean" },
    showNumberInput: { control: "boolean" },
    showStepControls: { control: "boolean" },
    stepControlsProps: stepControlsPropsStoryControl,
};
