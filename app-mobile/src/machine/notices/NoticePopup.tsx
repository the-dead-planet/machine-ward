import { FC, type RefObject } from "react";
import { ScrollView, StyleSheet, type HostInstance, useWindowDimensions } from "react-native";
import { getNoticeMessage, noticeStatuses, useTranslate, type SignaliumNotice } from "@apparatus";
import { useMobileMachineWard } from "@mobile-apparatus";
import { Button, Icon, Panel, Popup, Text } from "@mobile-ui";
import { Icons } from "@ui";

const styles = StyleSheet.create({
    popup: {
        width: 384,
        maxWidth: '95%',
    },
    noticeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
    },
    noticeCardText: {
        flex: 1,
    },
});

interface Props {
    anchor: RefObject<HostInstance | null>;
    notices: SignaliumNotice[];
    onClose: () => void;
    onRemove: (id: string) => void;
}

export const NoticePopup: FC<Props> = ({ anchor, notices, onClose, onRemove }) => {
    const { namespace, translationKey } = useMobileMachineWard();
    const translate = useTranslate();
    const removeLabel = translate({ n: namespace, t: translationKey.RemoveNotice });
    const { height: windowHeight } = useWindowDimensions();

    return (
        <Popup
            visible
            anchor={anchor as unknown as RefObject<HTMLElement | null>}
            triggerAnchor="bottom-right"
            popupAnchor="top-right"
            slide="to-left"
            onClose={onClose}
            borderWidth={0}
            popupStyle={styles.popup}
        >
            <ScrollView style={{ maxHeight: windowHeight / 2 }}>
                {notices.map((notice) => (
                    <Panel key={notice.id} color={notice.type} variant="fill-inverse" style={styles.noticeCard}>
                        <Icon
                            icon={Icons.NounProject[noticeStatuses[notice.type].icon]}
                            color={notice.type}
                            glyphsShade={500}
                            size="xs"
                            accessible
                            accessibilityLabel={translate({ n: namespace, t: noticeStatuses[notice.type].label })}
                        />
                        <Text usage="label" color={notice.type} variant="fill-inverse" style={styles.noticeCardText}>
                            {getNoticeMessage(notice)}
                        </Text>
                        <Button
                            size="xs"
                            color={notice.type}
                            icon={Icons.NounProject.CloseCross}
                            tooltip={removeLabel}
                            accessibilityLabel={removeLabel}
                            onPress={() => onRemove(notice.id)}
                        />
                    </Panel>
                ))}
            </ScrollView>
        </Popup>
    );
};
