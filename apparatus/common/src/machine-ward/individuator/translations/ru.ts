import { TranslationTable } from "../../translatron";
import { IndividuatorTranslationKey } from "../model";

const ru: TranslationTable<IndividuatorTranslationKey>['ru'] = {
    "individuator-name": 'Индивидуатор',
    language: 'Язык',
    "date-format": 'Формат даты',
    "time-format": 'Формат времени',
    "distance-unit": 'Единицы расстояния',
    metric: 'Метрические (км)',
    imperial: 'Имперские (мили)',
    theme: 'Тема',
    "confirm-before-leave": 'Подтверждение перед выходом',
    "enable-keyboard-shortcuts": 'Включить сочетания клавиш',
    "show-guide-hints": 'Показывать подсказки',
    "go-to-keysmith": 'Перейти в кузницу клавиш',
    "go-to-individuator": 'Перейти к индивидуатору',
    "debug-mode": 'Режим отладки',
    "unsaved-change": 'Несохранённое изменение',
    "unsaved-change-count": '{{count}} несохранённое изменение',
    "unsaved-changes-count": '{{count}} несохранённых изменения',
    "unsaved-changes-many-count": '{{count}} несохранённых изменений',
};

export default ru;
