import { ComponentProps, FC } from "react";
import { useSliderMarkerGroups } from "@the-dead-planet/nav-gauge-gears-route-story-common";
import type { SliderMarkers } from "./SliderMarkers";
import { SliderMarkerGroup } from "./SliderMarkerGroup";
import { useSliderMarkerDrag } from "./useSliderMarkerDrag";

type Props = ComponentProps<typeof SliderMarkers> & {
    width: number;
    drag: ReturnType<typeof useSliderMarkerDrag>;
};

export const SliderMarkerGroups: FC<Props> = (props) => {
    const groups = useSliderMarkerGroups(props, props.width);

    return groups.map((group) => <SliderMarkerGroup key={group.image.id} {...props} {...group} />);
};
