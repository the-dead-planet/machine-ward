import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";

export const TOOLBAR_BORDER_WIDTH: number = 1;

export const useToolbarHeight = (hasContent: boolean, reducedMotion: boolean) => {
    const height = useRef(new Animated.Value(TOOLBAR_BORDER_WIDTH)).current;
    const [contentHeight, setContentHeight] = useState(0);
    const target = TOOLBAR_BORDER_WIDTH + (hasContent ? contentHeight : 0);

    useEffect(() => {
        if (reducedMotion) {
            height.setValue(target);
            return;
        }

        const animation = Animated.timing(height, {
            toValue: target,
            duration: 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
            isInteraction: false,
        });
        animation.start();

        return () => animation.stop();
    }, [height, reducedMotion, target]);

    return { height, setContentHeight };
};
