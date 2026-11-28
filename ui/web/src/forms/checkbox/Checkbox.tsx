import { ChangeEvent, ComponentProps, FC, useId } from "react";
import classNames from "classnames";
import {
    CheckboxProps,
    DEFAULT_CORNERS,
    DEFAULT_COLOR,
    DEFAULT_FILL_VARIANT,
    DEFAULT_SIZE,
    useTheme,
} from "@ui";
import { HexagonSurface } from "../../hud/hexagon/HexagonSurface";
import { TypographyElement } from "../../design-system/typography/TypographyElement";
import typographyStyles from "../../design-system/typography/typography.module.css";
import styles from "./checkbox.module.css";

interface Props {
    labelledBy?: string;
}

export const Checkbox: FC<
    Omit<ComponentProps<"label">, "onChange"> & CheckboxProps & Props
> = ({
    id,
    labelledBy,
    color = DEFAULT_COLOR,
    glyphsShade,
    highlightColor = color,
    highlightGlyphsShade,
    variant = DEFAULT_FILL_VARIANT,
    size = DEFAULT_SIZE,
    corners = DEFAULT_CORNERS,
    checked,
    highlighted = false,
    onChange,
    disabled = false,
    children,
    className,
    style,
    onKeyDown,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    ...props
}) => {
    const generatedId = useId();
    const effectiveId = id || generatedId;
    const theme = useTheme();
    const hasInlineLabel = Boolean(children);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.checked);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLLabelElement>) => {
        onKeyDown?.(e);
        if (!e.defaultPrevented && e.key === "Enter" && !disabled) {
            e.preventDefault();
            onChange(!checked);
        }
    };

    return (
        <TypographyElement
            as={hasInlineLabel ? "label" : "span"}
            baseClassName={typographyStyles.label}
            color={color}
            highlightColor={highlightColor}
            shade={glyphsShade}
            highlightShade={highlightGlyphsShade}
            highlighted={highlighted}
            disabled={disabled}
            onKeyDown={handleKeyDown}
            htmlFor={hasInlineLabel ? effectiveId : undefined}
            data-disabled={disabled}
            data-size={size}
            className={classNames(styles["checkbox"], className)}
            style={style}
            {...props}
        >
            <input
                id={effectiveId}
                type="checkbox"
                className={classNames(styles["input"], !hasInlineLabel && styles["input-overlay"])}
                checked={checked}
                onChange={handleChange}
                disabled={disabled}
                aria-label={ariaLabel}
                aria-labelledby={labelledBy ?? ariaLabelledBy}
            />
            <span
                className={classNames(styles.box, styles[`corners-${corners}`])}
                data-appearance-variant={variant}
                aria-hidden="true"
            >
                {corners === "hexagon" ? (
                    <HexagonSurface
                        effects={theme.appearancePolicies[variant].effects}
                        paintClassName={styles.paint}
                    />
                ) : null}
                {checked ? (
                    <svg
                        className={styles["checkmark"]}
                        viewBox="0 0 12 12"
                        width="12"
                        height="12"
                        aria-hidden
                    >
                        <path
                            d="M2 6l3 3 5-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                ) : null}
            </span>
            {hasInlineLabel ? (
                <span className={styles["label"]}>{children}</span>
            ) : null}
        </TypographyElement>
    );
};
