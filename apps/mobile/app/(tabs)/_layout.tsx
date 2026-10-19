import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { fonts, fontSize, Icon, palette } from '@ledgerflow/ui';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.ink,
        tabBarInactiveTintColor: palette.inkSoft,
        tabBarStyle: styles.bar,
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
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 68,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: palette.surface,
    borderTopWidth: 2,
    borderTopColor: palette.ink,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.caption,
    letterSpacing: 0.4,
  },
});
