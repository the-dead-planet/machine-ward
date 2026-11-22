import { ReactNode } from "react";
import {
    ActiveGlow,
    AppearanceProps,
    FillVariant,
    ColorVariant,
} from "../../design-system/model";

export interface SliderRange {
    start: number;
    end: number;
}

export interface SliderProps extends AppearanceProps<FillVariant> {
    ranges?: readonly SliderRange[];
    rangeColor?: ColorVariant;
    activeGlow?: ActiveGlow;
    min?: number;
    max?: number;
    step?: number;
    value: number;
    onChange?: (value: number) => void;
    id?: string;
    label?: ReactNode;
    showNumberInput?: boolean;
    showStepControls?: boolean;
    /** Appearance overrides for the optional step buttons. */
    stepControlsProps?: AppearanceProps;
    ariaLabel?: string;
}

export interface SliderControlRowProps extends Omit<
    SliderProps,
    "id" | "label" | "activeGlow"
> {
    children: ReactNode;
}
