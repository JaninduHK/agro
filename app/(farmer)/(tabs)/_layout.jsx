import Tabs from 'expo-router/js-tabs';
import TabBar, { FloatingTabs } from '../../../components/TabBar';

export default function FarmerTabs() {
  return (
    <FloatingTabs>
      <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }} backBehavior="history">
        <Tabs.Screen name="home" options={{ tabBarLabel: 'nav.home', tabBarIconName: 'home' }} />
        <Tabs.Screen name="listings" options={{ tabBarLabel: 'nav.listings', tabBarIconName: 'list' }} />
        <Tabs.Screen name="offers" options={{ tabBarLabel: 'nav.offers', tabBarIconName: 'inbox' }} />
        <Tabs.Screen name="money" options={{ tabBarLabel: 'nav.money', tabBarIconName: 'credit-card' }} />
      </Tabs>
    </FloatingTabs>
  );
}
