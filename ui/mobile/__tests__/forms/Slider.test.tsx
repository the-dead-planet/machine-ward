import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo, Animated, GestureResponderEvent, PanResponder, processColor, StyleSheet } from "react-native";
import {
    Orientation,
    Theme,
    ThemeContext,
    ThemeName,
    themeSpecifications,
    sizeOptions,
} from "@ui";
import { Slider } from "../../src/forms/slider/Slider";
import { SliderTrack } from "../../src/forms/slider/SliderTrack";

jest.mock(
    "../../src/design-system/icons",
    () => ({
        Icon: () => null,
    }),
);

const media = {
    initial: () => ({
        orientation: Orientation.Landscape,
        windowWidth: 800,
        windowHeight: 600,
    }),
    subscribe: () => ({ unsubscribe: () => undefined }),
};

test("slider forwards ranges into capped underlays without changing adjustable values", async () => {
    const theme = new Theme(themeSpecifications[ThemeName.Default].light, media, false);
    try {
        const screen = await render(
            <ThemeContext.Provider value={theme}>
                <Slider
                    value={50}
                    size="md"
                    ranges={[{ start: 10, end: 30 }, { start: 60, end: 85 }]}
                    color="tertiary"
                />
            </ThemeContext.Provider>,
        );
        const control = screen.getByRole("adjustable");
        const radius = theme.sizes.control.md.thumbSize / Math.SQRT2;
        await fireEvent(control, "layout", { nativeEvent: { layout: { width: 100 + 2 * radius } } });
        const polygons = screen.getAllByTestId("slider-range-track", { includeHiddenElements: true });
        expect(polygons).toHaveLength(2);
        const thickness = theme.sizes.control.md.trackThickness + 2;
        const cap = thickness / 2;
        const coordinates: number[] = polygons[0].props.d.slice(1, -1).split(/[ ,]/).map(Number);
        const expected = [0, cap, cap, 0, 20 - cap, 0, 20, cap, 20 - cap, thickness, cap, thickness];
        coordinates.forEach((coordinate, index) => expect(coordinate).toBeCloseTo(expected[index]));
        const color = theme.color("tertiary", 500);
        const paint = { type: 0, payload: processColor(color) };
        expect(polygons.map((polygon) => polygon.props.fill)).toEqual([paint, paint]);
        await fireEvent(control, "focus");
        expect(screen.getAllByTestId("slider-range-track", { includeHiddenElements: true }).map((polygon) => polygon.props.fill)).toEqual([paint, paint]);
        expect(control.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 50 });
        await screen.unmount();
    } finally {
        theme.destroy();
    }
});

test("the full endpoint diamonds stay inside the touch area and can start drags at every size", async () => {
    const theme = new Theme(themeSpecifications[ThemeName.Default].light, media, false);
    const create = jest.spyOn(PanResponder, "create");
    try {
        for (const size of sizeOptions) {
            const radius = theme.sizes.control[size].thumbSize / Math.SQRT2;
            for (const value of [0, 100]) {
                const onChange = jest.fn();
                const screen = await render(
                    <ThemeContext.Provider value={theme}>
                        <SliderTrack value={value} onChange={onChange} size={size} />
                    </ThemeContext.Provider>,
                );
                const control = screen.getByRole("adjustable");
                const margin: number = StyleSheet.flatten(control.props.style).marginHorizontal;
                expect(margin).toBeLessThan(0);
                expect(margin + radius).toBeCloseTo(theme.sizes.control[size].thumbSize / 2);
                const track = control.children[0];
                if (typeof track === "string") {
                    throw new Error("Expected the slider track");
                }
                expect(track).toHaveStyle({ marginHorizontal: radius });
                await fireEvent(control, "layout", { nativeEvent: { layout: { width: 100 + 2 * radius } } });
                const handlers = create.mock.calls.at(-1)![0];
                const gesture = {} as Parameters<NonNullable<typeof handlers.onPanResponderGrant>>[1];
                const locationX = value === 0 ? radius / 2 : 100 + radius * 1.5;
                const touch = (pageX: number) => ({ nativeEvent: { locationX, pageX } }) as GestureResponderEvent;
                await act(() => handlers.onPanResponderGrant?.(touch(200), gesture));
                expect(onChange).not.toHaveBeenCalled();
                const movement = value === 0 ? 50 + radius / 2 : -50 - radius / 2;
                await act(() => handlers.onPanResponderMove?.(touch(200 + movement), gesture));
                expect(onChange).toHaveBeenLastCalledWith(50);
                await act(() => handlers.onPanResponderRelease?.(touch(200 + movement), gesture));
                await screen.unmount();
            }
        }
    } finally {
        create.mockRestore();
        theme.destroy();
    }
});

test("native slider labels stay independent while the thumb animates once and number controls update values", async () => {
    const theme = new Theme(
        themeSpecifications[ThemeName.Default].light,
        media,
        false,
    );
    const preference = jest
        .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
        .mockResolvedValue(false);
    const animation = {
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
    };
    const timing = jest.spyOn(Animated, "timing").mockReturnValue(animation);
    const onChange = jest.fn();
    const content = (disabled = false) => (
        <ThemeContext.Provider value={theme}>
            <Slider
                label="Position"
                value={50}
                onChange={onChange}
                activeGlow="animate-borders-glow"
                showNumberInput
                disabled={disabled}
            />
        </ThemeContext.Provider>
    );

    try {
        const screen = await render(content());
        let wrapper = screen.getByRole("adjustable").parent;
        for (let index = 0; index < 3; index++) {
            expect(wrapper?.props.pointerEvents).toBe("box-none");
            wrapper = wrapper?.parent ?? null;
        }
        const labelColor = StyleSheet.flatten(
            screen.getByText("Position").props.style,
        ).color;
        await fireEvent(screen.getByRole("adjustable"), "focus");
        expect(
            StyleSheet.flatten(screen.getByText("Position").props.style).color,
        ).toBe(labelColor);
        await waitFor(() => expect(timing).toHaveBeenCalledTimes(1));
        expect(timing).toHaveBeenCalledWith(
            expect.any(Animated.Value),
            expect.objectContaining({
                duration: 400,
                toValue: 1,
                useNativeDriver: false,
            }),
        );
        expect(animation.start).toHaveBeenCalledTimes(1);
        await fireEvent.changeText(screen.getByLabelText("Position (#)"), "75");
        expect(onChange).toHaveBeenLastCalledWith(75);
        await screen.rerender(content(true));
        expect(animation.stop).toHaveBeenCalled();
        expect(
            screen.getByRole("adjustable").props.accessibilityState.disabled,
        ).toBe(true);
        await screen.unmount();
    } finally {
        timing.mockRestore();
        preference.mockRestore();
        theme.destroy();
    }
});
