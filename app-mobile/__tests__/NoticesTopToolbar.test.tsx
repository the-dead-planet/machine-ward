import { fireEvent, render } from "@testing-library/react-native";
import { Animated } from "react-native";
import { NoticesTopToolbar } from "../src/machine/NoticesTopToolbar";

const mockRemoveNotice = jest.fn();
let mockReducedMotion = true;

jest.mock("@apparatus", () => ({
    ...jest.requireActual("../../apparatus/common/src/machine-ward/signalium-bureau/notice-ticker"),
    useNoticeToolbarContent: () => ({
        notices: [{ id: "map", type: "glitch", text: "Map failed", error: new Error("No tiles") }],
        hints: [{ id: "hint", text: "Pick a point" }],
        onRemove: mockRemoveNotice,
    }),
    useTranslate: () => () => "Close",
}));

jest.mock("@mobile-apparatus", () => ({
    useMobileMachineWard: () => ({ toolsStation: { topToolbarSizeRef: {} }, translationKey: {} }),
}));

jest.mock("@ui", () => ({
    useTheme: () => ({ resolveAppearance: () => ({ surface: "#222222", glyphs: "#eeeeee" }), color: () => "#ffee00" }),
    withColorOpacity: (color: string) => color,
    FontType: { NeonText: "bitcount" },
    Icons: { NounProject: { Clear: () => null } },
}));

jest.mock("@mobile-ui", () => {
    const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
    return {
        Text,
        Button: ({ accessibilityLabel, onPress }: import("react-native").PressableProps) => (
            <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} />
        ),
        useReducedMotion: () => mockReducedMotion,
    };
});

test("shows the error and hint and dismisses a notice with an icon-only button", async () => {
    const screen = await render(<NoticesTopToolbar />);
    expect(screen.getByText("Map failed No tiles")).toBeVisible();
    expect(screen.getByText("Pick a point")).toBeVisible();
    expect(screen.queryByText("Close")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(mockRemoveNotice).toHaveBeenCalledWith("map");
});

test("a touch pauses the ticker and releasing it resumes at the same speed", async () => {
    mockReducedMotion = false;
    const timing = jest.spyOn(Animated, "timing").mockImplementation(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
    }));
    try {
        const screen = await render(<NoticesTopToolbar />);
        const viewport = screen.getByTestId("notice-ticker");
        await fireEvent(viewport, "layout", { nativeEvent: { layout: { width: 300 } } });
        await fireEvent(viewport, "contentSizeChange", 150, 40);
        const [value, firstPass] = timing.mock.lastCall!;
        const offset = value as Animated.Value;
        expect(firstPass).toMatchObject({ toValue: -150, duration: 30000 });

        const stopAnimation = jest.spyOn(offset, "stopAnimation");
        await fireEvent(viewport, "touchStart");
        expect(stopAnimation).toHaveBeenCalled();
        offset.setValue(150);
        await fireEvent(viewport, "touchEnd");
        expect(timing).toHaveBeenLastCalledWith(offset, expect.objectContaining({ toValue: -150, duration: 20000 }));
    } finally {
        mockReducedMotion = true;
        timing.mockRestore();
    }
});
