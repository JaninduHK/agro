import Tabs from 'expo-router/js-tabs';
import TabBar from '../../../components/TabBar';

export default function TransportTabs() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }} backBehavior="history">
      <Tabs.Screen name="jobs" options={{ tabBarLabel: 'nav.jobs', tabBarIconName: 'truck' }} />
      <Tabs.Screen name="transport-account" options={{ tabBarLabel: 'nav.account', tabBarIconName: 'user' }} />
    </Tabs>
  );
}
