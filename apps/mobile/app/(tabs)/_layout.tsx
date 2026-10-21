import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, fontSize, Icon, palette } from '@ledgerflow/ui';

import { Wallpaper } from '@/components/wallpaper';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Wallpaper />
      <Tabs
        screenOptions={{
          headerShown: false,
          lazy: false,
          animation: 'shift',
          sceneStyle: styles.scene,
          tabBarLabelPosition: 'below-icon',
          tabBarActiveTintColor: palette.ink,
          tabBarInactiveTintColor: palette.inkSoft,
          tabBarStyle: [
            styles.bar,
            { height: 76 + insets.bottom, paddingBottom: insets.bottom + 8 },
          ],
          tabBarItemStyle: styles.item,
          tabBarLabelStyle: styles.label,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color }) => <Icon name="wallet" color={color} size={22} />,
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: 'Insights',
            tabBarIcon: ({ color }) => <Icon name="chart-column" color={color} size={22} />,
          }}
        />
        <Tabs.Screen
          name="me"
          options={{
            title: 'Me',
            tabBarIcon: ({ color }) => <Icon name="user" color={color} size={22} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  scene: {
    backgroundColor: 'transparent',
  },
  bar: {
    paddingTop: 6,
    backgroundColor: palette.surface,
    borderTopWidth: 2,
    borderTopColor: palette.ink,
  },
  item: {
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    lineHeight: 14,
    marginTop: 2,
  },
});
