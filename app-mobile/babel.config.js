module.exports = {
    presets: [
        'module:@react-native/babel-preset'
    ],
    plugins: [
        'babel-plugin-react-compiler',
        [
            'module-resolver',
            {
                extensions: ['.ts', '.tsx', '.js', '.jsx'],
                alias: {
                    '@apparatus': '../apparatus/common/src',
                    '@mobile-apparatus': '../apparatus/mobile/src',
                    '@tinker-chest': '../tinker-chest/src',
                    '@ui': '../ui/common/src',
                    '@mobile-ui': '../ui/mobile/src',
                    '@the-dead-planet/machine-ward-gears-(.+)$-common': '../gears/\\1/common/src',
                    '@the-dead-planet/machine-ward-gears-(.+)$-mobile': '../gears/\\1/mobile/src'
                },
            },
        ]
    ],
};
