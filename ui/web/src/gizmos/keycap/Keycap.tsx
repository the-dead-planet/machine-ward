import { CSSProperties, FC } from "react";
import {
    DEFAULT_COLOR,
    DEFAULT_SIZE,
    DEFAULT_SURFACE_VARIANT,
    KEYCAP_FONT_TYPE,
    KEYCAP_HEIGHT_INSET,
    KeycapProps,
} from "@ui";
import { Caption } from "../../design-system/typography";
import { HudSurface } from "../../hud/HudSurface";
import styles from "./keycap.module.css";

export const Keycap: FC<KeycapProps> = ({
    color = DEFAULT_COLOR,
    highlighted,
    highlightColor,
    size = DEFAULT_SIZE,
    variant = DEFAULT_SURFACE_VARIANT,
    disabled,
    children,
}) => (
    <HudSurface
        as="kbd"
        rectangle
        color={color}
        highlighted={highlighted}
        highlightColor={highlightColor}
        size={size}
        variant={variant}
        disabled={disabled}
        className={styles.keycap}
        style={{ "--keycap-height-inset": `${KEYCAP_HEIGHT_INSET}px` } as CSSProperties}
    >
        <Caption fontType={KEYCAP_FONT_TYPE} nowrap className={styles.label}>
            {children}
        </Caption>
    </HudSurface>
);
