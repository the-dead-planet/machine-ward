import { fireEvent, render } from "@testing-library/react-native";
import { PropsWithChildren } from "react";
import { PressableProps } from "react-native";
import { shiftImageGroup, ImageGroupPagination } from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { ImageGroupPager } from "../src/images/ImageGroupPager";
import { ImageGroupPagerDimensions } from "../src/images/model";

jest.mock("@apparatus", () => ({
    useMultipleTranslations: () => ["Previous images", "Next images"],
}));
jest.mock("@the-dead-planet/nav-gauge-gears-route-story-common", () => ({
    shiftImageGroup: jest.fn(),
    RouteStoryTranslationKey: {},
}));
jest.mock("@ui", () => ({
    FontType: { Numeric: "numeric" },
    Icons: { NounProject: { Previous: () => null, Next: () => null } },
}));
jest.mock("@maplibre/maplibre-react-native", () => ({
    Marker: jest.requireActual<typeof import("react-native")>("react-native").View,
}));
jest.mock("@mobile-ui", () => {
    const { Pressable, Text } = jest.requireActual<typeof import("react-native")>("react-native");
    return {
        Button: ({ children, ...props }: PropsWithChildren<Omit<PressableProps, "children">>) => (
            <Pressable {...props}>
                <Text>{children}</Text>
            </Pressable>
        ),
        Chip: ({ children }: PropsWithChildren) => <Text>{children}</Text>,
    };
});

test("shows the hidden count, reports touch bounds and pages using the latest group", async () => {
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
        <ImageGroupPager pagination={pagination} gearId="route-story" dimensions={dimensions} />,
    );
    expect(screen.getByText("+10")).toBeTruthy();
    const boundsOwner = screen.container.queryAll((node) => typeof node.props.onLayout === "function")[0];
    await fireEvent(boundsOwner, "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 65, height: 54 } },
    });
    expect(dimensions.current).toEqual({ x: 0, y: 0, width: 65, height: 54 });
    await fireEvent.press(screen.getByLabelText("Previous images"));
    expect(shiftImageGroup).toHaveBeenLastCalledWith(pagination, -1);
    await fireEvent.press(screen.getByLabelText("Next images"));
    expect(shiftImageGroup).toHaveBeenLastCalledWith(pagination, 1);
    const lastPage: ImageGroupPagination = {
        ...pagination,
        offset: 14,
    };
    await screen.rerender(<ImageGroupPager pagination={lastPage} gearId="route-story" dimensions={dimensions} />);
    expect(screen.getByText("+10")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Next images"));
    expect(shiftImageGroup).toHaveBeenLastCalledWith(lastPage, 1);
    await fireEvent.press(screen.getByLabelText("Previous images"));
    expect(shiftImageGroup).toHaveBeenLastCalledWith(lastPage, -1);
    await screen.unmount();
});
