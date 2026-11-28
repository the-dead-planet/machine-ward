import { act, fireEvent, render } from "@testing-library/react-native";
import { View } from "react-native";
import { BehaviorSubject } from "rxjs";
import { ToolsStation } from "../../common/src/machine-ward/tools-station/tools-station";
import { useToolPanelSizeClamp } from "../../common/src/machine-ward/machine-layout/hooks/useToolPanelSizeClamp";
import { useReservedToolbarSize } from "../src/useReservedToolbarSize";

const mockToolsStation = new ToolsStation<unknown>();
const mockMedia$ = new BehaviorSubject({ windowWidth: 500, windowHeight: 700, isLessThanSm: true });

jest.mock("../src/machine-ward", () => ({
    useMobileMachineWard: () => ({ toolsStation: mockToolsStation }),
}));
jest.mock("../../common/src/machine-ward/useMachineWard", () => ({
    useMachineWard: () => ({ toolsStation: mockToolsStation }),
}));
jest.mock("@ui", () => ({
    useTheme: () => ({ media$: mockMedia$ }),
}));

const ToolbarLayout = () => {
    useToolPanelSizeClamp();
    const onNoticesLayout = useReservedToolbarSize('notices');
    const onBottomLayout = useReservedToolbarSize('bottomPanel');
    return (
        <>
            <View testID="notices" onLayout={onNoticesLayout} />
            <View testID="bottom" onLayout={onBottomLayout} />
        </>
    );
};

beforeEach(() => {
    mockToolsStation.setToolbarHeight('topBar', 40);
    mockToolsStation.setToolbarHeight('notices', 0);
    mockToolsStation.setToolbarHeight('bottomPanel', 60);
    mockToolsStation.addToolPanel('controls', {
        placement: 'left',
        title: { n: 'test', t: 'controls' },
        contentComponent: () => null,
        icon: '',
    });
    mockToolsStation.activeLeftPanelToolId$.next(null);
    mockToolsStation.activeBottomSecondaryPanelToolId$.next('controls');
    mockToolsStation.panelLayout$.next({ leftWidth: 100, rightWidth: 100, bottomSecondaryHeight: 500 });
});

afterAll(() => mockToolsStation.cleanUp());

test("shrinks a maximized secondary panel when notices or bottom content take more room", async () => {
    const screen = await render(<ToolbarLayout />);
    await fireEvent(screen.getByTestId('bottom'), 'layout', { nativeEvent: { layout: { height: 60 } } });
    expect(mockToolsStation.panelLayout$.value.bottomSecondaryHeight).toBe(500);

    await fireEvent(screen.getByTestId('notices'), 'layout', { nativeEvent: { layout: { height: 30 } } });
    expect(mockToolsStation.panelLayout$.value.bottomSecondaryHeight).toBe(470);

    await fireEvent(screen.getByTestId('bottom'), 'layout', { nativeEvent: { layout: { height: 160 } } });
    expect(mockToolsStation.panelLayout$.value.bottomSecondaryHeight).toBe(370);

    await fireEvent(screen.getByTestId('notices'), 'layout', { nativeEvent: { layout: { height: 0 } } });
    expect(mockToolsStation.panelLayout$.value.bottomSecondaryHeight).toBe(370);
    await screen.unmount();
    expect(mockToolsStation.toolbarHeights$.value).toEqual({ topBar: 40, notices: 0, bottomPanel: 0 });
});

test("preserves the collapsed panel preference and clamps it when reopened", async () => {
    mockToolsStation.activeBottomSecondaryPanelToolId$.next(null);
    const screen = await render(<ToolbarLayout />);
    await fireEvent(screen.getByTestId('bottom'), 'layout', { nativeEvent: { layout: { height: 60 } } });
    await fireEvent(screen.getByTestId('notices'), 'layout', { nativeEvent: { layout: { height: 30 } } });
    expect(mockToolsStation.panelLayout$.value.bottomSecondaryHeight).toBe(500);

    await act(() => mockToolsStation.activeBottomSecondaryPanelToolId$.next('controls'));
    expect(mockToolsStation.panelLayout$.value.bottomSecondaryHeight).toBe(470);
    await screen.unmount();
});
