import { useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView, StyleSheet, View } from "react-native";
import { useNoticeToolbarContent } from "@apparatus";
import { useMobileMachineWard } from "@mobile-apparatus";
import { Text, useReducedMotion } from "@mobile-ui";
import { FontType, useTheme, withColorOpacity } from "@ui";
import { Notice } from "../notices/Notice";

const styles = StyleSheet.create({
    toolbar: {
        height: 40,
        borderBottomWidth: 1,
    },
    ticker: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
    },
    hint: {
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
});

const useNoticeTicker = () => {
    const reducedMotion = useReducedMotion();
    const [width, setWidth] = useState(0);
    const [contentWidth, setContentWidth] = useState(0);
    const offset = useRef(new Animated.Value(0)).current;
    const animation = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        offset.setValue(0);

        if (reducedMotion || !width || contentWidth <= width) {
            return;
        }
        
        const ticker = Animated.loop(Animated.timing(offset, {
            toValue: width - contentWidth,
            duration: 60000,
            delay: 4800,
            easing: Easing.linear,
            useNativeDriver: true,
            isInteraction: false,
        }));
        animation.current = ticker;
        ticker.start();

        return () => {
            ticker.stop();
            animation.current = null;
        };
    }, [contentWidth, offset, reducedMotion, width]);

    return { setWidth, setContentWidth, offset, animation };
};

export const NoticesTopToolbar = () => {
    const { notices, hints, onRemove } = useNoticeToolbarContent();
    const theme = useTheme();
    const { toolsStation } = useMobileMachineWard();
    const { setWidth, setContentWidth, offset, animation } = useNoticeTicker();

    return (
        <View
            ref={instance => { toolsStation.topToolbarSizeRef.current = instance; }}
            style={[styles.toolbar, {
                backgroundColor: withColorOpacity(theme.resolveAppearance().surface, 0.87),
                borderBottomColor: theme.color('secondary'),
            }]}
        >
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
                onContentSizeChange={setContentWidth}
                onTouchStart={() => animation.current?.stop()}
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
