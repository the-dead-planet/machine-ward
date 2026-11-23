import { TranslationId } from "../translatron";

export interface KeyBinding {
    key: string;
    control?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
}

export interface ShortcutDefinition {
    id: string;
    description: TranslationId;
    binding: KeyBinding;
    allowRepeat?: boolean;
}

export interface ShortcutRegistration extends ShortcutDefinition {
    isAvailable: () => boolean;
    execute: () => void;
}
