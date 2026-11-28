import { ComponentProps, ReactNode } from 'react';
import { View, Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { BehaviorSubject } from 'rxjs';
import { useSubjectState } from '@tinker-chest';
import { Orientation, useTheme } from '@ui';
import { MachineWardApp } from '../../apparatus/common/src/machine-ward/MachineWardApp';
import { useMachineWard } from '../../apparatus/common/src/machine-ward/useMachineWard';
import { Individuator } from '../../apparatus/common/src/machine-ward/individuator/individuator';
import { Translatron } from '../../apparatus/common/src/machine-ward/translatron/translatron';
import * as translations from '../../apparatus/common/src/machine-ward/translations';
import { StartupLoading } from '../src/StartupLoading';

jest.mock('@ui', () => ({
    ...jest.requireActual('../../ui/common/src/design-system/theme/model'),
    ...jest.requireActual('../../ui/common/src/design-system/typography/model'),
    ...jest.requireActual('../../ui/common/src/design-system/theme/specifications'),
    ...jest.requireActual('../../ui/common/src/design-system/theme/theme'),
    ...jest.requireActual('../../ui/common/src/design-system/theme/useTheme'),
    ErrorBoundary: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@apparatus', () => jest.requireActual('../../apparatus/common/src/machine-ward/translatron/hooks'));
jest.mock('@mobile-apparatus', () => ({
    useMobileMachineWard: jest.requireActual('../../apparatus/common/src/machine-ward/useMachineWard').useMachineWard,
}));
jest.mock('@mobile-ui', () => ({
    Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}));

const AppContent = () => {
    const { individuator } = useMachineWard();
    const [settings] = useSubjectState(individuator.settings$);
    const theme = useTheme();
    return <Text>{`App: ${theme.mode}/${settings.language}`}</Text>;
};

const createProps = () => {
    const individuator = new Individuator(false);
    individuator.settings$.next({ ...individuator.settings$.value, language: 'en' });
    const translatron = new Translatron();
    translatron.register('machine-ward', translations);
    const props: Partial<ComponentProps<typeof MachineWardApp>> = {
        namespace: 'machine-ward',
        title: 'Machine Ward',
        description: '',
        individuator,
        translatron,
        isReady$: new BehaviorSubject(false),
        media: {
            initial: () => ({ windowWidth: 400, windowHeight: 800, orientation: Orientation.Portrait }),
            subscribe: () => ({ unsubscribe: () => { } }),
        },
        components: {
            layoutComponent: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
            loadingComponent: StartupLoading,
            topBarComponent: () => <Text>Toolbar</Text>,
            machineComponent: AppContent,
            errorFallbackComponent: () => null,
        },
        onMount: async () => { },
        onUnmount: () => { },
    };
    return props as ComponentProps<typeof MachineWardApp>;
};

test('does not mount the app until saved theme and language are ready', async () => {
    const props = createProps();
    const screen = await render(<MachineWardApp {...props} />);
    expect(screen.getByText('Powering up the machine ward:')).toBeVisible();
    expect(screen.queryByText('Toolbar')).toBeNull();
    expect(screen.queryByText('App: dark/en')).toBeNull();

    await act(() => {
        props.individuator.settings$.next({ ...props.individuator.settings$.value, themeMode: 'light', language: 'pl' });
        props.isReady$.next(true);
    });
    expect(screen.getByText('App: light/pl')).toBeVisible();
    expect(screen.getByText('Toolbar')).toBeVisible();
    expect(screen.queryByText('Powering up the machine ward:')).toBeNull();
});

test('keeps the existing immediate rendering when no startup screen is configured', async () => {
    const props = createProps();
    delete props.components.loadingComponent;
    const screen = await render(<MachineWardApp {...props} />);
    expect(screen.getByText('App: dark/en')).toBeVisible();
});
