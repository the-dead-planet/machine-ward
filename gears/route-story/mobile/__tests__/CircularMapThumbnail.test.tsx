import { act, render } from "@testing-library/react-native";
import { Platform } from "react-native";
import RNFS from "react-native-fs";
import { CircularMapThumbnail } from "../src/images/CircularMapThumbnail";
import { determineSize } from "../src/images/image-parser";

const mockRasterize = jest.fn();

jest.mock("../src/images/image-parser", () => ({
    determineSize: jest.fn(),
    extractFilePathFromData: (uri: string) => uri.replace("file://", ""),
}));
jest.mock("react-native-fs", () => ({ readFile: jest.fn() }));

jest.mock("@apparatus", () => ({ glitchmitter: { transmit: jest.fn() } }));
jest.mock("@the-dead-planet/nav-gauge-gears-route-story-common", () => ({
    MAP_THUMBNAIL_SIZE: 128,
    MAP_THUMBNAIL_BORDER_SIZE: 6,
    OUTLINED_MAP_THUMBNAIL_SIZE: 140,
    getOutlinedThumbnailId: (imageId: string, color: string) => `${imageId}:outline:${color}`,
}));
jest.mock("@maplibre/maplibre-react-native", () => {
    const { View } = jest.requireActual<typeof import("react-native")>("react-native");
    return {
        Images: (props: { images: object }) => (
            <View
                testID="map-images"
                accessibilityLabel={JSON.stringify(props.images)}
            />
        ),
    };
});
jest.mock("react-native-svg", () => {
    const React = jest.requireActual<typeof import("react")>("react");
    const { View } = jest.requireActual<typeof import("react-native")>("react-native");
    return {
        __esModule: true,
        default: React.forwardRef(
            (props: import("react-native-svg").SvgProps, ref) => {
                React.useImperativeHandle(ref, () => ({ toDataURL: mockRasterize }), []);
                return (
                    <View testID="thumbnail-svg" {...props}>
                        {props.children}
                    </View>
                );
            },
        ),
        Image: (props: import("react-native-svg").ImageProps) => (
            <View testID="svg-image" {...props} />
        ),
        Circle: (props: import("react-native-svg").CircleProps) => (
            <View testID="crop-circle" {...props} />
        ),
        ClipPath: (props: import("react-native-svg").ClipPathProps) => (
            <View testID="crop-path" {...props} />
        ),
        Defs: View,
    };
});

beforeEach(() => jest.clearAllMocks());

test("bakes outlines into each sprite without decoding the photo again for colors or theme changes", async () => {
    const originalPlatform = Platform.OS;
    Platform.OS = "android";
    jest.mocked(RNFS.readFile).mockResolvedValueOnce("photo-jpeg");
    jest.mocked(determineSize).mockResolvedValueOnce({
        width: 256,
        height: 128,
    });
    try {
        const screen = await render(
            <CircularMapThumbnail
                imageId="thumbnail"
                uri="file:///cache/photo.jpg"
                outlineColors={["red", "blue"]}
            />,
        );
        expect(RNFS.readFile).toHaveBeenCalledTimes(1);
        expect(determineSize).toHaveBeenCalledTimes(1);
        const images = screen.getAllByTestId("svg-image");
        expect(
            images.map(({ props }) => [
                props.x,
                props.y,
                props.width,
                props.height,
            ]),
        ).toEqual([
            [0, 0, 128, 128],
            [6, 6, 128, 128],
            [6, 6, 128, 128],
        ]);
        expect(
            screen
                .getAllByTestId("crop-circle")
                .map(({ props }) => props.fill)
                .filter(Boolean),
        ).toEqual(["red", "blue"]);
        expect(mockRasterize.mock.calls.map((call) => call[1])).toEqual([
            { width: 128, height: 128 },
            { width: 140, height: 140 },
            { width: 140, height: 140 },
        ]);
        await act(() => mockRasterize.mock.calls.forEach((call, index) => call[0](`sprite-${index}`)));
        expect(
            screen
                .getAllByTestId("map-images")
                .map(
                    ({ props }) => Object.keys(JSON.parse(props.accessibilityLabel))[0],
                ),
        ).toEqual([
            "thumbnail",
            "thumbnail:outline:red",
            "thumbnail:outline:blue",
        ]);
        await screen.rerender(
            <CircularMapThumbnail
                imageId="thumbnail"
                uri="file:///cache/photo.jpg"
                outlineColors={["green", "yellow"]}
            />,
        );
        expect(RNFS.readFile).toHaveBeenCalledTimes(1);
        expect(determineSize).toHaveBeenCalledTimes(1);
        expect(mockRasterize).toHaveBeenCalledTimes(5);
        await screen.unmount();
    } finally {
        Platform.OS = originalPlatform;
    }
});

test("decodes Android thumbnail data before mounting and rasterizing the SVG", async () => {
    const originalPlatform = Platform.OS;
    Platform.OS = "android";
    jest.mocked(RNFS.readFile).mockResolvedValueOnce("photo-jpeg");
    let finishDecode: (size: {
        width: number;
        height: number;
    }) => void = () => {};
    jest.mocked(determineSize).mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                finishDecode = resolve;
            }),
    );
    try {
        const screen = await render(
            <CircularMapThumbnail
                imageId="thumbnail"
                uri="file:///cache/photo.jpg"
            />,
        );
        expect(RNFS.readFile).toHaveBeenCalledWith("/cache/photo.jpg", "base64");
        expect(determineSize).toHaveBeenCalledWith("data:image/jpeg;base64,photo-jpeg");
        expect(screen.queryByTestId("svg-image")).toBeNull();
        expect(mockRasterize).not.toHaveBeenCalled();
        await act(() => finishDecode({ width: 256, height: 128 }));
        expect(screen.getByTestId("svg-image").props.href).toEqual({
            uri: "data:image/jpeg;base64,photo-jpeg",
        });
        expect(mockRasterize).toHaveBeenCalledTimes(1);
        await act(() => mockRasterize.mock.calls[0][0]("cached-png"));
        expect(screen.getByTestId("map-images").props.accessibilityLabel).toContain("cached-png");
        await screen.unmount();
    } finally {
        Platform.OS = originalPlatform;
    }
});

test("crops to a circle and registers only the in-memory PNG after the image loads", async () => {
    const screen = await render(
        <CircularMapThumbnail
            imageId="thumbnail"
            uri="file:///cache/photo.jpg"
        />,
    );
    expect(screen.getByTestId("thumbnail-svg").props.viewBox).toBe("0 0 128 128");
    const image = screen.getByTestId("svg-image");
    expect(image.props.preserveAspectRatio).toBe("xMidYMid slice");
    expect(image.props.clipPath).toBe("url(#thumbnail-circle)");
    expect(screen.getByTestId("crop-path").props.id).toBe("thumbnail-circle");
    const circle = screen.getByTestId("crop-circle");
    expect([circle.props.cx, circle.props.cy, circle.props.r]).toEqual([
        "50%",
        "50%",
        "50%",
    ]);
    expect(mockRasterize).not.toHaveBeenCalled();
    await act(() => image.props.onLoad());
    expect(mockRasterize.mock.calls[0][1]).toEqual({ width: 128, height: 128 });
    await act(() => mockRasterize.mock.calls[0][0]("circular-png"));
    expect(JSON.parse(screen.getByTestId("map-images").props.accessibilityLabel)).toEqual({
        thumbnail: { source: { uri: "data:image/png;base64,circular-png" } },
    });
    await screen.unmount();
});
