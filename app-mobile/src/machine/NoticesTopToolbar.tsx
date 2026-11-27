import { useEffect, useId, useRef, useState } from "react";
import { Animated, Easing, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import { getNoticeTickerDuration, useNoticeToolbarContent } from "@apparatus";
import { useMobileMachineWard } from "@mobile-apparatus";
import { Text, useReducedMotion } from "@mobile-ui";
import { FontType, useTheme, withColorOpacity } from "@ui";
import { Notice } from "../notices/Notice";

const styles = StyleSheet.create({
    toolbar: {
        borderBottomWidth: 1,
    },
    ticker: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
    },
    hint: {
        paddingHorizontal: 12,
    },
});

const useNoticeTicker = () => {
    const reducedMotion = useReducedMotion();
    const [width, setWidth] = useState(0);
    const [contentWidth, setContentWidth] = useState(0);
    const offset = useRef(new Animated.Value(0)).current;
    const resume = useRef<(() => void) | null>(null);

    useEffect(() => {
        offset.setValue(0);

        if (reducedMotion || !width || !contentWidth) {
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
    }, [contentWidth, offset, reducedMotion, width]);

    return { setWidth, setContentWidth, offset, resume };
};

export const NoticesTopToolbar = () => {
    const { notices, hints, onRemove } = useNoticeToolbarContent();
    const theme = useTheme();
    const appearance = theme.resolveAppearance();
    const lampPattern = useId();
    const { toolsStation } = useMobileMachineWard();
    const { setWidth, setContentWidth, offset, resume } = useNoticeTicker();

    return (
        <View
            ref={instance => { toolsStation.topToolbarSizeRef.current = instance; }}
            style={[styles.toolbar, {
                backgroundColor: withColorOpacity(appearance.surface, 0.87),
                borderBottomColor: theme.color('secondary'),
            }]}
        >
            <Svg
                width="100%"
                height="100%"
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            >
                <Defs>
                    <Pattern id={lampPattern} width={4} height={4} patternUnits="userSpaceOnUse">
                        <Circle cx={2} cy={2} r={0.85} fill={appearance.glyphs} opacity={0.12} />
                    </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill={`url(#${lampPattern})`} />
            </Svg>
            <ScrollView
                testID="notice-ticker"
                horizontal
                removeClippedSubviews={false}
                showsHorizontalScrollIndicator={false}
                onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
                onContentSizeChange={setContentWidth}
                onTouchStart={() => offset.stopAnimation()}
                onTouchEnd={() => resume.current?.()}
                onTouchCancel={() => resume.current?.()}
                onScrollBeginDrag={() => offset.setValue(0)}
            >
                <Animated.View style={[styles.ticker, { transform: [{ translateX: offset }] }]}>
                    {notices.map((notice) => <Notice key={notice.id} notice={notice} onRemove={onRemove} />)}
                    {hints.map(({ id, text }) => (
                        <View key={id} accessibilityLiveRegion="polite" style={styles.hint}>
                            <Text fontType={FontType.NeonText} nowrap>{text}</Text>
                        </View>
                    ))}
                </Animated.View>
            </ScrollView>
        </View>
    );
};
