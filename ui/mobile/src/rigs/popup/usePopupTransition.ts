import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import type { PopupProps } from '@ui';

export const usePopupTransition = (
    visible: boolean,
    slide: NonNullable<PopupProps['slide']>,
) => {
    const progress = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const animation = Animated.timing(progress, {
            toValue: visible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        });
        animation.start();
        return () => animation.stop();
    }, [visible, progress]);

    const offset = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [slide === 'to-right' || slide === 'to-bottom' ? -100 : 100, 0],
    });

    return {
        opacity: progress,
        transform: [slide === 'to-left' || slide === 'to-right'
            ? { translateX: offset }
            : { translateY: offset }],
    };
};
