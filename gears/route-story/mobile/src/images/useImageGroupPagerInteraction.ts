import { RefObject, useRef } from "react";
import { LayoutChangeEvent, LayoutRectangle, NativeSyntheticEvent } from "react-native";
import { MarkerEvent } from "@maplibre/maplibre-react-native";
import { ImageGroupPagination, shiftImageGroup } from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { ImageGroupPagerDimensions } from "./model";

export const useImageGroupPagerInteraction = (
    pagination: ImageGroupPagination,
    position: RefObject<[number, number] | null>,
    dimensions: RefObject<ImageGroupPagerDimensions | null>,
) => {
    const controls = useRef<LayoutRectangle | null>(null);

    return {
        onControlsLayout: (event: LayoutChangeEvent) => {
            controls.current = event.nativeEvent.layout;
        },
        onPress: (event: NativeSyntheticEvent<MarkerEvent>) => {
            event.stopPropagation();
            const center = position.current;
            const size = dimensions.current;
            const bounds = controls.current;
            if (!center || !size || !bounds) {
                return;
            }
            const [pointX, pointY] = event.nativeEvent.point;
            const x = pointX - center[0] + size.width / 2;
            const y = pointY - center[1] + size.height / 2;
            if (x < bounds.x || x > bounds.x + bounds.width || y < bounds.y || y > bounds.y + bounds.height) {
                return;
            }
            shiftImageGroup(pagination, x < bounds.x + bounds.width / 2 ? -1 : 1);
        },
    };
};
