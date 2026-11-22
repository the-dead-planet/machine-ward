import { FC } from "react";
import { SliderMarkerReadoutProps, useSliderMarkerReadout } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { FontType } from "@ui";
import { Caption } from "@web-ui";
import styles from "./slider-markers.module.css";

export const SliderMarkerReadout: FC<{ preview: ReturnType<typeof useSliderMarkerReadout> }> = ({ preview }) => {
    return preview ? (
        <Caption
            fontType={FontType.Numeric}
            color="tertiary"
            tabular
            nowrap
            className={styles["drag-readout"]}
        >
            {[preview.percentage, preview.distance, preview.timestamp].filter(Boolean).join(" · ")}
        </Caption>
    ) : null;
};

export const SliderMarkerHoverReadout: FC<SliderMarkerReadoutProps> = (props) => {
    const preview = useSliderMarkerReadout(props);
    return <SliderMarkerReadout preview={preview} />;
};
