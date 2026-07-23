module.exports = {
  presets: ['module:@react-native/babel-preset'],
  env: {
    // Applied automatically when process.env.BABEL_ENV || process.env.NODE_ENV === 'production'.
    // RN's CLI sets NODE_ENV=production for any non-debuggable build variant
    // (Android `release` buildType, iOS Release scheme), i.e. real .apk/.aab/.ipa
    // builds - dev builds and the Metro dev server are untouched.
    production: {
      plugins: [
        [
          'transform-remove-console',
          // Keep warn/error visible in production (crash reporting, Sentry, etc.)
          { exclude: ['error', 'warn'] },
        ],
      ],
    },
  },
};
