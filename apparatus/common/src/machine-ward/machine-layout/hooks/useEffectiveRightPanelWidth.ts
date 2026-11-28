import { useObservableState, useSubjectState } from "@tinker-chest";
import { useTheme } from "@ui";
import { useMachineWard } from "../../useMachineWard";
import { computeEffectiveWidth, LAYOUT_MINS } from "../tinkers";

export const useEffectiveRightPanelWidth = (): number => {
    const theme = useTheme();
    const [media] = useSubjectState(theme.media$);
    const { toolsStation } = useMachineWard();
    const [panelLayout] = useSubjectState(toolsStation.panelLayout$);
    const activeRightPanelToolId = useObservableState(toolsStation.activeRightPanelToolId$, null);
    const toolPanels = useObservableState(toolsStation.toolPanelsByPlacement$, []);
    const rightToolPanels = toolsStation.getToolPanelsByPlacement(toolPanels).right;

    if (media.isLessThanSm) {
        return 0;
    }

    return computeEffectiveWidth({
        hasToolPanels: rightToolPanels.length > 0,
        isCollapsed: activeRightPanelToolId === null,
        storedSize: panelLayout.rightWidth,
    }, LAYOUT_MINS.panels.right);
};
