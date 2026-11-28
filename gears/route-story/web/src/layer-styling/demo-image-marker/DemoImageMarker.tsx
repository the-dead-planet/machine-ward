import { RefObject, useId } from "react";
import { getImageMarkerShapePath, ImageMarkerStyle, imageMarkerSizeScale, THUMBNAIL_IMAGE_SIZE } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { resolveMapImageMarkerColors, useTheme } from "@ui";
import styles from "./demo-image-marker.module.css";

interface Props {
    value: ImageMarkerStyle;
    label: string;
    previewRef: RefObject<HTMLButtonElement | null>;
    onClick: () => void;
}

export function DemoImageMarker({ value, label, previewRef, onClick }: Props) {
    const imageClipId = useId();
    const imagePath = getImageMarkerShapePath(value.shape, 100, 4);
    const imageSize = THUMBNAIL_IMAGE_SIZE * imageMarkerSizeScale[value.size];
    const { defaultColor: imageBorder } = resolveMapImageMarkerColors(useTheme());

    return (
        <button
            ref={previewRef}
            type="button"
            className={styles["image-preview"]}
            aria-label={label}
            onClick={onClick}
        >
            <svg aria-hidden="true" width={imageSize} height={imageSize} viewBox="0 0 108 108">
                <defs>
                    <clipPath id={imageClipId}>
                        <path d={imagePath} />
                    </clipPath>
                </defs>
                <g clipPath={`url(#${imageClipId})`}>
                    <rect width="108" height="108" fill="#8eb5bc" />
                    <circle cx="73" cy="32" r="12" fill="#ffe4ad" />
                    <path d="M0 92L32 44L57 77L78 54L108 90V108H0Z" fill="#345b61" />
                </g>
                <path d={imagePath} fill="none" stroke={imageBorder} strokeWidth="7" />
            </svg>
        </button>
    );
}
