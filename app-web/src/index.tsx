import type * as maplibregl from "maplibre-gl";
import { createRoot } from 'react-dom/client';
import { MachineGear, Translatron } from '@apparatus';
import { WebMachineWard } from './machine-ward';
import { ErrorFallbackPage } from './pages';
import "./index.css";
import { WebChronoLens } from "@web-apparatus";

declare const __GEAR_REGISTRY__: string[];

const container = document.getElementById('app');
const root = createRoot(container!);

function setGearStartupState(state: 'pending' | 'downloaded' | 'failed') {
    window.dispatchEvent(new CustomEvent('startup-gears', {
        detail: state,
    }));
}

async function initializeApp() {
    const startupLanguage = Translatron.resolveLanguage(undefined, document.documentElement.lang);
    try {
        setGearStartupState('pending');
        const modules = await Promise.allSettled(__GEAR_REGISTRY__.map((gearName) => import(`../../gears/${gearName}/web/src`)));
        const [gears, rejected] = modules
            .reduce<[MachineGear<maplibregl.Map, WebChronoLens>[], string[]]>(
                (acc, module, i) => {
                    const gearName = __GEAR_REGISTRY__[i];
                    if (module.status === 'fulfilled') {
                        acc[0].push(module.value.default);
                    } else {
                        acc[1].push(`${gearName} (${module.reason})`);
                    }
                    return acc;
                },
                [[], []]
            );

        const machineWard = new WebMachineWard(gears);
        setGearStartupState(rejected.length > 0 ? 'failed' : 'downloaded');
        root.render(machineWard.render());

        if (rejected.length > 0) {
            console.warn('Some gears failed to load:', rejected);
            machineWard.signaliumBureau.addNotice({
                id: 'gear-load-errors',
                type: 'hazard',
                text: machineWard.translatron.translate(startupLanguage, machineWard.translatron.registry$.value, {
                    n: machineWard.namespace,
                    t: machineWard.translationKey.GearLoadErrors,
                    p: {
                        gears: rejected.join(', '),
                    },
                }),
            });
        }
    } catch (err) {
        setGearStartupState('failed');
        const error = err as Error;
        root.render(<ErrorFallbackPage error={error} errorInfo={{ componentStack: error.stack }} />);
    }

}

initializeApp();
