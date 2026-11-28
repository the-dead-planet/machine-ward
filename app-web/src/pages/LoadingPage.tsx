import { FC } from "react";
import { Language, MachineTranslationKey } from '@apparatus';
import * as translations from '@the-dead-planet/machine-ward-apparatus-common/src/machine-ward/translations';
import styles from './pages.module.css';

interface Props {
    language: Language;
}

export const LoadingPage: FC<Props> = ({ language }) => {
    return (
        <div className={styles['page']} role="status">
            <p className={styles['text']}>
                {translations[language]?.[MachineTranslationKey.AligningMachineWardGears]
                    ?? translations.en?.[MachineTranslationKey.AligningMachineWardGears]}
            </p>
        </div>
    );
};
