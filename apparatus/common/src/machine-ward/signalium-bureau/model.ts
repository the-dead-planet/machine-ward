import type { TranslationId } from "../translatron";

export type SignaliumNotice = GlitchSignaliumNotice | HazardSignaliumNotice | IntelSignaliumNotice | SecuredSignaliumNotice;

export interface SignaliumHint {
    text: TranslationId;
    keys?: string[];
}

export interface BaseSignaliumNotice {
    id: string;
    text: string;
}

export interface GlitchSignaliumNotice extends BaseSignaliumNotice {
    type: 'glitch';
    error: Error;
}

export interface HazardSignaliumNotice extends BaseSignaliumNotice {
    type: 'hazard';
}

export interface IntelSignaliumNotice extends BaseSignaliumNotice {
    type: 'intel';
}

export interface SecuredSignaliumNotice extends BaseSignaliumNotice {
    type: 'secured';
}
