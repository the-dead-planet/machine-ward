import { FC, useRef } from "react";
import { Animated, type HostInstance, StyleSheet, View } from "react-native";
import { useNoticeReader, useNoticeToolbarContent, useTranslate } from "@apparatus";
import { useMobileMachineWard, useReservedToolbarSize } from "@mobile-apparatus";
import { useReducedMotion } from "@mobile-ui";
import { useTheme, withColorOpacity } from "@ui";
import { NoticePopup } from "./NoticePopup";
import { NoticeSummary } from "./NoticeSummary";
import { NoticeTicker } from "./NoticeTicker";
import { TOOLBAR_BORDER_WIDTH, useToolbarHeight } from "./useToolbarHeight";

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: TOOLBAR_BORDER_WIDTH,
        overflow: 'hidden',
    },
    toolbar: {
        // Measure natural content height independently of the animated clip.
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    noticeRow: {
        flexDirection: 'row',
    },
});

export const NoticesTopToolbar: FC = () => {
    const { notices, onRemove, language } = useNoticeToolbarContent();
    const theme = useTheme();
    const appearance = theme.resolveAppearance();
    const { namespace, translationKey } = useMobileMachineWard();
    const onToolbarLayout = useReservedToolbarSize('notices');
    const translate = useTranslate();
    const reader = useNoticeReader(notices, onRemove, language);
    const summaryRef = useRef<HostInstance>(null);
    const title = translate({ n: namespace, t: translationKey.Notices });
    const secondary = theme.color('secondary');
    const reducedMotion = useReducedMotion();
    const hasNotices = notices.length > 0;
    const showNoticeRow = hasNotices || reader.snapshot !== null;
    const { height, setContentHeight } = useToolbarHeight(showNoticeRow, reducedMotion);

    return (
        <>
            <Animated.View
                onLayout={onToolbarLayout}
                testID="notices-toolbar"
                style={[styles.container, { height, borderBottomColor: secondary }]}
            >
                <View
                    testID="notices-content"
                    style={[styles.toolbar, { backgroundColor: withColorOpacity(appearance.surface, 0.87) }]}
                    onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}
                >
                    {showNoticeRow ? (
                        <View style={styles.noticeRow}>
                            <NoticeTicker glyphs={appearance.glyphs} notices={notices} onRemove={onRemove} />
                            <NoticeSummary
                                anchor={summaryRef}
                                counts={reader.counts}
                                expanded={reader.snapshot !== null}
                                secondary={secondary}
                                title={title}
                                onPress={reader.snapshot ? reader.close : reader.open}
                            />
                        </View>
                    ) : null}
                </View>
            </Animated.View>
            {reader.snapshot ? (
                <NoticePopup
                    anchor={summaryRef}
                    notices={reader.snapshot}
                    onClose={reader.close}
                    onRemove={reader.remove}
                />
            ) : null}
        </>
    );
};
