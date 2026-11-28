import { ReactNode } from 'react';
import { Text as NativeText } from 'react-native';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import { BehaviorSubject } from 'rxjs';
import type { MobileMap } from '@mobile-apparatus';
import type { CameraRef, MapRef } from '@maplibre/maplibre-react-native';
import { MapCanvas } from '../src/machine/map-canvas/MapCanvas';

const mockCartomancer = {
    selectedStyle$: new BehaviorSubject({ id: 'background' }),
    isInitialised$: new BehaviorSubject(false),
    isStyleLoaded$: new BehaviorSubject(false),
    bounds$: new BehaviorSubject(null),
};
const mockSignaliumBureau = {
    addNotice: jest.fn(),
    removeNotice: jest.fn(),
};

jest.mock('@mobile-apparatus', () => ({
    useMobileMachineWard: () => ({
        namespace: 'machine-ward',
        translationKey: { LoadingMap: 'loading-map', MapLoadingFailed: 'map-loading-failed', Close: 'close' },
        cartomancer: mockCartomancer,
        signaliumBureau: mockSignaliumBureau,
    }),
}));

jest.mock('@apparatus', () => {
    const labels: Record<string, string> = {
        'loading-map': 'Loading map...',
        'map-loading-failed': 'The map could not be loaded.',
        close: 'Close',
    };
    return {
        Cartomancer: { styles: { background: { style: {} }, second: { style: {} } } },
        useTranslate: () => ({ t }: { t: string }) => labels[t],
    };
});

jest.mock('@ui', () => ({
    FontType: { SpecialMessaging: 'SyneMono-Regular' },
    useTheme: () => ({ resolveAppearance: () => ({ glyphs: '#eeeeee' }) }),
}));

jest.mock('@mobile-ui', () => {
    const { Pressable, Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
    return {
        Text,
        Panel: View,
        Button: ({ children, onPress }: { children: ReactNode; onPress: () => void }) => (
            <Pressable accessibilityRole="button" onPress={onPress}><Text>{children}</Text></Pressable>
        ),
    };
});

jest.mock('@maplibre/maplibre-react-native', () => {
    const { View } = jest.requireActual<typeof import('react-native')>('react-native');
    return {
        Map: (props: import('react-native').ViewProps) => <View {...props} testID="native-map" />,
        Camera: () => null,
        LogManager: { onLog: jest.fn() },
    };
});

jest.mock('../src/machine/map-canvas/MapCanvasContainer', () => {
    const { View } = jest.requireActual<typeof import('react-native')>('react-native');
    return {
        MapCanvasContainer: ({ children }: { children: ReactNode }) => <View testID="recording-view">{children}</View>,
    };
});
jest.mock('../src/machine/map-canvas/useMapTools', () => ({ useMapTools: () => { } }));
jest.mock('../src/machine/map-canvas/useMapPanResponder', () => ({ useMapPanResponder: () => ({ panHandlers: {} }) }));

const map: MobileMap = {
    panResponderOffset: [0, 0],
    mapSize$: new BehaviorSubject({ width: 400, height: 800 }),
    dragPan$: new BehaviorSubject(true),
    cameraMoving$: new BehaviorSubject(false),
    onPressHandlers$: new BehaviorSubject(new Map()),
    onLongPressHandlers$: new BehaviorSubject(new Map()),
    onPanResponderStartHandlers$: new BehaviorSubject(new Map()),
    onPanResponderShouldStartHandlers$: new BehaviorSubject(new Map()),
    onPanResponderMoveHandlers$: new BehaviorSubject(new Map()),
    onPanResponderEndHandlers$: new BehaviorSubject(new Map()),
    map$: new BehaviorSubject<MapRef | null>(null),
    camera$: new BehaviorSubject<CameraRef | null>(null),
};

beforeEach(() => {
    mockCartomancer.selectedStyle$.next({ id: 'background' });
    mockCartomancer.isInitialised$.next(false);
    mockCartomancer.isStyleLoaded$.next(false);
    jest.clearAllMocks();
});

test.each([
    ['didFinishLoadingStyle', 'didFinishRenderingMapFully'],
    ['didFinishRenderingMapFully', 'didFinishLoadingStyle'],
])('keeps the map mounted when readiness events arrive as %s then %s', async (firstEvent, secondEvent) => {
    const screen = await render(<MapCanvas map={map}><NativeText>Map overlay</NativeText></MapCanvas>);
    expect(screen.getByText('Loading map...')).toBeVisible();
    expect(screen.queryByText('Map overlay')).toBeNull();
    expect(within(screen.getByTestId('recording-view')).queryByText('Loading map...')).toBeNull();

    await fireEvent(screen.getByTestId('native-map'), firstEvent);
    expect(screen.getByText('Loading map...')).toBeVisible();
    await fireEvent(screen.getByTestId('native-map'), secondEvent);
    expect(screen.queryByText('Loading map...')).toBeNull();
    expect(screen.getByText('Map overlay')).toBeVisible();
    expect(screen.getByTestId('native-map')).toBeVisible();
});

test('allows dismissing an offline failure without unmounting the map', async () => {
    const screen = await render(<MapCanvas map={map} />);
    await fireEvent(screen.getByTestId('native-map'), 'didFailLoadingMap');
    expect(screen.getByText('The map could not be loaded.')).toBeVisible();
    expect(mockSignaliumBureau.addNotice).toHaveBeenCalledWith(expect.objectContaining({
        id: 'map-failed',
        type: 'glitch',
        text: 'The map could not be loaded.',
    }));
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('The map could not be loaded.')).toBeNull();
    expect(screen.getByTestId('native-map')).toBeVisible();
});

test('can dismiss an unfinished load and shows fresh progress for a new style', async () => {
    const screen = await render(<MapCanvas map={map}><NativeText>Map overlay</NativeText></MapCanvas>);
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Loading map...')).toBeNull();
    await fireEvent(screen.getByTestId('native-map'), 'didFinishLoadingStyle');
    await fireEvent(screen.getByTestId('native-map'), 'didFinishRenderingMapFully');

    await act(() => mockCartomancer.selectedStyle$.next({ id: 'second' }));
    expect(screen.getByText('Loading map...')).toBeVisible();
    expect(screen.queryByText('Map overlay')).toBeNull();
    expect(screen.getByTestId('native-map')).toBeVisible();
});
