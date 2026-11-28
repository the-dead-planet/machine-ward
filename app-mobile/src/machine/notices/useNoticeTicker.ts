import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { getNoticeTickerDuration } from "@apparatus";

export const useNoticeTicker = (enabled: boolean, reducedMotion: boolean) => {
    const [width, setWidth] = useState(0);
    const [contentWidth, setContentWidth] = useState(0);
    const offset = useRef(new Animated.Value(0)).current;
    const resume = useRef<(() => void) | null>(null);
    const paused = useRef(false);

    useEffect(() => {
        offset.setValue(0);
        paused.current = false;

        if (!enabled || reducedMotion || !width || !contentWidth) {
            return;
        }

        let active = true;
        const start = (from: number) => {
            if (!active) {
                return;
            }
            offset.setValue(from);
            Animated.timing(offset, {
                toValue: -contentWidth,
                duration: getNoticeTickerDuration(from + contentWidth),
                easing: Easing.linear,
                useNativeDriver: true,
                isInteraction: false,
            }).start(({ finished }) => {
                if (finished) {
                    start(width);
                }
            });
        };
        resume.current = () => offset.stopAnimation((from) => start(from <= -contentWidth ? width : from));
        start(width);

        return () => {
            active = false;
            resume.current = null;
            offset.stopAnimation();
        };
    }, [contentWidth, enabled, offset, reducedMotion, width]);

    const toggle = () => {
        if (!resume.current) {
            return;
        }

        if (paused.current) {
            paused.current = false;
            resume.current();
        } else {
            paused.current = true;
            offset.stopAnimation();
        }
    };

    return { setWidth, setContentWidth, offset, toggle };
};
