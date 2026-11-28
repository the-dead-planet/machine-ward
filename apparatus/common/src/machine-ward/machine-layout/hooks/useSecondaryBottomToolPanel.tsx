import { useTheme } from "@ui";
import { useMachineWard } from "../../useMachineWard";
import { useObservableState, useSubjectState } from "@tinker-chest";
import { clampBottomSecondaryHeight, LAYOUT_DEFAULTS, LAYOUT_MINS } from "../tinkers";

export const useSecondaryBottomToolPanel = (
    activeId: string | null,
    onActiveIdChange: (activeId: string | null) => void,
) => {
    const { toolsStation } = useMachineWard();
    const theme = useTheme();
    const [panelWidths, setPanelWidths] = useSubjectState(toolsStation.panelWidths$);
    const toolPanels = useObservableState(toolsStation.toolPanelsByPlacement$, []);
    const toolPanelsByPlacement = toolsStation.getToolPanelsByPlacement(toolPanels);
    const effectivePanels = toolPanelsByPlacement["left"].concat(toolPanelsByPlacement["right"]);
    const toolPanel = effectivePanels.find(({ id }) => id === activeId);
    const show = effectivePanels.length > 0;
    const isCollapsed = activeId === null;

    const effectiveHeight = !show
        ? 0
        : isCollapsed
            ? LAYOUT_MINS.panels.bottomSecondary
            : panelWidths.bottomSecondaryHeight;

    const handleToolSelect = (newId: string | null) => {
        onActiveIdChange(newId);

        if (newId !== null) {
            const thisMin = LAYOUT_MINS.panels.bottomSecondary;
            const requestedHeight = panelWidths.bottomSecondaryHeight < thisMin * 2
                ? LAYOUT_DEFAULTS.panels.bottomSecondary
                : panelWidths.bottomSecondaryHeight;
            const targetHeight = clampBottomSecondaryHeight(requestedHeight, theme.media$.value.windowHeight, toolsStation.getReservedToolbarHeight());

            setPanelWidths((prev) => ({
                ...prev,
                bottomSecondaryHeight: targetHeight,
            }));
        }
    };


    return {
        show,
        isCollapsed,
        effectiveHeight,
        toolPanel,
        handleToolSelect,
    };
};
