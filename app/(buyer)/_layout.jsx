// Stack over the tabs, so detail screens push on top and hide the nav bar.
import { Stack } from 'expo-router';
import RoleGate from '../../components/RoleGate';

export default function BuyerLayout() {
  return (
    <RoleGate role="buyer">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
