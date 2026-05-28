const appJson = require('./app.json');

const baseConfig = appJson.expo ?? appJson;

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN?.trim();

module.exports = () => {
  const plugins = (baseConfig.plugins ?? []).filter((plugin) => {
    if (typeof plugin === 'string') {
      return plugin !== '@sentry/react-native/expo';
    }

    return plugin?.[0] !== '@sentry/react-native/expo';
  });

  if (sentryAuthToken) {
    plugins.push([
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        organization: 'lift-prayer-network',
        project: 'android-wx',
      },
    ]);
  } else {
    console.warn(
      '[expo-config] SENTRY_AUTH_TOKEN is missing, so the Sentry Expo plugin is disabled for this build.'
    );
  }

  return {
    ...baseConfig,
    plugins,
  };
};
