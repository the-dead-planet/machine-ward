import classNames from "classnames";
import { useNoticeToolbarContent } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { FontType } from "@ui";
import { P } from "@web-ui";
import { Notice } from "../notices/Notice";
import styles from '../notices/notices.module.css';
import machineStyles from './machine.module.css';

export const NoticesTopToolbar = () => {
    const { notices, hints, onRemove } = useNoticeToolbarContent();
    const { toolsStation } = useWebMachineWard();

    return (
        <div
            className={classNames(machineStyles.toolbar, machineStyles.top)}
            ref={instance => { toolsStation.topToolbarSizeRef.current = instance; }}
        >
            <div className={machineStyles.content}>
                <div className={styles.ticker}>
                    {notices.map((notice) => <Notice key={notice.id} notice={notice} onRemove={onRemove} />)}
                    {hints.map(({ id, text }) => (
                        <P role="status" className={classNames(styles.message, styles.hint)} fontType={FontType.NeonText} key={id}>
                            {text}
                        </P>
                    ))}
                </div>
            </div>
        </div>
    );
};
