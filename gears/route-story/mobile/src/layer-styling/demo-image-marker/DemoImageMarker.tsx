import { RefObject, useId } from "react";
import { HostInstance, Pressable, StyleSheet } from "react-native";
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from "react-native-svg";
import { getImageMarkerShapePath, ImageMarkerStyle, imageMarkerSizeScale, THUMBNAIL_IMAGE_SIZE } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { resolveMapImageMarkerColors, useTheme } from "@ui";

const styles = StyleSheet.create({
    preview: {
        width: 68,
        height: 68,
        alignItems: "center",
        justifyContent: "center",
    },
});

interface Props {
    value: ImageMarkerStyle;
    label: string;
    previewRef: RefObject<HostInstance | null>;
    onPress: () => void;
}

export function DemoImageMarker({ value, label, previewRef, onPress }: Props) {
    const imageClipId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const imagePath = getImageMarkerShapePath(value.shape, 100, 4);
    const imageSize = THUMBNAIL_IMAGE_SIZE * imageMarkerSizeScale[value.size];
    const { defaultColor: imageBorder } = resolveMapImageMarkerColors(useTheme());

    return (
        <Pressable
            ref={previewRef}
            style={styles.preview}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={onPress}
        >
            <Svg width={imageSize} height={imageSize} viewBox="0 0 108 108">
                <Defs>
                    <ClipPath id={imageClipId}>
                        <Path d={imagePath} />
                    </ClipPath>
                </Defs>
                <G clipPath={`url(#${imageClipId})`}>
                    <Rect width="108" height="108" fill="#8eb5bc" />
                    <Circle cx="73" cy="32" r="12" fill="#ffe4ad" />
                    <Path d="M0 92L32 44L57 77L78 54L108 90V108H0Z" fill="#345b61" />
                </G>
                <Path d={imagePath} fill="none" stroke={imageBorder} strokeWidth="7" />
            </Svg>
        </Pressable>
    );
}
