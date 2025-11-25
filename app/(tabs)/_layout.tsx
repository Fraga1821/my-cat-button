import { MaterialCommunityIcons } from '@expo/vector-icons/';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pets',
          tabBarIcon: () => <MaterialCommunityIcons size={24} name="home" />,
        }}
      />
      <Tabs.Screen
        name="tratamentos"
        options={{
          title: 'Tratamentos',
          tabBarIcon: () => <MaterialCommunityIcons size={24} name="medication" />,
        }}
      />
    </Tabs>
  );
}
