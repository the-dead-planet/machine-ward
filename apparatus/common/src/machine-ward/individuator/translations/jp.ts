import { TranslationTable } from "../../translatron";
import { IndividuatorTranslationKey } from "../model";

const jp: TranslationTable<IndividuatorTranslationKey>['jp'] = {
    "individuator-name": 'インディヴィデュエーター',
    language: '言語',
    "date-format": '日付形式',
    "time-format": '時間形式',
    "distance-unit": '距離単位',
    metric: 'メートル法 (km)',
    imperial: 'ヤード・ポンド法 (mi)',
    theme: 'テーマ',
    "confirm-before-leave": 'ページを離れる前に確認',
    "enable-keyboard-shortcuts": 'キーボードショートカットを有効にする',
    "go-to-keysmith": 'キー工房を表示',
    "go-to-individuator": 'インディヴィデュエーターを開く',
    "debug-mode": 'デバッグモード',
    "unsaved-change": '未保存の変更',
    "unsaved-change-count": '未保存の変更：{{count}}件',
    "unsaved-changes-count": '未保存の変更：{{count}}件',
    "unsaved-changes-many-count": '未保存の変更：{{count}}件',
};

export default jp;
