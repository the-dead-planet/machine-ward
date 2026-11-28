import { expect } from 'chai';
import { describe, it } from 'mocha';
import { isValidElement } from 'react';
import { BehaviorSubject } from 'rxjs';
import { Orientation } from '@ui';
import { ChronoLens, MachineWard, MachineWardComponents } from '../../src';

class TestChronoLens extends ChronoLens {
    public fileType = 'test';
    public startRecording = async () => { };
    public stopRecording = async () => { };
    public download = async () => { };
    public destroyRecording = () => { };
}

class TestMachineWard extends MachineWard {
    public components: MachineWardComponents = {
        errorFallbackComponent: () => null,
        layoutComponent: () => null,
        topBarComponent: () => null,
        machineComponent: () => null,
    };
    public navigate = () => { };
    public navigateBack = () => { };

    public constructor(storage: StorageLike) {
        super([], TestChronoLens, storage, false, {
            initial: () => ({
                windowWidth: 400,
                windowHeight: 800,
                orientation: Orientation.Portrait,
            }),
            subscribe: () => ({ unsubscribe: () => { } }),
        });
    }
}

const createStartup = () => {
    const pendingReads = new Map<string, (value: string | null) => void>();
    const writes: { key: string; value: string }[] = [];
    const machineWard = new TestMachineWard({
        getItem: (key) => new Promise<string | null>((resolve) => pendingReads.set(key, resolve)),
        setItem: (key, value) => { writes.push({ key, value }); },
        removeItem: () => { },
    });
    const element = machineWard.render();
    if (!isValidElement<{ onMount: () => Promise<void>; isReady$: BehaviorSubject<boolean> }>(element)) {
        throw new Error('Expected the application root.');
    }
    return { machineWard, pendingReads, writes, ...element.props };
};

describe('Startup settings restoration', () => {
    it('waits for settings and every saved map preference before becoming ready', async () => {
        const startup = createStartup();
        const mounted = startup.onMount();
        try {
            startup.pendingReads.get('application-settings')?.(JSON.stringify({ language: 'pl', themeMode: 'light' }));
            startup.pendingReads.get('cartomancer:map-style')?.(JSON.stringify({ id: 'background' }));
            startup.pendingReads.get('cartomancer:gauge-controls')?.(null);
            await new Promise<void>((resolve) => setImmediate(resolve));
            expect(startup.isReady$.value).to.equal(false);
            startup.pendingReads.get('cartomancer:map-layout')?.(null);
            await mounted;

            expect(startup.isReady$.value).to.equal(true);
            expect(startup.machineWard.individuator.settings$.value).to.include({ language: 'pl', themeMode: 'light' });
            expect(startup.machineWard.cartomancer.selectedStyle$.value.id).to.equal('background');
        } finally {
            startup.machineWard.unmount();
        }
    });

    it('does not restore or persist late settings after unmounting', async () => {
        const startup = createStartup();
        const mounted = startup.onMount();
        startup.machineWard.unmount();
        for (const resolve of startup.pendingReads.values()) {
            resolve(JSON.stringify({ language: 'pl', themeMode: 'light', id: 'background' }));
        }
        await mounted;

        expect(startup.isReady$.value).to.equal(false);
        expect(startup.machineWard.individuator.settings$.value.themeMode).to.equal('dark');
        expect(startup.writes).to.deep.equal([]);
    });

    it('continues with defaults when device storage is unavailable', async () => {
        const startup = createStartup();
        startup.machineWard.storageKeeper.storage.getItem = async () => {
            throw new Error('Device storage is unavailable');
        };
        try {
            await startup.onMount();
            expect(startup.isReady$.value).to.equal(true);
            expect(startup.machineWard.individuator.settings$.value.themeMode).to.equal('dark');
        } finally {
            startup.machineWard.unmount();
        }
    });
});
