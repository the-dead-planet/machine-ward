import { ComponentProps } from "react";
import {
    appearanceColorOptions,
    fillVariantOptions,
    sliderStoryArgs,
    sliderStoryControls,
} from "@ui";
import { Slider } from "./Slider";
import { VariantGallery } from "../../storybook/VariantGallery";
import { MobileStoryDefinition } from "../../storybook/model";

const story: MobileStoryDefinition<ComponentProps<typeof Slider>> = {
    args: sliderStoryArgs,
    controls: sliderStoryControls,
    galleryEditableControls: [
        "value",
        "ranges",
        "rangeColor",
        "min",
        "max",
        "step",
        "label",
        "highlightColor",
        "glyphsShade",
        "highlightGlyphsShade",
        "activeGlow",
        "highlighted",
        "disabled",
        "showNumberInput",
        "showStepControls",
        "stepControlsProps",
    ],
    renderPlayground: (args, updateArgs) => <Slider {...args} onChange={(value) => updateArgs({ value })} />,
    renderGallery: (args, updateArgs) => (
        <VariantGallery
            size={args.size}
            colors={appearanceColorOptions}
            variants={fillVariantOptions}
            render={({ color, size, variant }) => (
                <Slider
                    {...args}
                    onChange={(value) => updateArgs({ value })}
                    color={color}
                    size={size}
                    variant={variant}
                />
            )}
        />
    ),
};

export default story;
