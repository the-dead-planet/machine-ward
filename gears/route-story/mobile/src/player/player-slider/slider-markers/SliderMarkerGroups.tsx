import { ComponentProps, FC } from "react";
import { useSliderMarkerGroups } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { MARKER_TOUCH_WIDTH } from "./slider-markers.styles";
import type { SliderMarkers } from "./SliderMarkers";
import { SliderMarkerGroup } from "./SliderMarkerGroup";

type Props = ComponentProps<typeof SliderMarkers> & {
    width: number;
};

export const SliderMarkerGroups: FC<Props> = (props) => {
    const groups = useSliderMarkerGroups(props, props.width).sort((left, right) => left.percent - right.percent);

    return groups.map((group, index) => {
        const previousGap = index > 0 ? (group.percent - groups[index - 1].percent) * props.width / 100 : MARKER_TOUCH_WIDTH;
        const nextGap = index < groups.length - 1 ? (groups[index + 1].percent - group.percent) * props.width / 100 : MARKER_TOUCH_WIDTH;
        const touchWidth = Math.min(MARKER_TOUCH_WIDTH, previousGap, nextGap);

        return <SliderMarkerGroup key={group.image.id} {...props} {...group} touchWidth={touchWidth} />;
    });
};
