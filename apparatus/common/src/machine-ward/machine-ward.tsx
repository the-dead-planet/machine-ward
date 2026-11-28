import { ReactElement } from "react";
import { BehaviorSubject, map, pairwise, Subscription } from "rxjs";
import { MachineWardApp } from "./MachineWardApp";
import { Individuator } from "./individuator";
import { ChronoLens } from "./chrono-lens";
import { AttributionVault, Cartomancer, getActiveShortcutHints, glitchmitter, SignaliumBureau, ToolsStation, Translatron } from "..";
import { Engine } from "./engine";
import { Gear } from "./gears";
import { StorageKeeper } from "./storage-keeper";
import { MachineGear, MachineTranslationKey, MachineWardComponents } from "./model";
import { TranslationTable } from "./translatron";
import { MediaSubscriptionDefinition } from "@ui";
import { Keysmith } from "./keysmith";
import type { SignaliumHint } from "./signalium-bureau/model";
import * as Translations from "./translations";

/**
 * Ward with machines. 
 * 
 * Describes the expected content of the applications and renders complete app.
 */
export abstract class MachineWard<TMap = unknown, TChronoLens extends ChronoLens = ChronoLens, TNavigationPath extends string = string> {
    public title = "Machine Ward";
    public description = "The Dead Planet's Machine Ward"

    private readonly isDev: boolean;
    public readonly namespace = 'machine-ward';
    public readonly translations: TranslationTable<MachineTranslationKey> = Translations;
    public readonly translationKey = MachineTranslationKey;

    public readonly individuator: Individuator;
    public readonly storageKeeper: StorageKeeper;
    public readonly engine = new Engine<TMap, TChronoLens>();
    public readonly attributionVault = new AttributionVault();
    public readonly signaliumBureau = new SignaliumBureau();
    public readonly translatron = new Translatron();
    public readonly cartomancer: Cartomancer<TMap>;
    public readonly chronoLens: TChronoLens;
    public readonly toolsStation = new ToolsStation<TMap>();
    public readonly keysmith = new Keysmith();

    private attributionVaultSubscription: Subscription | null = null;
    private readonly supportsBackdropBlur: boolean;
    private readonly isReady$ = new BehaviorSubject(false);
    private initializationController: AbortController | null = null;

    public constructor(
        gears: MachineGear<TMap, TChronoLens>[],
        chronoLens: new (individuator: Individuator) => TChronoLens,
        storage: StorageLike,
        isDev: boolean,
        protected media: MediaSubscriptionDefinition,
        { supportsBackdropBlur = true }: { supportsBackdropBlur?: boolean } = {},
    ) {
        this.supportsBackdropBlur = supportsBackdropBlur;
        this.isDev = isDev;
        this.translatron.register(this.namespace, this.translations);

        this.storageKeeper = new StorageKeeper(storage);
        this.individuator = new Individuator(isDev);
        this.cartomancer = new Cartomancer();
        this.chronoLens = new chronoLens(this.individuator);

        this.engine.addGears(
            gears.reduce<Gear<TMap, TChronoLens>[]>((acc, Gear) => {
                if (Gear) {
                    acc.push(new Gear({
                        individuator: this.individuator,
                        storageKeeper: this.storageKeeper,
                        signaliumBureau: this.signaliumBureau,
                        attributionVault: this.attributionVault,
                        chronoLens: this.chronoLens,
                        cartomancer: this.cartomancer,
                        toolsStation: this.toolsStation,
                        keysmith: this.keysmith,
                        translatron: this.translatron,
                    }));
                }
                return acc;
            }, [])
        );
    }

    private gearsSubscription: Subscription | null = null;
    private keysmithHintsSubscription: Subscription | null = null;
    private keysmithHintIds = new Set<string>();

    private initializeValves = () => {
        this.engine.openValves(this.engine.gears$.value);
        this.gearsSubscription = this.engine.gears$
            .pipe(pairwise())
            .subscribe(([prev, next]) => {
                this.engine.closeValves(prev);
                this.engine.openValves(next);
            });
    };

    private mount = () => {
        const controller = new AbortController();
        this.initializationController = controller;
        const restoration = Promise.all([
            this.individuator.initialize(this.storageKeeper, this.translatron, controller.signal),
            this.cartomancer.initialize(this.storageKeeper, this.translatron, this.toolsStation, controller.signal),
        ]);
        this.attributionVaultSubscription = this.subscribeAttributionVault();
        this.initializeValves();
        this.keysmithHintsSubscription = this.keysmith.shortcuts$
            .pipe(map(getActiveShortcutHints))
            .subscribe((hints) => this.publishKeysmithHints(hints));
        return restoration
            .catch((error: unknown) => glitchmitter.transmit('Error restoring startup settings', error))
            .then(() => {
                if (!controller.signal.aborted) {
                    this.isReady$.next(true);
                }
            });
    };

    public unmount = () => {
        this.initializationController?.abort();
        this.initializationController = null;
        this.isReady$.next(false);
        this.gearsSubscription?.unsubscribe();
        this.cartomancer.cleanUp();
        this.attributionVaultSubscription?.unsubscribe();
        this.individuator.cleanUp();
        this.toolsStation.cleanUp();
        this.keysmith.cleanUp();
        this.keysmithHintsSubscription?.unsubscribe();
        this.keysmithHintsSubscription = null;
        this.keysmithHintIds.clear();
    };

    private publishKeysmithHints = (hints: ReadonlyMap<string, SignaliumHint>) => {
        for (const id of this.keysmithHintIds) {
            if (!hints.has(id)) {
                this.signaliumBureau.setHint(id, null);
            }
        }

        for (const [id, hint] of hints) {
            this.signaliumBureau.setHint(id, hint);
        }
        this.keysmithHintIds = new Set(hints.keys());
    };

    private subscribeAttributionVault = (): Subscription => {
        const addEntry = (styleId: keyof typeof Cartomancer.styles) => {
            const style = Cartomancer.styles[styleId];
            if (!style?.attribution) {
                return;
            }
            this.attributionVault.addEntry(styleId, style.attribution);
        };

        addEntry(this.cartomancer.selectedStyle$.value.id);

        return this.cartomancer.selectedStyle$
            .pipe(pairwise())
            .subscribe(([prev, next]) => {
                this.attributionVault.removeEntry(prev.id);
                addEntry(next.id);
            });
    };

    /**
     * Routing and navigation between aplication views
     */
    public abstract navigate: (path: TNavigationPath) => void;

    /**
     * Routing and navigation back
     */
    public abstract navigateBack: () => void;

    public abstract components: MachineWardComponents<TNavigationPath>;

    public render = (): ReactElement => {
        return (
            <MachineWardApp
                isDev={this.isDev}
                namespace={this.namespace}
                title={this.title}
                description={this.description}
                media={this.media}
                supportsBackdropBlur={this.supportsBackdropBlur}
                individuator={this.individuator}
                storageKeeper={this.storageKeeper}
                signaliumBureau={this.signaliumBureau}
                attributionVault={this.attributionVault}
                cartomancer={this.cartomancer}
                chronoLens={this.chronoLens}
                toolsStation={this.toolsStation}
                keysmith={this.keysmith}
                translatron={this.translatron}
                engine={this.engine}
                components={this.components}
                isReady$={this.isReady$}
                onMount={this.mount}
                onUnmount={this.unmount}
                onNavigate={this.navigate}
                onNavigateBack={this.navigateBack}
            />
        );
    }
}
