import { ComponentProps } from "react";
import { Pressable } from "react-native";
import {
    appearanceColorOptions,
    keycapStoryArgs,
    keycapStoryControls,
    surfaceVariantOptions,
} from "@ui";
import { Keycap } from "./Keycap";
import { VariantGallery } from "../../storybook/VariantGallery";
import { MobileStoryDefinition } from "../../storybook/model";

const story: MobileStoryDefinition<ComponentProps<typeof Keycap>> = {
    args: keycapStoryArgs,
    controls: keycapStoryControls,
    galleryEditableControls: [
        "children",
        "highlightColor",
        "highlighted",
        "disabled",
    ],
    renderPlayground: (args) => <Keycap {...args} />,
    renderGallery: (args, updateArgs) => (
        <VariantGallery
            colors={appearanceColorOptions}
            variants={surfaceVariantOptions}
            render={({ color, size, variant }) => (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Highlight ${color} ${variant} keycap`}
                    accessibilityState={{ selected: args.highlighted ?? false, disabled: args.disabled }}
                    disabled={args.disabled}
                    onPress={() => updateArgs({ highlighted: !args.highlighted })}
                >
                    <Keycap {...args} color={color} size={size} variant={variant} />
                </Pressable>
            )}
        />
    ),
};
export default story;
