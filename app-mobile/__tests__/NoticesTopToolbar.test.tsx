import { fireEvent, render } from "@testing-library/react-native";
import { NoticesTopToolbar } from "../src/machine/NoticesTopToolbar";

const mockRemoveNotice = jest.fn();

jest.mock("@apparatus", () => ({
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
    useTheme: () => ({ resolveAppearance: () => ({ surface: "#222222" }), color: () => "#ffee00" }),
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
        useReducedMotion: () => true,
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
