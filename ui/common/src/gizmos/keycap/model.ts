import { ReactNode } from "react";
import { AppearancePropsBase, ColorVariant, SizeVariant, SurfaceVariant } from "../../design-system/model";

export interface KeycapProps extends AppearancePropsBase<SurfaceVariant> {
    /**
     * Defaults to `neutral`
     */
    color?: ColorVariant;
    /**
     * Controls the compact frame, not the caption font. `sm` is 20 units tall by default.
     */
    size?: SizeVariant;
    /**
     * Defaults to `ghost`
     */
    variant?: SurfaceVariant;
    children?: ReactNode;
}
