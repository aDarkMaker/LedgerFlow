import { useEffect, useState } from 'react';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { palette } from '@ledgerflow/ui';

import { prepareDatabase } from '@/lib/database';
import { useLedgerStore } from '@/state/ledger-store';
import { useAppFonts } from '@/theme/fonts';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loaded, error } = useAppFonts();
  const [storageReady, setStorageReady] = useState(false);
  const bootstrap = useLedgerStore((state) => state.bootstrap);

  useEffect(() => {
    if (error !== null) {
      void SplashScreen.hideAsync();
      return;
    }
    void prepareDatabase()
      .then(() => bootstrap())
      .finally(() => {
        setStorageReady(true);
        void SplashScreen.hideAsync();
      });
  }, [bootstrap, error]);

  if (!loaded || !storageReady) {
    return <View style={{ flex: 1, backgroundColor: palette.canvas }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.canvas },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="entry/new"
            options={{
              presentation: 'transparentModal',
              animation: 'none',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
