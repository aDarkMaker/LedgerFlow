import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_VERSION = '0.1.0';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'LedgerFlow',
  slug: 'ledgerflow',
  version: APP_VERSION,
  orientation: 'portrait',
  scheme: 'ledgerflow',
  userInterfaceStyle: 'light',
  android: {
    package: 'com.ledgerflow.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFF6E9',
    },
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    'expo-secure-store',
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFF6E9',
        image: './assets/splash-icon.png',
        imageWidth: 160,
        resizeMode: 'contain',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: String(process.env.EAS_PROJECT_ID ?? ''),
    },
  },
});
