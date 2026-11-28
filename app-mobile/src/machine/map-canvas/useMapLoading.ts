import { useEffect, useState } from 'react';
import { useSubjectState } from '@tinker-chest';
import { useMobileMachineWard } from '@mobile-apparatus';
import { useTranslate } from '@apparatus';

export const useMapLoading = () => {
    const { cartomancer, signaliumBureau, namespace, translationKey } = useMobileMachineWard();
    const translate = useTranslate();
    const [selectedStyle] = useSubjectState(cartomancer.selectedStyle$);
    const [isInitialised, setIsInitialised] = useSubjectState(cartomancer.isInitialised$);
    const [isStyleLoaded, setIsStyleLoaded] = useSubjectState(cartomancer.isStyleLoaded$);
    const [hasFailed, setHasFailed] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        cartomancer.isInitialised$.next(false);
        cartomancer.isStyleLoaded$.next(false);
        setHasFailed(false);
        setIsDismissed(false);
    }, [cartomancer, selectedStyle.id]);

    const isReady = isInitialised && isStyleLoaded;

    return {
        selectedStyle,
        isReady,
        isVisible: !isDismissed && (hasFailed || !isReady),
        hasFailed,
        dismiss: () => setIsDismissed(true),
        onStyleLoaded: () => setIsStyleLoaded(true),
        onMapRendered: () => {
            setIsInitialised(true);
            setHasFailed(false);
            signaliumBureau.removeNotice('map-failed');
        },
        onMapFailed: () => {
            setHasFailed(true);
            signaliumBureau.addNotice({
                id: 'map-failed',
                type: 'glitch',
                error: new Error('Map loading failed'),
                text: translate({ n: namespace, t: translationKey.MapLoadingFailed }),
            });
        },
    };
};
