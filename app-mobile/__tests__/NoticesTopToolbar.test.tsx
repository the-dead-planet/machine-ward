import { ReactNode } from "react";
import { fireEvent, render, within } from "@testing-library/react-native";
import { Animated } from "react-native";
import type { SignaliumNotice } from "@apparatus";
import { NoticesTopToolbar } from "../src/machine/notices/NoticesTopToolbar";

const mockRemoveNotice = jest.fn();
let mockReducedMotion = true;

const notice: SignaliumNotice = { id: "map", type: "glitch", text: "Map failed", error: new Error("No tiles") };
let mockNotices: SignaliumNotice[] = [notice];

jest.mock("@apparatus", () => ({
    ...jest.requireActual("../../apparatus/common/src/machine-ward/signalium-bureau/notice-ticker"),
    ...jest.requireActual("../../apparatus/common/src/machine-ward/signalium-bureau/useNoticeReader"),
    useNoticeToolbarContent: () => ({
        language: "en",
        notices: mockNotices,
        onRemove: mockRemoveNotice,
    }),
    useTranslate: () => ({ t }: { t: string }) => {
        const labels: Record<string, string> = {
            notices: "Notices",
            "remove-notice": "Remove notice",
            glitch: "Glitch",
            intel: "Intel",
            secured: "Secured",
        };
        return labels[t] ?? "Close";
    },
}));

beforeEach(() => {
    mockNotices = [notice];
    mockRemoveNotice.mockClear();
});

jest.mock("@mobile-apparatus", () => ({
    useMobileMachineWard: () => ({
        toolsStation: { topToolbarSizeRef: {} },
        translationKey: { Notices: "notices", RemoveNotice: "remove-notice" },
    }),
}));

jest.mock("@ui", () => ({
    useTheme: () => ({
        resolveAppearance: () => ({ surface: "#222222", glyphs: "#eeeeee" }),
        color: () => "#ffee00",
    }),
    withColorOpacity: (color: string) => color,
    FontType: { NeonText: "bitcount", Numeric: "numeric" },
    Icons: { NounProject: { CloseCross: () => null } },
}));

jest.mock("@mobile-ui", () => {
    const { Pressable, Text, View } = jest.requireActual<typeof import("react-native")>("react-native");
    return {
        Text,
        Tooltip: ({ children }: { children: ReactNode }) => children,
        Icon: () => null,
        Panel: View,
        Popup: ({ children }: { children: ReactNode }) => <View testID="notice-popup">{children}</View>,
        Button: ({ accessibilityLabel, onPress }: import("react-native").PressableProps) => (
            <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} />
        ),
        useReducedMotion: () => mockReducedMotion,
    };
});

test("counts present notice types and keeps opened messages after expiration", async () => {
    mockNotices.unshift({ id: "copy", type: "intel", text: "Copied" });
    mockNotices.push({ id: "save", type: "secured", text: "Saved successfully" });
    const screen = await render(<NoticesTopToolbar />);
    expect(within(screen.getByTestId("notice-ticker")).getByText("Saved successfully")).toBeVisible();
    await fireEvent.press(screen.getByRole("button", { name: "Notices — Glitch: 1, Intel: 1, Secured: 1" }));

    mockNotices = [];
    await screen.rerender(<NoticesTopToolbar />);
    expect(screen.queryByRole("button", { name: /Notices/ })).toBeNull();
    expect(within(screen.getByTestId("notice-popup")).getByText("Copied")).toBeVisible();
    expect(within(screen.getByTestId("notice-popup")).getByText("Map failed No tiles")).toBeVisible();
    expect(within(screen.getByTestId("notice-popup")).getByText("Saved successfully")).toBeVisible();
    await fireEvent.press(within(screen.getByTestId("notice-popup")).getAllByRole("button", { name: "Remove notice" })[0]);
    expect(mockRemoveNotice).toHaveBeenCalledWith("copy");
    expect(within(screen.getByTestId("notice-popup")).queryByText("Copied")).toBeNull();
});

test("shows and removes a notice from the ticker", async () => {
    const screen = await render(<NoticesTopToolbar />);
    expect(within(screen.getByTestId("notice-ticker")).getByText("Map failed No tiles")).toBeVisible();
    expect(screen.queryByText("Remove notice")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Remove notice" }));
    expect(mockRemoveNotice).toHaveBeenCalledWith("map");
});

test("expands from the border to the measured height when the first notice arrives", async () => {
    mockNotices = [];
    const screen = await render(<NoticesTopToolbar />);
    expect(screen.getByTestId("notices-toolbar")).toHaveStyle({ height: 1 });

    mockNotices = [notice];
    await screen.rerender(<NoticesTopToolbar />);
    const content = screen.getByTestId("notices-content");
    await fireEvent(content, "layout", { nativeEvent: { layout: { height: 35 } } });
    expect(screen.getByTestId("notices-toolbar")).toHaveStyle({ height: 36 });

    mockNotices = [];
    await screen.rerender(<NoticesTopToolbar />);
    expect(screen.queryByTestId("notice-ticker")).toBeNull();
    expect(screen.getByTestId("notices-toolbar")).toHaveStyle({ height: 1 });
});

test("a tap pauses the ticker and the next tap resumes at the same speed", async () => {
    mockReducedMotion = false;
    const timing = jest.spyOn(Animated, "timing").mockImplementation(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
    }));
    const tickerCalls = () => timing.mock.calls.filter(([, config]) => config.useNativeDriver);
    try {
        const screen = await render(<NoticesTopToolbar />);
        const viewport = screen.getByTestId("notice-ticker");
        await fireEvent(viewport, "layout", { nativeEvent: { layout: { width: 300 } } });
        await fireEvent(viewport, "contentSizeChange", 150, 40);
        const [value, firstPass] = tickerCalls()[0];
        const offset = value as Animated.Value;
        expect(firstPass).toMatchObject({ toValue: -150, duration: 6000 });

        const stopAnimation = jest.spyOn(offset, "stopAnimation");
        await fireEvent(viewport, "touchStart");
        expect(stopAnimation).toHaveBeenCalled();
        await fireEvent(viewport, "touchEnd");
        expect(tickerCalls()).toHaveLength(1);

        offset.setValue(150);
        await fireEvent(viewport, "touchStart");
        expect(tickerCalls()[1][1]).toMatchObject({ toValue: -150, duration: 4000 });
    } finally {
        mockReducedMotion = true;
        timing.mockRestore();
    }
});
