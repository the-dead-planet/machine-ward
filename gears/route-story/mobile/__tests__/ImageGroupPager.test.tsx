import { fireEvent, render } from "@testing-library/react-native";
import { PropsWithChildren } from "react";
import { PressableProps, StyleSheet } from "react-native";
import { FontType, Icons } from "@ui";
import {
    shiftImageGroup,
    ImageGroupPagination,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { ImageGroupPager } from "../src/images/ImageGroupPager";
import { ImageGroupPagerDimensions } from "../src/images/model";

jest.mock("@apparatus", () => ({
    useMultipleTranslations: () => ["Previous images", "Next images"],
}));
jest.mock("@the-dead-planet/nav-gauge-gears-route-story-common", () => ({
    shiftImageGroup: jest.fn(),
    RouteStoryTranslationKey: {},
    MAP_IMAGE_GROUP_PAGER_BUTTON_SIZE: 44,
}));
jest.mock("@ui", () => ({
    FontType: { Numeric: "numeric" },
    DEFAULT_SIZE: "sm",
    Icons: { NounProject: { Previous: () => null, Next: () => null } },
}));
jest.mock("@maplibre/maplibre-react-native", () => ({
    Marker: jest.requireActual<typeof import("react-native")>("react-native")
        .View,
}));
jest.mock("@mobile-ui", () => {
    const { Pressable, Text, View } =
        jest.requireActual<typeof import("react-native")>("react-native");
    return {
        Button: ({
            children,
            ...props
        }: PropsWithChildren<Omit<PressableProps, "children">>) => (
            <Pressable {...props}>
                <Text>{children}</Text>
            </Pressable>
        ),
        Text,
        Chip: (props: PropsWithChildren) => (
            <View testID="pager-chip" {...props} />
        ),
    };
});

test("shows a filled count chip above default-size inverse buttons and reports its touch bounds", async () => {
    const pagination: ImageGroupPagination = {
        lngLat: [0, 0],
        offset: 0,
        totalCount: 15,
        hiddenCount: 10,
    };
    const dimensions: { current: ImageGroupPagerDimensions | null } = {
        current: null,
    };
    const screen = await render(
        <ImageGroupPager
            pagination={pagination}
            gearId="route-story"
            dimensions={dimensions}
        />,
    );
    expect(screen.getByText("+10")).toBeTruthy();
    expect(screen.getByText("+10").props.fontType).toBe(FontType.Numeric);
    expect(screen.getByTestId("pager-chip").props.variant).toBe("fill");
    expect(screen.getByTestId("pager-chip").props.color).toBe("tertiary");
    expect(screen.getByTestId("pager-chip").props.fontType).toBe(
        FontType.Numeric,
    );
    await fireEvent(screen.getByTestId("pager-chip"), "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 92, height: 72 } },
    });
    expect(dimensions.current).toEqual({ x: 0, y: 0, width: 92, height: 72 });
    expect(
        StyleSheet.flatten(screen.getByText("+10").props.style).fontSize,
    ).toBe(16);
    expect(screen.getByLabelText("Previous images").props.icon).toBe(
        Icons.NounProject.Previous,
    );
    expect(screen.getByLabelText("Next images").props.icon).toBe(
        Icons.NounProject.Next,
    );
    for (const label of ["Previous images", "Next images"]) {
        expect(screen.getByLabelText(label).props.size).toBe("sm");
        expect(screen.getByLabelText(label).props.variant).toBe("fill-inverse");
    }
    await fireEvent.press(screen.getByLabelText("Previous images"));
    expect(shiftImageGroup).toHaveBeenLastCalledWith(pagination, -1);
    await fireEvent.press(screen.getByLabelText("Next images"));
    expect(shiftImageGroup).toHaveBeenLastCalledWith(pagination, 1);
    const lastPage: ImageGroupPagination = {
        ...pagination,
        offset: 14,
    };
    await screen.rerender(
        <ImageGroupPager
            pagination={lastPage}
            gearId="route-story"
            dimensions={dimensions}
        />,
    );
    expect(screen.getByText("+10")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Next images"));
    expect(shiftImageGroup).toHaveBeenLastCalledWith(lastPage, 1);
    await fireEvent.press(screen.getByLabelText("Previous images"));
    expect(shiftImageGroup).toHaveBeenLastCalledWith(lastPage, -1);
    await screen.unmount();
});
