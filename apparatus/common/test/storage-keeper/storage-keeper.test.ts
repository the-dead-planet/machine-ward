import { expect } from 'chai';
import { describe, it } from 'mocha';
import { BehaviorSubject } from 'rxjs';
import { StorageKeeper } from '../../src';

describe('Storage restoration lifetime', () => {
    it('restores saved values and stops persisting when its startup lifetime ends', async () => {
        const writes: { key: string; value: string }[] = [];
        const storageKeeper = new StorageKeeper({
            getItem: () => JSON.stringify({ value: 'saved' }),
            setItem: (key, value) => { writes.push({ key, value }); },
            removeItem: () => { },
        });
        const state = new BehaviorSubject({ value: 'default', enabled: true });
        const controller = new AbortController();
        const subscription = await storageKeeper.synchronizeSubjectWithStorage(state, 'settings', undefined, controller.signal);

        expect(state.value).to.deep.equal({ value: 'saved', enabled: true });
        state.next({ value: 'updated', enabled: false });
        controller.abort();
        state.next({ value: 'after unmount', enabled: true });

        expect(subscription.closed).to.equal(true);
        expect(writes).to.deep.equal([
            { key: 'settings', value: JSON.stringify({ value: 'saved', enabled: true }) },
            { key: 'settings', value: JSON.stringify({ value: 'updated', enabled: false }) },
        ]);
    });
});
