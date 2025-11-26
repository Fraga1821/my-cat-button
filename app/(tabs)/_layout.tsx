import TabBar from '@/components/TabBar';
import { MaterialCommunityIcons } from '@expo/vector-icons/';
import { getHeaderTitle } from '@react-navigation/elements';
import { Tabs } from 'expo-router';
import { Appbar, PaperProvider } from 'react-native-paper';

export default function TabLayout() {
  return (
    <PaperProvider>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={
          {
            tabBarHideOnKeyboard: true,

            header: (props) =>
              <Appbar.Header>
                <Appbar.Content title={getHeaderTitle(
                  props.options,
                  props.route.name,
                )} />
              </Appbar.Header>

          }
        }
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Gatinhos',
            tabBarIcon: (props) => <MaterialCommunityIcons size={24} name={props.focused ? "home" : "home-outline"} />,
          }}
        />
        <Tabs.Screen
          name="tratamentos"
          options={{
            title: 'Tratamentos',
            tabBarIcon: (props) => <MaterialCommunityIcons size={24} name={props.focused ? "medication" : "medication-outline"} />,
          }}
        />
      </Tabs>
    </PaperProvider>
  );
}
