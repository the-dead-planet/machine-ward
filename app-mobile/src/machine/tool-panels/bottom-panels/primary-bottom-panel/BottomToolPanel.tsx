import { FC, useState } from "react";
import { Animated, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { assignBottomToolPanelRef, useBottomToolPanel } from "@apparatus";
import { useMobileMachineWard } from "@mobile-apparatus";
import { BottomToolPanelHeader } from "./BottomToolPanelHeader";
import { MobileMap } from "@mobile-apparatus";
import { useTheme, withColorOpacity } from "@ui";
import { useAnimatedSize } from "../../useAnimatedSize";
import { resolveElevationStyle } from "@mobile-ui";

const styles = StyleSheet.create({
    componentHeader: {
        flexDirection: 'row',
        paddingHorizontal: 8,
    },
});

interface Props {
    map?: MobileMap;
    activeId: string | null;
    onActiveIdChange: (activeId: string | null) => void;
    joinHeaderButtons?: boolean;
}

export const BottomToolPanel: FC<Props> = ({
    map,
    activeId,
    onActiveIdChange,
    joinHeaderButtons,
}) => {
    const theme = useTheme();
    const { toolsStation } = useMobileMachineWard();
    const { show, toolPanel } = useBottomToolPanel(activeId);
    const { height: windowHeight } = useWindowDimensions();

    const [naturalHeight, setNaturalHeight] = useState(0);
    const maxHeight = windowHeight * 0.30;
    const animatedHeight = useAnimatedSize(toolPanel ? Math.min(naturalHeight, maxHeight) : 0);

    if (!show) {
        return null;
    }

    return (
        <View ref={assignBottomToolPanelRef(toolsStation)}>
            <View>
                <View
                    pointerEvents="none"
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: withColorOpacity(theme.resolveAppearance().surface, 0.87),
                            ...resolveElevationStyle(theme, 'raised', 'up'),
                        },
                    ]}
                />
                <BottomToolPanelHeader
                    activeId={activeId}
                    onActiveIdChange={onActiveIdChange}
                    joinHeaderButtons={joinHeaderButtons}
                />
                <Animated.View style={{ height: animatedHeight, overflow: 'hidden' }}>
                    <ScrollView
                        style={StyleSheet.absoluteFill}
                        scrollEnabled={naturalHeight > maxHeight}
                        onContentSizeChange={(_width, height) => {
                            if (toolPanel) {
                                setNaturalHeight(height);
                            }
                        }}
                    >
                        {toolPanel ? (
                            <>
                                {toolPanel.headerComponent ? (
                                    <View style={styles.componentHeader}>
                                        <toolPanel.headerComponent map={map} placement={toolPanel.placement} />
                                    </View>
                                ) : null}
                                <View>
                                    <toolPanel.contentComponent map={map} placement={toolPanel.placement} />
                                </View>
                            </>
                        ) : null}
                    </ScrollView>
                </Animated.View>
            </View>
        </View>
    );
};
