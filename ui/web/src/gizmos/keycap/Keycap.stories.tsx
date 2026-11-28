import type { Meta, StoryObj } from "storybook-react-rsbuild";
import { useArgs } from "storybook/preview-api";
import { makeLiveEditStory } from "storybook-addon-code-editor";
import {
    appearanceColorOptions,
    keycapStoryArgs,
    keycapStoryControls,
    surfaceVariantOptions,
} from "@ui";
import { Keycap } from "./Keycap";
import styles from "./keycap-stories.module.css";
import { VariantGallery } from "../../storybook/VariantGallery";

const meta = {
    title: "Gizmos/Keycap",
    component: Keycap,
    args: keycapStoryArgs,
    argTypes: keycapStoryControls,
} satisfies Meta<typeof Keycap>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    name: "Playground with Live code editor",
};
makeLiveEditStory(Playground, {
    availableImports: { "@web-ui": { Keycap } },
    code: `import { Keycap } from '@web-ui';

export default Keycap;`,
});

export const Gallery: Story = {
    argTypes: {
        color: { table: { disable: true } },
        variant: { table: { disable: true } },
    },
    render: function Render(args) {
        const [, updateArgs] = useArgs();

        return (
            <VariantGallery
                size={args.size}
                colors={appearanceColorOptions}
                variants={surfaceVariantOptions}
                render={({ color, size, variant }) => (
                    <button
                        type="button"
                        className={styles.cellButton}
                        aria-label={`Highlight ${color} ${variant} keycap`}
                        aria-pressed={args.highlighted ?? false}
                        disabled={args.disabled}
                        onClick={() => updateArgs({ highlighted: !args.highlighted })}
                    >
                        <Keycap {...args} color={color} size={size} variant={variant} />
                    </button>
                )}
            />
        );
    },
};
