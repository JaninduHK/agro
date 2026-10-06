import Tabs from 'expo-router/js-tabs';
import TabBar, { FloatingTabs } from '../../../components/TabBar';

// Route names must be unique across roles (groups are not part of the path), so
// the transporter's Home and Account carry a prefix: the farmer owns /home and
// the buyer owns /account.
export default function TransportTabs() {
  return (
    <FloatingTabs>
      <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }} backBehavior="history">
        <Tabs.Screen name="transport-home" options={{ tabBarLabel: 'nav.home', tabBarIconName: 'home' }} />
        <Tabs.Screen name="jobs" options={{ tabBarLabel: 'nav.jobs', tabBarIconName: 'truck' }} />
        <Tabs.Screen name="earnings" options={{ tabBarLabel: 'nav.earnings', tabBarIconName: 'credit-card' }} />
        <Tabs.Screen name="transport-account" options={{ tabBarLabel: 'nav.account', tabBarIconName: 'user' }} />
      </Tabs>
    </FloatingTabs>
  );
}
