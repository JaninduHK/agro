import Tabs from 'expo-router/js-tabs';
import TabBar from '../../../components/TabBar';

export default function BuyerTabs() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }} backBehavior="history">
      <Tabs.Screen name="search" options={{ tabBarLabel: 'nav.search', tabBarIconName: 'search' }} />
      <Tabs.Screen name="orders" options={{ tabBarLabel: 'nav.orders', tabBarIconName: 'package' }} />
      <Tabs.Screen name="account" options={{ tabBarLabel: 'nav.account', tabBarIconName: 'user' }} />
    </Tabs>
  );
}
