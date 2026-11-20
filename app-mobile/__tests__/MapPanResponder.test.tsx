import { act, renderHook } from "@testing-library/react-native";
import {
    GestureResponderEvent,
    PanResponder,
    PanResponderGestureState,
} from "react-native";
import { BehaviorSubject } from "rxjs";
import { MobileMap } from "@mobile-apparatus";
import { useMapPanResponder } from "../src/machine/map-canvas/useMapPanResponder";

test("keeps the responder stable, coalesces stale moves, and marks cancellation", async () => {
    const create = jest.spyOn(PanResponder, "create");
    const moves: number[] = [];
    const move = jest.fn(async (event: GestureResponderEvent) => {
        moves.push(event.nativeEvent.locationX);
    });
    const ended = jest.fn(
        async (
            _event: GestureResponderEvent,
            _cancelled?: boolean,
        ) => {},
    );
    const unproject = jest.fn(async (point: number[]) => point);
    const map = {
        dragPan$: new BehaviorSubject(true),
        panResponderOffset: [0, 0],
        map$: new BehaviorSubject({ unproject }),
        onPanResponderShouldStartHandlers$: new BehaviorSubject(
            new Map([["image", (touch: GestureResponderEvent) => touch.nativeEvent.locationX === 0]]),
        ),
        onPanResponderStartHandlers$: new BehaviorSubject(
            new Map([["image", async () => {}]]),
        ),
        onPanResponderMoveHandlers$: new BehaviorSubject(
            new Map([
                [
                    "image",
                    move,
                ],
            ]),
        ),
        onPanResponderEndHandlers$: new BehaviorSubject(
            new Map([["image", ended]]),
        ),
    } as unknown as MobileMap;
    const gesture = {} as PanResponderGestureState;
    const event = (locationX: number): GestureResponderEvent =>
        ({
            persist: jest.fn(),
            nativeEvent: { locationX, locationY: 0 },
        }) as unknown as GestureResponderEvent;
    const hook = await renderHook(() => useMapPanResponder(map));

    try {
        const responder = hook.result.current;
        const callbacks = create.mock.calls[0][0];
        expect(callbacks.onStartShouldSetPanResponderCapture?.(event(100), gesture)).toBe(false);
        expect(callbacks.onStartShouldSetPanResponderCapture?.(event(0), gesture)).toBe(true);
        expect(callbacks.onShouldBlockNativeResponder?.(event(0), gesture)).toBe(true);
        expect(callbacks.onPanResponderTerminationRequest?.(event(0), gesture)).toBe(false);
        const starting = callbacks.onPanResponderGrant?.(event(0), gesture);
        expect(map.dragPan$.value).toBe(false);
        await starting;
        expect(unproject).not.toHaveBeenCalled();
        let releaseMove: () => void = () => {
            throw new Error("Move was not started");
        };
        move.mockImplementationOnce(
            (event) =>
                new Promise((resolve) => {
                    moves.push(event.nativeEvent.locationX);
                    releaseMove = resolve;
                }),
        );
        await act(async () => {
            callbacks.onPanResponderMove?.(event(1), gesture);
            await Promise.resolve();
            callbacks.onPanResponderMove?.(event(2), gesture);
            callbacks.onPanResponderMove?.(event(3), gesture);
            callbacks.onPanResponderMove?.(event(4), gesture);
            releaseMove();
            await new Promise<void>((resolve) => setImmediate(resolve));
        });
        expect(moves).toEqual([1, 4]);
        const release = event(5);
        const projectionCalls = unproject.mock.calls.length;
        await callbacks.onPanResponderRelease?.(release, gesture);
        expect(map.dragPan$.value).toBe(true);
        expect(ended).toHaveBeenCalledWith(release, false);
        expect(unproject).toHaveBeenCalledTimes(projectionCalls);

        map.onPanResponderMoveHandlers$.next(new Map());
        await hook.rerender(undefined);
        expect(hook.result.current).toBe(responder);
        expect(create).toHaveBeenCalledTimes(1);

        await callbacks.onPanResponderGrant?.(event(6), gesture);
        map.panResponderOffset = [0, 35];
        const cancellation = event(7);
        await callbacks.onPanResponderTerminate?.(cancellation, gesture);
        expect(ended).toHaveBeenLastCalledWith(cancellation, true);
        expect(map.panResponderOffset).toEqual([0, 0]);
        callbacks.onPanResponderMove?.(event(8), gesture);
        expect(moves).toEqual([1, 4]);
    } finally {
        await hook.unmount();
        create.mockRestore();
    }
});
