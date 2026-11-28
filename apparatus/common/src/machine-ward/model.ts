import { ComponentType, ReactNode } from "react";
import { ErrorBoundaryProps } from "@ui";
import { ChronoLens } from "..";
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

export interface MachineWardComponents<TNavigationPath extends string = string> {
    errorFallbackComponent: ErrorBoundaryProps['fallbackComponent'];
    layoutComponent: ComponentType<MachineWardLayoutProps>;
    topBarComponent: ComponentType<MachineWardTopBarProps<TNavigationPath>>;
    machineComponent: ComponentType<MachineWardMachineProps<TNavigationPath>>;
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
    Notices = 'notices',
    RemoveNotice = 'remove-notice',
    Glitch = 'glitch',
    Hazard = 'hazard',
    Intel = 'intel',
    OneGlitch = 'one-glitch',
    FewGlitches = 'few-glitches',
    GlitchCount = 'glitch-count',
    OneHazard = 'one-hazard',
    FewHazards = 'few-hazards',
    HazardCount = 'hazard-count',
    OneIntel = 'one-intel',
    FewIntel = 'few-intel',
    IntelCount = 'intel-count',
    Secured = 'secured',
    OneSecured = 'one-secured',
    FewSecured = 'few-secured',
    SecuredCount = 'secured-count',
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
    StartupWelcome = 'startup-welcome',
    KeyboardShortcuts = 'keyboard-shortcuts',
    Keysmith = 'keysmith',
    Label = 'label',
    ShortcutKeys = 'shortcut-keys',
    Description = 'description',
    Enabled = 'enabled',
    Disabled = 'disabled',
    Status = 'status',
    FilterShortcutKeys = 'filter-shortcut-keys',
    AllShortcutKeys = 'all-shortcut-keys',
    Available = 'available',
    Unavailable = 'unavailable',
    NoKeyboardShortcuts = 'no-keyboard-shortcuts',
}
