import { FC, useState } from "react";
import classNames from "classnames";
import { DateTime } from "luxon";
import { Button, Checkbox, Dialog, Dropdown, Text, ThemeSelect } from "@web-ui";
import { Individuator, IndividuatorSettings, IndividuatorTranslationKey, Language, MachineTranslationKey, Translatron, useTranslate } from "@apparatus";
import { useWebMachineWard } from "@web-apparatus";
import { DateFormat, DistanceUnit, TimeFormat, useSubjectState } from "@tinker-chest";
import { Icons, useTheme } from "@ui";
import { SettingsCheckbox } from "./SettingsCheckbox";
import { SettingsLabel } from "./SettingsLabel";
import styles from './settings-dialog.module.css';

interface Props {
    onClose: () => void;
    onOpenKeyboardShortcuts: () => void;
}

export const SettingsDialog: FC<Props> = ({ onClose, onOpenKeyboardShortcuts }) => {
    const { isDev, namespace, individuator } = useWebMachineWard();
    const [savedSettings, setSettings] = useSubjectState(individuator.settings$);
    const [pendingSettings, setPendingSettings] = useState(individuator.settings$.value);
    const translate = useTranslate();
    const translateIndividuator = (key: IndividuatorTranslationKey) => translate({ n: individuator.namespace, t: key });
    const translateMachine = (key: MachineTranslationKey) => translate({ n: namespace, t: key });
    const theme = useTheme();
    const [media] = useSubjectState(theme.media$);
    const isWide = !media.isLessThanSm;
    const popoverClassName = isWide ? styles['skewed-popover'] : undefined;
    const shortcutsLabelId = "individuator-enable-keyboard-shortcuts-label";
    const shortcutsLabel = translateIndividuator(IndividuatorTranslationKey.EnableKeyboardShortcuts);
    const unsaved = translateIndividuator(IndividuatorTranslationKey.UnsavedChange);
    const changed = {
        language: pendingSettings.language !== savedSettings.language,
        dateFormat: pendingSettings.dateFormat.value !== savedSettings.dateFormat.value ||
            pendingSettings.dateFormat.short !== savedSettings.dateFormat.short,
        timeFormat: pendingSettings.timeFormat !== savedSettings.timeFormat,
        distanceUnit: pendingSettings.distanceUnit !== savedSettings.distanceUnit,
        themeName: pendingSettings.themeName !== savedSettings.themeName,
        confirmBeforeLeave: pendingSettings.confirmBeforeLeave !== savedSettings.confirmBeforeLeave,
        enableKeyboardShortcuts: pendingSettings.enableKeyboardShortcuts !== savedSettings.enableKeyboardShortcuts,
        debugMode: isDev && pendingSettings.debugMode !== savedSettings.debugMode,
    };
    const unsavedFor = (key: keyof typeof changed) => changed[key] ? unsaved : undefined;
    const unsavedCount = Object.values(changed).filter(Boolean).length;
    const unsavedPlural = new Intl.PluralRules(Translatron.languages[savedSettings.language].locale).select(unsavedCount);

    return (
        <Dialog
            color="primary"
            variant="fill-translucent"
            placement="right-drawer"
            header={translateIndividuator(IndividuatorTranslationKey.IndividuatorName)}
            closeText={translateMachine(MachineTranslationKey.Cancel)}
            onClose={onClose}
            footerStart={(
                <Text usage="caption" color="primary" role="status" className={styles['unsaved-count']}>
                    {unsavedCount > 0 && translate({
                        n: individuator.namespace,
                        t: unsavedPlural === 'one' ? IndividuatorTranslationKey.UnsavedChangeCount
                            : unsavedPlural === 'many' ? IndividuatorTranslationKey.UnsavedChangesManyCount
                            : IndividuatorTranslationKey.UnsavedChangesCount,
                        p: { count: unsavedCount },
                    })}
                </Text>
            )}
            save={{
                saveText: translateMachine(MachineTranslationKey.Save),
                onSave: () => setSettings(pendingSettings),
            }}
        >
            <div className={classNames(styles['container'], { [styles['wide']]: isWide })}>
                <div className={styles['field']}>
                    <SettingsLabel id="individuator-language-label" unsaved={unsavedFor('language')}>
                        {translateIndividuator(IndividuatorTranslationKey.Language)}
                    </SettingsLabel>
                    <Dropdown<Language>
                        popoverClassName={popoverClassName}
                        labelledBy="individuator-language-label"
                        size="xs"
                        color="primary"
                        variant="fill"
                        value={pendingSettings.language}
                        options={Object.entries(Translatron.languages)
                            .map(([language, { label, locale, symbol }]) => ({
                                value: language as Language,
                                label: (
                                    <span className={styles['option']}>
                                        <span>{symbol}</span>
                                        <span>{label} ({locale})</span>
                                    </span>
                                ),
                            }))}
                        onChange={(language) => setPendingSettings((prev): IndividuatorSettings => ({ ...prev, language }))}
                    />
                </div>

                <div className={styles['field']}>
                    <SettingsLabel id="individuator-date-format-label" unsaved={unsavedFor('dateFormat')}>
                        {translateIndividuator(IndividuatorTranslationKey.DateFormat)}
                    </SettingsLabel>
                    <Dropdown<DateFormat>
                        popoverClassName={popoverClassName}
                        labelledBy="individuator-date-format-label"
                        size="xs"
                        color="primary"
                        variant="fill"
                        value={pendingSettings.dateFormat.value}
                        options={Individuator.dateFormatOptions.map(({ value, short }) => ({
                            value,
                            short,
                            label: DateTime.fromObject(
                                { year: 2026, month: 6, day: 17 },
                                { locale: Translatron.languages[pendingSettings.language].locale }
                            ).toFormat(value),
                        }))}
                        onChange={(dateFormat) => setPendingSettings((prev): IndividuatorSettings => {
                            const option = Individuator.dateFormatOptions.find((option) => option.value === dateFormat);
                            if (!option) {
                                return prev;
                            }
                            return {
                                ...prev,
                                dateFormat: {
                                    value: option.value,
                                    short: option.short,
                                }
                            };
                        })}
                    />
                </div>

                <div className={styles['field']}>
                    <SettingsLabel id="individuator-time-format-label" unsaved={unsavedFor('timeFormat')}>
                        {translateIndividuator(IndividuatorTranslationKey.TimeFormat)}
                    </SettingsLabel>
                    <Dropdown<TimeFormat>
                        popoverClassName={popoverClassName}
                        labelledBy="individuator-time-format-label"
                        size="xs"
                        color="primary"
                        variant="fill"
                        value={pendingSettings.timeFormat}
                        options={Individuator.timeFormatOptions}
                        onChange={(timeFormat) => setPendingSettings((prev): IndividuatorSettings => ({ ...prev, timeFormat }))}
                    />
                </div>

                <div className={styles['field']}>
                    <SettingsLabel id="individuator-distance-unit-label" unsaved={unsavedFor('distanceUnit')}>
                        {translateIndividuator(IndividuatorTranslationKey.DistanceUnit)}
                    </SettingsLabel>
                    <Dropdown<DistanceUnit>
                        popoverClassName={popoverClassName}
                        labelledBy="individuator-distance-unit-label"
                        size="xs"
                        color="primary"
                        variant="fill"
                        value={pendingSettings.distanceUnit}
                        options={Individuator.distanceUnitOptions.map(({ value, translationKey }) => ({
                            value,
                            label: translateIndividuator(translationKey),
                        }))}
                        onChange={(distanceUnit) => setPendingSettings((prev): IndividuatorSettings => ({ ...prev, distanceUnit }))}
                    />
                </div>

                <div className={styles['field']}>
                    <SettingsLabel id="individuator-theme-label" unsaved={unsavedFor('themeName')}>
                        {translateIndividuator(IndividuatorTranslationKey.Theme)}
                    </SettingsLabel>
                    <ThemeSelect
                        mode={theme.mode}
                        popoverClassName={popoverClassName}
                        labelledBy="individuator-theme-label"
                        size="xs"
                        color="primary"
                        variant="fill"
                        value={pendingSettings.themeName}
                        onChange={(themeName) => setPendingSettings((prev): IndividuatorSettings => ({ ...prev, themeName }))}
                    />
                </div>

                <SettingsCheckbox
                    wide={isWide}
                    id="individuator-confirm-before-leave-label"
                    checked={pendingSettings.confirmBeforeLeave}
                    unsaved={unsavedFor('confirmBeforeLeave')}
                    onChange={(checked) => setPendingSettings((prev): IndividuatorSettings => ({ ...prev, confirmBeforeLeave: checked }))}
                >
                    {translateIndividuator(IndividuatorTranslationKey.ConfirmBeforeLeave)}
                </SettingsCheckbox>
                {isWide && <SettingsLabel id={shortcutsLabelId} unsaved={unsavedFor('enableKeyboardShortcuts')}>{shortcutsLabel}</SettingsLabel>}
                <div className={styles['checkbox-actions']}>
                    <Checkbox
                        className={isWide ? undefined : styles['settings-checkbox']}
                        size="xs"
                        color="primary"
                        labelledBy={shortcutsLabelId}
                        checked={pendingSettings.enableKeyboardShortcuts}
                        onChange={(checked) => setPendingSettings((prev) => ({ ...prev, enableKeyboardShortcuts: checked }))}
                    >
                        {!isWide && <SettingsLabel id={shortcutsLabelId} inline unsaved={unsavedFor('enableKeyboardShortcuts')}>{shortcutsLabel}</SettingsLabel>}
                    </Checkbox>
                    <Button
                        size="xs"
                        color="primary"
                        icon={Icons.NounProject.GoTo}
                        tooltip={translateIndividuator(IndividuatorTranslationKey.GoToKeysmith)}
                        onClick={onOpenKeyboardShortcuts}
                    />
                </div>
                {isDev ? (
                    <SettingsCheckbox
                        wide={isWide}
                        id="individuator-debug-mode-label"
                        checked={pendingSettings.debugMode}
                        unsaved={unsavedFor('debugMode')}
                        onChange={(checked) => setPendingSettings((prev): IndividuatorSettings => ({ ...prev, debugMode: checked }))}
                    >
                        {translateIndividuator(IndividuatorTranslationKey.DebugMode)}
                    </SettingsCheckbox>
                ) : null}
            </div>
        </Dialog>
    );
}
