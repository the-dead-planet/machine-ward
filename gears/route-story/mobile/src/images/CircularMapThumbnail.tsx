import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, Image } from "react-native-svg";
import { Images } from "@maplibre/maplibre-react-native";
import RNFS from "react-native-fs";
import {
    getOutlinedThumbnailId,
    MAP_THUMBNAIL_SIZE,
    MAP_THUMBNAIL_BORDER_SIZE,
    OUTLINED_MAP_THUMBNAIL_SIZE,
} from "@the-dead-planet/nav-gauge-gears-route-story-common";
import { glitchmitter } from "@apparatus";
import { determineSize, extractFilePathFromData } from "./image-parser";

const styles = StyleSheet.create({
    rasterizer: {
        position: "absolute",
        left: -OUTLINED_MAP_THUMBNAIL_SIZE,
        width: OUTLINED_MAP_THUMBNAIL_SIZE,
        height: OUTLINED_MAP_THUMBNAIL_SIZE,
    },
});

interface Props {
    imageId: string;
    uri: string;
    outlineColors?: string[];
}

const useThumbnailImage = (uri: string) => {
    const [imageUri, setImageUri] = useState(
        Platform.OS === "android" ? null : uri,
    );

    useEffect(() => {
        if (Platform.OS !== "android") {
            return;
        }
        let isCurrent = true;
        // Android getSize decodes data URIs, but only reads metadata for file URIs.
        void RNFS.readFile(extractFilePathFromData(uri), "base64")
            .then(async (base64) => {
                const dataUri = `data:image/jpeg;base64,${base64}`;
                await determineSize(dataUri);
                if (isCurrent) {
                    setImageUri(dataUri);
                }
            })
            .catch((error: unknown) =>
                glitchmitter.transmit("Error loading map thumbnail", error),
            );
        return () => {
            isCurrent = false;
        };
    }, [uri]);

    return imageUri;
};

const MapThumbnailSprite = ({
    imageId,
    imageUri,
    outlineColor,
}: {
    imageId: string;
    imageUri: string;
    outlineColor?: string;
}) => {
    const [svg, setSvg] = useState<Svg | null>(null);
    const [loaded, setLoaded] = useState(Platform.OS === "android");
    const [source, setSource] = useState<string | null>(null);
    const size = outlineColor
        ? OUTLINED_MAP_THUMBNAIL_SIZE
        : MAP_THUMBNAIL_SIZE;
    const padding = outlineColor ? MAP_THUMBNAIL_BORDER_SIZE : 0;

    useEffect(() => {
        if (!svg || !loaded) {
            return;
        }
        let isCurrent = true;
        svg.toDataURL(
            (base64) => {
                if (isCurrent) {
                    setSource(`data:image/png;base64,${base64}`);
                }
            },
            {
                width: size,
                height: size,
            },
        );
        return () => {
            isCurrent = false;
        };
    }, [svg, loaded, size]);

    if (source) {
        return <Images images={{ [imageId]: { source: { uri: source } } }} />;
    }

    return (
        <View pointerEvents="none" style={styles.rasterizer}>
            <Svg
                ref={setSvg}
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
            >
                <Defs>
                    <ClipPath id="thumbnail-circle">
                        <Circle
                            cx="50%"
                            cy="50%"
                            r={outlineColor ? MAP_THUMBNAIL_SIZE / 2 : "50%"}
                        />
                    </ClipPath>
                </Defs>
                {outlineColor && (
                    <Circle cx="50%" cy="50%" r="50%" fill={outlineColor} />
                )}
                <Image
                    href={{ uri: imageUri }}
                    x={padding}
                    y={padding}
                    width={MAP_THUMBNAIL_SIZE}
                    height={MAP_THUMBNAIL_SIZE}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath="url(#thumbnail-circle)"
                    onLoad={() => {
                        if (Platform.OS !== "android") {
                            setLoaded(true);
                        }
                    }}
                />
            </Svg>
        </View>
    );
};

export const CircularMapThumbnail = ({
    imageId,
    uri,
    outlineColors = [],
}: Props) => {
    const imageUri = useThumbnailImage(uri);
    if (!imageUri) {
        return null;
    }
    return (
        <>
            <MapThumbnailSprite imageId={imageId} imageUri={imageUri} />
            {[...new Set(outlineColors)].map((color) => (
                <MapThumbnailSprite
                    key={getOutlinedThumbnailId(imageId, color)}
                    imageId={getOutlinedThumbnailId(imageId, color)}
                    imageUri={imageUri}
                    outlineColor={color}
                />
            ))}
        </>
    );
};
