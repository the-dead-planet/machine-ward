import { FC, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { ToolPopupProps, useMultipleTranslations } from "@apparatus";
import { getDefaultRouteStoryState, imageMarkerSizeScale, THUMBNAIL_IMAGE_SIZE, CurrentPointStyle, RouteStoryLayerStylingPopupProps, RouteStoryLineStyle, RouteStoryState } from "@the-dead-planet/machine-ward-gears-route-story-common";
import { useTheme } from "@ui";
import { HudConnector, Popup, Tabstrip } from "@web-ui";
import { useSubjectState } from "@tinker-chest";
import { WebRouteStoryProps } from "../model";
import { CurrentPointControls } from "./CurrentPointControls";
import { LineStyleGroup } from "./LineStyleGroup";
import { ImageMarkerChoices } from "./ImageMarkerChoices";
import { DemoImageMarker } from "./demo-image-marker/DemoImageMarker";
import { DemoLine } from "./demo-line/DemoLine";
import styles from './layer-styling.module.css';

const hasCustomStyling = (current: RouteStoryState, defaults: RouteStoryState): boolean =>
    JSON.stringify(current.routeStyleActive) !== JSON.stringify(defaults.routeStyleActive) ||
    JSON.stringify(current.routeStyleInactive) !== JSON.stringify(defaults.routeStyleInactive) ||
    JSON.stringify(current.currentPoint) !== JSON.stringify(defaults.currentPoint) ||
    current.imageMarkerStyle.shape !== defaults.imageMarkerStyle.shape || current.imageMarkerStyle.size !== defaults.imageMarkerStyle.size;

type Props = ToolPopupProps<maplibregl.Map> &
    RouteStoryLayerStylingPopupProps<maplibregl.Map> &
    WebRouteStoryProps;

export const LayerStylingPopup: FC<Props> = ({
    icon,
    onClose,
    gearId,
    translationKey,
    state$,
}) => {
    const theme = useTheme();
    const [active] = useSubjectState(icon.active$);
    const [anchorRef] = useSubjectState(icon.anchorRef$);
    const [state, setState] = useSubjectState(state$);
    const [selectedStyle, setSelectedStyle] = useState("active");
    const tabstripRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef<SVGRectElement>(null);
    const currentPointRef = useRef<SVGRectElement>(null);
    const inactiveRef = useRef<SVGRectElement>(null);
    const imagePreviewRef = useRef<HTMLButtonElement>(null);
    const [
        currentPointLabel,
        activeLabel,
        inactiveLabel,
        restoreDefaultsLabel,
        closeLabel,
        dialogLabel,
        imagesLabel, shapeLabel, sizeLabel, circleLabel, squareLabel, hexagonLabel, smallLabel, mediumLabel, largeLabel,
    ] = useMultipleTranslations([
        { n: gearId, t: translationKey.CurrentPoint },
        { n: gearId, t: translationKey.Active },
        { n: gearId, t: translationKey.Inactive },
        { n: gearId, t: translationKey.RestoreDefaults },
        { n: gearId, t: translationKey.Close },
        { n: gearId, t: translationKey.OpenLayerAestheticOptions },
        { n: gearId, t: translationKey.Images },
        { n: gearId, t: translationKey.Shape },
        { n: gearId, t: translationKey.Size },
        { n: gearId, t: translationKey.Circle },
        { n: gearId, t: translationKey.Square },
        { n: gearId, t: translationKey.Hexagon },
        { n: gearId, t: translationKey.Small },
        { n: gearId, t: translationKey.Medium },
        { n: gearId, t: translationKey.Large },
    ]);

    const setActiveLine = (patch: Partial<RouteStoryLineStyle>) =>
        setState((prev) => ({
            ...prev,
            routeStyleActive: { ...prev.routeStyleActive, ...patch },
        }));
    const setInactiveLine = (patch: Partial<RouteStoryLineStyle>) =>
        setState((prev) => ({
            ...prev,
            routeStyleInactive: { ...prev.routeStyleInactive, ...patch },
        }));
    const setCurrentPoint = (patch: Partial<CurrentPointStyle>) =>
        setState((prev) => ({
            ...prev,
            currentPoint: { ...prev.currentPoint, ...patch },
        }));

    if (!active || !anchorRef?.current) {
        return null;
    }

    const defaults = getDefaultRouteStoryState(theme);
    const targetRef =
        selectedStyle === "active"
            ? activeRef
            : selectedStyle === "current-point"
                ? currentPointRef
                : selectedStyle === "images" ? imagePreviewRef : inactiveRef;
    const selectedTabRef: React.RefObject<Element | null> = {
        get current() {
            return (
                tabstripRef.current?.querySelector(
                    '[role="tab"][aria-selected="true"]',
                ) ?? null
            );
        },
    };

    return (
        <Popup
            visible
            anchor={anchorRef as unknown as React.RefObject<HTMLElement | null>}
            triggerAnchor="bottom-left"
            popupAnchor="top-left"
            dismissOnClickAway={false}
            onClose={onClose}
            variant="fill-translucent"
            popupClassName={styles["popup"]}
            role="dialog"
            aria-label={dialogLabel}
        >
            <HudConnector
                fromRef={selectedTabRef}
                toRef={targetRef}
                fromAnchor="top"
                toAnchor="bottom"
                color="secondary"
                activeGlow="glow"
            >
                <div className={styles["demo-row"]}>
                    <DemoLine
                        state={state}
                        onActiveClick={() => setSelectedStyle("active")}
                        onCurrentPointClick={() => setSelectedStyle("current-point")}
                        onInactiveClick={() => setSelectedStyle("inactive")}
                        activeMenuLabel={activeLabel}
                        currentPointMenuLabel={currentPointLabel}
                        inactiveMenuLabel={inactiveLabel}
                        activeRef={activeRef}
                        currentPointRef={currentPointRef}
                        inactiveRef={inactiveRef}
                    />
                    <DemoImageMarker
                        value={state.imageMarkerStyle}
                        label={imagesLabel}
                        previewRef={imagePreviewRef}
                        onClick={() => setSelectedStyle("images")}
                    />
                </div>
                <div className={styles["content"]}>
                    <div ref={tabstripRef}>
                        <Tabstrip
                            variant="fill-inverse"
                            spread
                            value={selectedStyle}
                            onChange={setSelectedStyle}
                            overflowAccessibilityLabel={dialogLabel}
                            actions={{
                                primary: {
                                    label: closeLabel,
                                    onPress: onClose,
                                },
                                secondary: hasCustomStyling(state, defaults) ? {
                                    label: restoreDefaultsLabel,
                                    onPress: () => setState(defaults),
                                } : undefined,
                            }}
                            options={[
                                { value: "active", label: activeLabel },
                                {
                                    value: "current-point",
                                    label: currentPointLabel,
                                },
                                { value: "inactive", label: inactiveLabel },
                                { value: "images", label: imagesLabel },
                            ]}
                        >
                            {selectedStyle === "images" ? (
                                <div className={styles["image-controls"]}>
                                    <ImageMarkerChoices<RouteStoryState['imageMarkerStyle']['shape']>
                                        label={shapeLabel}
                                        value={state.imageMarkerStyle.shape}
                                        options={[
                                            { value: "circle", label: circleLabel, shape: "circle", diameter: 26 },
                                            { value: "square", label: squareLabel, shape: "square", diameter: 26 },
                                            { value: "hexagon", label: hexagonLabel, shape: "hexagon", diameter: 26 },
                                        ]}
                                        onChange={(shape) => setState((prev) => ({ ...prev, imageMarkerStyle: { ...prev.imageMarkerStyle, shape } }))}
                                    />
                                    <ImageMarkerChoices<RouteStoryState['imageMarkerStyle']['size']>
                                        label={sizeLabel}
                                        value={state.imageMarkerStyle.size}
                                        options={([
                                            ["small", smallLabel],
                                            ["medium", mediumLabel],
                                            ["large", largeLabel],
                                        ] as const).map(([value, label]) => ({
                                            value, label, shape: state.imageMarkerStyle.shape, diameter: THUMBNAIL_IMAGE_SIZE * imageMarkerSizeScale[value],
                                        }))}
                                        onChange={(size) => setState((prev) => ({ ...prev, imageMarkerStyle: { ...prev.imageMarkerStyle, size } }))}
                                    />
                                </div>
                            ) : selectedStyle === "current-point" ? (
                                <CurrentPointControls
                                    gearId={gearId}
                                    translationKey={translationKey}
                                    value={state.currentPoint}
                                    onChange={setCurrentPoint}
                                />
                            ) : selectedStyle === "active" ? (
                                <LineStyleGroup
                                    showColorTransition
                                    style={state.routeStyleActive}
                                    gearId={gearId}
                                    translationKey={translationKey}
                                    onChange={setActiveLine}
                                />
                            ) : (
                                <LineStyleGroup
                                    style={state.routeStyleInactive}
                                    gearId={gearId}
                                    translationKey={translationKey}
                                    onChange={setInactiveLine}
                                />
                            )}
                        </Tabstrip>
                    </div>
                </div>
            </HudConnector>
        </Popup>
    );
};
