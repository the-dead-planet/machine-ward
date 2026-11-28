import { FC, useId } from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import type { SignaliumNotice } from "@apparatus";
import { useReducedMotion } from "@mobile-ui";
import { Notice } from "./Notice";
import { useNoticeTicker } from "./useNoticeTicker";

const NOTICE_TICKER_HEIGHT: number = 29;

const styles = StyleSheet.create({
    tickerViewport: {
        flexGrow: 1,
        width: 0,
        overflow: 'hidden',
    },
    tickerScroll: {
        minHeight: NOTICE_TICKER_HEIGHT,
    },
    ticker: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: NOTICE_TICKER_HEIGHT,
    },
});

interface Props {
    glyphs: string;
    notices: SignaliumNotice[];
    onRemove: (id: string) => void;
}

export const NoticeTicker: FC<Props> = ({ glyphs, notices, onRemove }) => {
    const lampPattern = useId();
    const reducedMotion = useReducedMotion();
    const { setWidth, setContentWidth, offset, toggle } = useNoticeTicker(notices.length > 0, reducedMotion);

    return (
        <View style={styles.tickerViewport}>
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
                        <Circle cx={2} cy={2} r={0.85} fill={glyphs} opacity={0.12} />
                    </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill={`url(#${lampPattern})`} />
            </Svg>
            <ScrollView
                testID="notice-ticker"
                style={styles.tickerScroll}
                horizontal
                removeClippedSubviews={false}
                showsHorizontalScrollIndicator={false}
                onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
                onContentSizeChange={setContentWidth}
                onTouchStart={toggle}
                onScrollBeginDrag={() => offset.setValue(0)}
            >
                <Animated.View style={[styles.ticker, { transform: [{ translateX: offset }] }]}>
                    {notices.map((notice) => <Notice key={notice.id} notice={notice} onRemove={onRemove} />)}
                </Animated.View>
            </ScrollView>
        </View>
    );
};
