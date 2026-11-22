import type { Meta, StoryObj } from "storybook-react-rsbuild";
import { makeLiveEditStory } from "storybook-addon-code-editor";
import { useArgs } from "storybook/preview-api";
import {
    appearanceColorOptions,
    fillVariantOptions,
    sliderStoryArgs,
    sliderStoryControls,
} from "@ui";
import { Slider } from "./Slider";
import { VariantGallery } from "../../storybook/VariantGallery";

const meta = {
    title: "Forms/Slider",
    component: Slider,
    decorators: [
        (Story, context) => {
            const [, updateArgs] = useArgs();
            return <Story args={{ ...context.args, onChange: (value: number) => updateArgs({ value }) }} />;
        },
    ],
    args: sliderStoryArgs,
    argTypes: {
        ...sliderStoryControls,
        onChange: { control: false },
    },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    name: "Playground with Live code editor",
};

makeLiveEditStory(Playground, {
    availableImports: { "@web-ui": { Slider } },
    code: `import { Slider } from '@web-ui';

export default Slider;`,
    modifyEditor: (monaco) => monaco.editor.setTheme("vs-dark"),
});

export const Gallery: Story = {
    argTypes: {
        color: { table: { disable: true } },
        variant: { table: { disable: true } },
    },
    render: (args) => (
        <VariantGallery
            size={args.size}
            colors={appearanceColorOptions}
            variants={fillVariantOptions}
            render={({ color, size, variant }) => (
                <Slider
                    {...args}
                    color={color}
                    size={size}
                    variant={variant}
                />
            )}
        />
    ),
};
