import { act, fireEvent, render, renderHook } from "@testing-library/react-native";
import { GestureResponderEvent, PanResponder, PanResponderGestureState, StyleSheet, ViewInstance } from "react-native";
import {
    Orientation,
    getCompanionNumberInputWidth,
    Theme,
    ThemeContext,
    ThemeName,
    ThemeAppearanceState,
    themeSpecifications,
} from "@ui";
import { ClockInput } from "../../src/forms/clock-input/ClockInput";
import { ClockSliceInput } from "../../src/forms/clock-input/ClockSliceInput";
import { ClockDurationInput } from "../../src/forms/clock-input/ClockDurationInput";
import { useClockDrag } from "../../src/forms/clock-input/useClockDrag";

jest.mock("../../src/design-system/icons", () => ({
    Icon: () => null,
}));

const media = {
    initial: () => ({
        orientation: Orientation.Landscape,
        windowWidth: 800,
        windowHeight: 600,
    }),
    subscribe: () => ({ unsubscribe: () => undefined }),
};

test.each([
    { Clock: ClockInput, mode: "light" },
    { Clock: ClockSliceInput, mode: "dark" },
    { Clock: ClockDurationInput, mode: "light" },
] as const)("$Clock labels in $mode ignore transient dial state and honor explicit state", async ({ Clock, mode }) => {
    const createResponder = jest.spyOn(PanResponder, "create");
    const theme = new Theme(themeSpecifications[ThemeName.Default][mode], media, false);
    try {
        const content = (highlighted = false, disabled = false, value = 45) => (
            <ThemeContext.Provider value={theme}>
                <Clock
                    value={value}
                    onChange={() => {}}
                    label="Clock"
                    formatValue={() => "Value"}
                    color="intel"
                    highlightColor="hazard"
                    glyphsShade={600}
                    highlightGlyphsShade={300}
                    highlighted={highlighted}
                    disabled={disabled}
                />
            </ThemeContext.Provider>
        );
        const screen = await render(content());
        const getDial = () => {
            const dial = screen.getByRole("adjustable").children[0];
            if (!dial || typeof dial === "string") {
                throw new Error("Clock gesture view is missing");
            }
            return dial;
        };
        const responder = createResponder.mock.results[0].value;
        const expectResponder = () =>
            expect(getDial().props).toMatchObject({
                collapsable: false,
                onResponderGrant: responder.panHandlers.onResponderGrant,
                onResponderMove: responder.panHandlers.onResponderMove,
            });
        expectResponder();
        const expectLabels = (state: ThemeAppearanceState) => {
            const color = theme.resolveAppearance(undefined, "intel", "hazard", state, 600, 300).glyphs;
            expect(screen.getByText(/^Clock/)).toHaveStyle({ color });
            expect(screen.getByText("Value")).toHaveStyle({ color });
        };
        expectLabels("default");
        for (const event of ["hoverIn", "focus"]) {
            await fireEvent(screen.getByRole("adjustable"), event);
            expectLabels("default");
        }
        await screen.rerender(content(true, false, 90));
        expectResponder();
        expectLabels("active-pressed");
        await screen.rerender(content(true, true));
        expectLabels("disabled");
        expect(getDial().props.onStartShouldSetResponder()).toBe(false);
        await screen.unmount();
    } finally {
        createResponder.mockRestore();
        theme.destroy();
    }
});

test("native clock dragging measures letterboxed coordinates, keeps the latest callback and ignores late disabled measurements", async () => {
    const createResponder = jest.spyOn(PanResponder, "create");
    const onChange = jest.fn();
    const nextOnChange = jest.fn();
    const measure = jest.fn((callback: Parameters<ViewInstance["measure"]>[0]) => callback(0, 0, 200, 100, 10, 20));
    const hook = await renderHook(
        ({ value, disabled, onChange }: { value: number; disabled: boolean; onChange: (value: number) => void }) =>
            useClockDrag({
                mode: "angle",
                value,
                disabled,
                onChange,
                min: 0,
                max: 360,
                step: 1,
                center: 50,
                outerRadius: 45,
                viewBox: { x: 0, y: 0, width: 100, height: 100 },
            }),
        { initialProps: { value: 0, disabled: false, onChange } },
    );
    hook.result.current.viewRef.current = { measure } as unknown as ViewInstance;
    const responder = createResponder.mock.calls[0][0];
    const event = (pageX: number, pageY: number): GestureResponderEvent =>
        ({ nativeEvent: { pageX, pageY } }) as GestureResponderEvent;
    const gesture = {} as PanResponderGestureState;
    try {
        await act(() => responder.onPanResponderGrant!(event(155, 70), gesture));
        expect(onChange).toHaveBeenLastCalledWith(90);
        await hook.rerender({ value: 90, disabled: false, onChange: nextOnChange });
        await act(() => responder.onPanResponderMove!(event(110, 115), gesture));
        expect(nextOnChange).toHaveBeenLastCalledWith(180);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(createResponder).toHaveBeenCalledTimes(1);
        let completeMeasurement: Parameters<ViewInstance["measure"]>[0] = () => {};
        measure.mockImplementationOnce((callback) => {
            completeMeasurement = callback;
        });
        await act(() => responder.onPanResponderMove!(event(65, 70), gesture));
        await hook.rerender({ value: 180, disabled: true, onChange: nextOnChange });
        await act(() => completeMeasurement(0, 0, 200, 100, 10, 20));
        expect(nextOnChange).toHaveBeenCalledTimes(1);
        expect(responder.onStartShouldSetPanResponder!(event(110, 115), gesture)).toBe(false);
    } finally {
        await hook.unmount();
        createResponder.mockRestore();
    }
});

test.each(["start", "end", "above", "below"] as const)(
    "%s duration fields share companion sizing and only stretch in vertical layouts",
    async (numberInputPlacement) => {
        const theme = new Theme(themeSpecifications[ThemeName.Default].light, media, false);
        const screen = await render(
            <ThemeContext.Provider value={theme}>
                <ClockDurationInput
                    value={15000}
                    onChange={() => {}}
                    showNumberInput
                    showStepControls
                    numberInputPlacement={numberInputPlacement}
                    ariaLabel="Duration"
                />
            </ThemeContext.Provider>,
        );
        const fields = screen.getByLabelText("Duration (minutes)").parent?.parent?.parent?.parent?.parent;
        expect(fields).toHaveStyle({ flexDirection: "row", gap: 8 });
        const flex = StyleSheet.flatten(fields?.props.style).flex ?? 0;
        const vertical = numberInputPlacement === "above" || numberInputPlacement === "below";
        expect(flex).toBe(0);
        expect(screen.getByLabelText("Duration (minutes)").parent?.parent?.parent).toHaveStyle({
            width: getCompanionNumberInputWidth(numberInputPlacement),
        });
        expect(screen.getByLabelText("Duration (seconds)").parent?.parent?.parent).toHaveStyle({
            width: getCompanionNumberInputWidth(numberInputPlacement),
        });
        expect(StyleSheet.flatten(fields?.props.style).width).toBe(vertical ? "100%" : undefined);
        await screen.unmount();
        theme.destroy();
    },
);

test("angle and slice numeric fields display and edit their configured units", async () => {
    const theme = new Theme(themeSpecifications[ThemeName.Default].light, media, false);
    try {
        for (const Clock of [ClockInput, ClockSliceInput]) {
            const onChange = jest.fn();
            const screen = await render(
                <ThemeContext.Provider value={theme}>
                    <Clock
                        value={30}
                        min={0}
                        max={60}
                        step={6}
                        onChange={onChange}
                        showNumberInput
                        numberInputScale={6}
                        numberInputUnit="s"
                        ariaLabel="Pause"
                    />
                </ThemeContext.Provider>,
            );
            expect(screen.getByLabelText("Pause (#)").props.value).toBe("5");
            expect(screen.getByText("s")).toBeTruthy();
            await fireEvent.changeText(screen.getByLabelText("Pause (#)"), "7");
            expect(onChange).toHaveBeenLastCalledWith(42);
            await screen.unmount();
        }
    } finally {
        theme.destroy();
    }
});

test("duration number fields update their own unit and preserve the minimum duration", async () => {
    const theme = new Theme(themeSpecifications[ThemeName.Default].light, media, false);
    const onChange = jest.fn();
    const content = (value: number) => (
        <ThemeContext.Provider value={theme}>
            <ClockDurationInput value={value} min={2000} onChange={onChange} showNumberInput ariaLabel="Duration" />
        </ThemeContext.Provider>
    );
    const screen = await render(content(75000));
    await fireEvent.changeText(screen.getByLabelText("Duration (minutes)"), "2");
    expect(onChange).toHaveBeenLastCalledWith(135000);
    await fireEvent.changeText(screen.getByLabelText("Duration (seconds)"), "30");
    expect(onChange).toHaveBeenLastCalledWith(90000);
    await screen.rerender(content(2000));
    await fireEvent.changeText(screen.getByLabelText("Duration (seconds)"), "0");
    expect(onChange).toHaveBeenLastCalledWith(2000);
    await screen.unmount();
    theme.destroy();
});