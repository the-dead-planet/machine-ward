import path from "path";
import rspack, { Configuration } from "@rspack/core";
import GearRegistryGenerator from "./rspack.gears";
import { themeSpecifications } from "@the-dead-planet/machine-ward-ui-common/src/design-system/theme/specifications";
import { RGBColor, ThemeName } from "@the-dead-planet/machine-ward-ui-common/src/design-system/theme/model";
import { Translatron } from "@the-dead-planet/machine-ward-apparatus-common/src/machine-ward/translatron/translatron";
import { MachineTranslationKey } from "@the-dead-planet/machine-ward-apparatus-common/src/machine-ward/model";
import * as translations from "@the-dead-planet/machine-ward-apparatus-common/src/machine-ward/translations";
import { Language } from "@the-dead-planet/machine-ward-apparatus-common/src/machine-ward/translatron/model";

const toCssColor = ({ r, g, b }: RGBColor): string => `rgb(${r}, ${g}, ${b})`;
const startupThemes = Object.fromEntries(Object.entries(themeSpecifications).map(([name, modes]) => [
    name,
    Object.fromEntries(Object.entries(modes).map(([mode, specification]) => [
        mode,
        {
            background: toCssColor(specification.colors.neutral[mode === 'light' ? 100 : 900]),
            color: toCssColor(specification.colors.neutral[mode === 'light' ? 900 : 100]),
        },
    ])),
]));
const englishTranslations = translations.en;
if (englishTranslations === undefined) {
    throw new Error('English startup translations are required.');
}
const getStartupTranslation = (language: Language, key: MachineTranslationKey): string =>
    translations[language]?.[key] ?? englishTranslations[key];
const startupWelcome = getStartupTranslation('en', MachineTranslationKey.StartupWelcome);
const startupMessages = Object.fromEntries(Object.entries(Translatron.languageAliases).map(([alias, language]) => [
    alias,
    {
        language,
        locale: Translatron.languages[language].locale,
        welcome: getStartupTranslation(language, MachineTranslationKey.StartupWelcome),
        title: getStartupTranslation(language, MachineTranslationKey.PoweringUpMachineWard),
        statuses: {
            pending: getStartupTranslation(language, MachineTranslationKey.StartupDownloadPending),
            downloaded: getStartupTranslation(language, MachineTranslationKey.StartupDownloadComplete),
            failed: getStartupTranslation(language, MachineTranslationKey.StartupDownloadFailed),
        },
        sharedLibraries: getStartupTranslation(language, MachineTranslationKey.SharedLibraries),
        interface: getStartupTranslation(language, MachineTranslationKey.UserInterfaceAssemblyKit),
        apparatus: getStartupTranslation(language, MachineTranslationKey.Apparatus),
        tinkerChest: getStartupTranslation(language, MachineTranslationKey.TinkerChest),
        runtime: getStartupTranslation(language, MachineTranslationKey.InterfaceRuntime),
        mapEngine: getStartupTranslation(language, MachineTranslationKey.MapEngine),
        machineWard: getStartupTranslation(language, MachineTranslationKey.MachineWard),
        aligningGears: getStartupTranslation(language, MachineTranslationKey.AligningGears),
    },
]));

export type Env = {
    production?: boolean;
    analyze?: boolean;
};

export type Argv = {
    mode?: 'development' | 'production' | 'none';
};

export const baseConfig = (_env: Env, argv: Argv): Configuration => ({
    resolve: {
        extensions: [".js", ".ts", ".tsx"],
        fallback: {
            url: require.resolve("url"),
        },
        alias: {
            '@apparatus': path.resolve(__dirname, '../apparatus/common/src'),
            '@web-apparatus': path.resolve(__dirname, '../apparatus/web/src'),
            '@tinker-chest': path.resolve(__dirname, '../tinker-chest/src'),
            '@ui': path.resolve(__dirname, '../ui/common/src'),
            '@web-ui': path.resolve(__dirname, '../ui/web/src'),
        },
    },
    module: {
        rules: [
            {
                test: /\.(?:js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'builtin:swc-loader',
                    options: {
                        detectSyntax: 'auto',
                        jsc: {
                            transform: {
                                react: {
                                    runtime: 'automatic',
                                    development: argv.mode !== 'production',
                                },
                                reactCompiler: true,
                            },
                        },
                    },
                },
            },
            {
                test: /\.(json|xml|ttf|woff|woff2|otf|eot)$/,
                exclude: /node_modules/,
                type: "asset/resource",
            },
            {
                test: /\.(png|jpg|jpeg|gif)$/i,
                exclude: /node_modules/,
                type: "asset/resource",
            },
            {
                test: /\.svg$/,
                issuer: /\.[jt]sx?$/,
                oneOf: [
                    {
                        resourceQuery: /component/,
                        use: [
                            {
                                loader: '@svgr/webpack',
                                options: {
                                    exportType: 'default',
                                },
                            },
                        ],
                    },
                    {
                        type: 'asset/resource',
                        generator: {
                            filename: 'static/media/[name].[contenthash][ext]',
                        },
                    },
                ],
            },
            {
                test: /\.m?js$/,
                type: 'javascript/auto',
                resolve: {
                    fullySpecified: false
                },
            },
        ],
    },
    plugins: [
        new GearRegistryGenerator(),
        new rspack.HtmlRspackPlugin({
            filename: 'index.html',
            template: './src/index.html',
            favicon: "./public/favicon.ico",
            templateParameters: {
                startupThemes: JSON.stringify(startupThemes).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;'),
                defaultThemeName: ThemeName.Default,
                startupMessages: JSON.stringify(startupMessages).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;'),
                startupWelcome,
                startupTitle: getStartupTranslation('en', MachineTranslationKey.PoweringUpMachineWard),
            },
            inject: 'body'
        }),
        new rspack.CopyRspackPlugin({
            patterns: [
                {
                    from: "../apparatus/common/public",
                    to: './'
                },
                {
                    context: '../gears/',
                    from: '*/common/public/**/*',
                    to: '[name][ext]',
                    toType: 'template',
                    noErrorOnMissing: true,
                },
                {
                    context: '../gears/',
                    from: '*/web/public/**/*',
                    to: '[name][ext]',
                    toType: 'template',
                    noErrorOnMissing: true,
                },
                {
                    from: "./public",
                    to: './'
                },
                {
                    from: "../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs",
                    to: './maplibre-gl-worker.mjs',
                    noErrorOnMissing: true,
                },
                {
                    from: "../node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs",
                    to: './maplibre-gl-shared.mjs',
                    noErrorOnMissing: true,
                },
                {
                    context: '../ui/common/public',
                    from: '**/*',
                    to: '[path][name][ext]',
                    toType: 'template',
                    noErrorOnMissing: true,
                },
            ],
        }),
    ],
    ignoreWarnings: [
        {
            module: /maplibre-gl/,
            message: /Critical dependency/,
        },
    ],
    output: {
        uniqueName: 'app',
        filename: '[name].bundle.js',
        chunkFilename: '[name].bundle.js',
        assetModuleFilename: 'static/[name]-[contenthash][ext][query]',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    }
});

export default baseConfig;
