import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import {
    DEFAULT_SIZE,
    Orientation,
    Theme,
    ThemeContext,
    ThemeName,
    themeSpecifications,
} from '@ui';
import {
    GallerySizeContext,
    VariantGallery,
} from '../src/storybook/VariantGallery';
import { StoryObjectControl } from '../src/storybook/StoryObjectControl';

it('renders a single gallery size and follows the drawer size context', async () => {
    const theme = new Theme(themeSpecifications[ThemeName.Default].light, {
        initial: () => ({
            orientation: Orientation.Portrait,
            windowWidth: 360,
            windowHeight: 800,
        }),
        subscribe: () => ({ unsubscribe: () => undefined }),
    });
    const gallery = (
        <VariantGallery
            colors={['primary']}
            variants={['fill']}
            render={({ size }) => <Text>{`Rendered ${size}`}</Text>}
        />
    );
    const screen = await render(
        <ThemeContext.Provider value={theme}>{gallery}</ThemeContext.Provider>,
    );
    expect(screen.getAllByText(/^Rendered /)).toHaveLength(1);
    expect(screen.getByText(`Rendered ${DEFAULT_SIZE}`)).toBeTruthy();
    await screen.rerender(
        <ThemeContext.Provider value={theme}>
            <GallerySizeContext.Provider value="lg">
                {gallery}
            </GallerySizeContext.Provider>
        </ThemeContext.Provider>,
    );
    expect(screen.getAllByText(/^Rendered /)).toHaveLength(1);
    expect(screen.getByText('Rendered lg')).toBeTruthy();
    await screen.unmount();
    theme.destroy();
});

it('keeps invalid JSON editable without publishing it and accepts corrected ranges', async () => {
    const theme = new Theme(themeSpecifications[ThemeName.Default].light, {
        initial: () => ({ orientation: Orientation.Portrait, windowWidth: 360, windowHeight: 800 }),
        subscribe: () => ({ unsubscribe: () => undefined }),
    });
    const onChange = jest.fn();
    try {
        const screen = await render(
            <ThemeContext.Provider value={theme}>
                <StoryObjectControl label="Ranges" value={[]} onChange={onChange} />
            </ThemeContext.Provider>,
        );
        await fireEvent.changeText(screen.getByDisplayValue('[]'), '[{');
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByText('Enter valid JSON.')).toBeTruthy();
        await fireEvent.changeText(screen.getByDisplayValue('[{'), '[{"start":10,"end":30}]');
        expect(onChange).toHaveBeenLastCalledWith([{ start: 10, end: 30 }]);
        expect(screen.queryByText('Enter valid JSON.')).toBeNull();
        await screen.unmount();
    } finally {
        theme.destroy();
    }
});
