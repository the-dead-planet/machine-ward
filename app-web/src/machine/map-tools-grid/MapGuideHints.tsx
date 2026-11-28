import { PANEL_HEADER_CURVE_SIZES, useGuideHints } from "@apparatus";
import { FontType } from "@ui";
import { Caption, Keycap } from "@web-ui";
import styles from "./map-guide-hints.module.css";

export const MapGuideHints = () => {
    const hints = useGuideHints();

    return hints.length > 0 ? (
        <ul data-testid="map-guide-hints" className={styles.hints} style={{ bottom: PANEL_HEADER_CURVE_SIZES.size + 8 }}>
            {hints.map(({ id, keys, text }) => (
                <li key={id} className={styles.row}>
                    {keys?.map((key, index) => (
                        <Keycap key={index} size="xs" variant="fill-inverse">
                            {key}
                        </Keycap>
                    ))}
                    <Caption fontType={FontType.NeonText}>
                        {text}
                    </Caption>
                </li>
            ))}
        </ul>
    ) : null;
};
