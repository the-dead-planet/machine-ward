import { ComponentType, ReactNode } from "react";
import { ErrorBoundaryProps } from "@ui";
import { ChronoLens, SignaliumNotice } from "..";
import { Gear, GearApparatus } from "./gears";

export interface MachineWardLayoutProps {
    children?: ReactNode;
}

export interface MachineWardTopBarProps<TNavigationPath extends string = string> {
    title: string;
    description: string;
    onNavigate: (path: TNavigationPath) => void;
    onNavigateBack: () => void;
}

export interface MachineWardMachineProps<TNavigationPath extends string = string> {
    onNavigate: (path: TNavigationPath) => void;
    onNavigateBack: () => void;
}

export interface MachineWardNoticesProps {
    notices: SignaliumNotice[];
    onRemove: (id: string) => void;
}

export interface MachineWardComponents<TNavigationPath extends string = string> {
    errorFallbackComponent: ErrorBoundaryProps['fallbackComponent'];
    layoutComponent: ComponentType<MachineWardLayoutProps>;
    topBarComponent: ComponentType<MachineWardTopBarProps<TNavigationPath>>;
    machineComponent: ComponentType<MachineWardMachineProps<TNavigationPath>>;
    noticesComponent: ComponentType<MachineWardNoticesProps>;
}

export type MachineGear<TMap, MobileChronoLens extends ChronoLens> = new (apparatus: GearApparatus<TMap, MobileChronoLens>) => Gear<TMap, MobileChronoLens>;

export enum MachineTranslationKey {
    MachineWard = 'machine-ward',
    ComponentLibrary = 'component-library',
    IconCreators = 'icon-creators',
    Stories = 'stories',
    Files = 'files',
    Legal = 'legal',
    Privacy = 'privacy',
    Close = 'close',
    Cancel = 'cancel',
    Save = 'save',
    On = 'on',
    Off = 'off',
    Menu = 'menu',
    GoBack = 'go-back',
    SwitchToLightMode = 'switch-to-light-mode',
    SwitchToDarkMode = 'switch-to-dark-mode',
    Gears = 'gears',
    Collapse = 'collapse',
    Expand = 'expand',
    PanelMenu = 'panel-menu',
    SwapPlacement = 'swap-placement',
    DragToResize = 'drag-to-resize',
    Attributions = 'attributions',
    UnderConstruction = 'under-construction',
    PoweringUpMachineWard = 'powering-up-machine-ward',
    KeyboardShortcuts = 'keyboard-shortcuts',
    ShortcutLabel = 'shortcut-label',
    ShortcutKeys = 'shortcut-keys',
    ShortcutDescription = 'shortcut-description',
    ShortcutActive = 'shortcut-active',
    ShortcutInactive = 'shortcut-inactive',
    ShortcutStatus = 'shortcut-status',
    FilterShortcutKeys = 'filter-shortcut-keys',
    AllShortcutKeys = 'all-shortcut-keys',
    NoMatchingShortcutKeys = 'no-matching-shortcut-keys',
    ShortcutRequirements = 'shortcut-requirements',
    ShortcutAvailable = 'shortcut-available',
    ShortcutUnavailable = 'shortcut-unavailable',
    NoKeyboardShortcuts = 'no-keyboard-shortcuts',
}
