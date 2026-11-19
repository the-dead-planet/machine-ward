import { Option } from "../../model";
import { ThemeMode, ThemeName, ThemeSpecification } from "./model";
import { palette } from "./palette";

export const themeNameOptions: Option<ThemeName>[] = Object.values(ThemeName)
    .map((value) => ({ value, label: value }));

export const themeModeOptions: Option<ThemeMode>[] = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
];

export const defaultStatusColors: { [key in ThemeMode]: ThemeSpecification['statusColors'] } = {
    light: {
        glitch: {
            name: 'red',
            shade: 600
        },
        hazard: {
            name: 'yellow',
            shade: 500
        },
        secured: {
            name: 'lime',
            shade: 500
        },
        intel: {
            name: 'blue',
            shade: 400
        },
    },
    dark: {
        glitch: {
            name: 'red',
            shade: 600
        },
        hazard: {
            name: 'yellow',
            shade: 500
        },
        secured: {
            name: 'lime',
            shade: 500
        },
        intel: {
            name: 'blue',
            shade: 400
        },
    },
}

const standardTheme = (
    themeName: ThemeName,
    lightColors: ThemeSpecification['colors'],
    darkColors: ThemeSpecification['colors'],
): { [key in ThemeMode]: ThemeSpecification } => ({
    light: {
        mode: 'light',
        themeName,
        statusColors: defaultStatusColors.light,
        colors: lightColors,
    },
    dark: {
        mode: 'dark',
        themeName,
        statusColors: defaultStatusColors.dark,
        colors: darkColors,
    },
});

export const themeSpecifications: { [key in ThemeName]: { [key in ThemeMode]: ThemeSpecification } } = {
    [ThemeName.Default]: standardTheme(
        ThemeName.Default,
        {
            primary: palette.teal,
            secondary: palette.copper,
            tertiary: palette.pink,
            neutral: palette['neutral-grey'],
        },
        {
            primary: palette.teal,
            secondary: palette.yellow,
            tertiary: palette.pink,
            neutral: palette['neutral-grey'],
        },
    ),
    [ThemeName.NeonBlue]: standardTheme(
        ThemeName.NeonBlue,
        {
            primary: palette.navy,
            secondary: palette.navy,
            tertiary: palette.copper,
            neutral: palette['neutral-grey'],
        },
        {
            primary: palette.blue,
            secondary: palette.blue,
            tertiary: palette.copper,
            neutral: palette['neutral-grey'],
        },
    ),
    [ThemeName.Batman]: {
        light: {
            mode: 'light',
            themeName: ThemeName.Batman,
            statusColors: {
                ...defaultStatusColors.light,
                hazard: {
                    name: 'luminous-yellow',
                    shade: 600,
                },
            },
            colors: {
                primary: palette['neutral-blue'],
                secondary: palette['neutral-blue'],
                tertiary: palette['dark-gold'],
                neutral: palette['neutral-blue'],
            }
        },
        dark: {
            mode: 'dark',
            themeName: ThemeName.Batman,
            statusColors: {
                ...defaultStatusColors.dark,
                hazard: {
                    name: 'luminous-yellow',
                    shade: 500,
                },
            },
            colors: {
                primary: palette['neutral-blue'],
                secondary: palette['neutral-blue'],
                tertiary: palette['luminous-yellow'],
                neutral: palette['neutral-blue'],
            },
        }
    },
    [ThemeName.Joker]: {
        light: {
            mode: 'light',
            themeName: ThemeName.Joker,
            statusColors: {
                ...defaultStatusColors.light,
                hazard: {
                    name: 'chartreuse',
                    shade: 500,
                }
            },
            colors: {
                primary: palette.violet,
                secondary: palette.lime,
                tertiary: palette['burnt-orange'],
                neutral: palette['neutral-grey'],
            }
        },
        dark: {
            mode: 'dark',
            themeName: ThemeName.Joker,
            statusColors: {
                ...defaultStatusColors.dark,
                hazard: {
                    name: 'chartreuse',
                    shade: 500,
                }
            },
            colors: {
                primary: palette.violet,
                secondary: palette.lime,
                tertiary: palette['burnt-orange'],
                neutral: palette['deep-violet'],
            },
        }
    },
    [ThemeName.Foundry]: standardTheme(
        ThemeName.Foundry,
        {
            primary: palette.mahogany,
            secondary: palette.copper,
            tertiary: palette.teal,
            neutral: palette['neutral-brown'],
        },
        {
            primary: palette.coral,
            secondary: palette.copper,
            tertiary: palette.aqua,
            neutral: palette['neutral-brown'],
        },
    ),
    [ThemeName.Aurora]: standardTheme(
        ThemeName.Aurora,
        {
            primary: palette.indigo,
            secondary: palette.mint,
            tertiary: palette.rose,
            neutral: palette['neutral-violet'],
        },
        {
            primary: palette.purple,
            secondary: palette.mint,
            tertiary: palette.rose,
            neutral: palette['deep-violet'],
        },
    ),
    [ThemeName.SolarFlare]: standardTheme(
        ThemeName.SolarFlare,
        {
            primary: palette.orange,
            secondary: palette.plum,
            tertiary: palette.green,
            neutral: palette['neutral-khaki'],
        },
        {
            primary: palette.peach,
            secondary: palette.magenta,
            tertiary: palette.mint,
            neutral: palette['neutral-olive'],
        },
    ),
    [ThemeName.Verdant]: standardTheme(
        ThemeName.Verdant,
        {
            primary: palette.green,
            secondary: palette.chartreuse,
            tertiary: palette.plum,
            neutral: palette['neutral-green'],
        },
        {
            primary: palette.mint,
            secondary: palette.lime,
            tertiary: palette.magenta,
            neutral: palette['neutral-green'],
        },
    ),
    [ThemeName.GoldenCircuit]: standardTheme(
        ThemeName.GoldenCircuit,
        {
            primary: palette['dark-gold'],
            secondary: palette.navy,
            tertiary: palette.mahogany,
            neutral: palette['neutral-khaki'],
        },
        {
            primary: palette['luminous-yellow'],
            secondary: palette.blue,
            tertiary: palette.coral,
            neutral: palette['neutral-khaki'],
        },
    ),
};
