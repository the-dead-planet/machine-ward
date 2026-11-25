import { TranslationId } from "../translatron";
import type { Observable } from "rxjs";

export interface KeyBinding {
    key: string;
    control?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
}

export interface ShortcutDefinition {
    id: string;
    owner?: TranslationId;
    label: TranslationId;
    description: TranslationId;
    hint: TranslationId;
    requirements?: TranslationId;
    makeUnavailableHint?: TranslationId;
    binding: KeyBinding;
    allowRepeat?: boolean;
}

export interface ShortcutRegistration extends ShortcutDefinition {
    presence$?: Observable<boolean>;
    availability$: Observable<boolean>;
    execute: () => void;
}

export interface ShortcutStatus extends ShortcutDefinition {
    present: boolean;
    active: boolean;
}
