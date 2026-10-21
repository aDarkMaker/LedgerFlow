import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_VERSION = '0.1.0';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'LedgerFlow',
  slug: 'ledgerflow',
  version: APP_VERSION,
  runtimeVersion: { policy: 'appVersion' },
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
    ['expo-router', { asyncRoutes: { web: false, default: false } }],
    'expo-sqlite',
    'expo-secure-store',
    'expo-font',
    'expo-updates',
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow LedgerFlow to pick a photo for your avatar and wallpaper.',
      },
    ],
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
  web: {
    bundler: 'metro',
    output: 'static',
  },
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
