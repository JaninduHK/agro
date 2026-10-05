// Stack over the tabs, so detail screens push on top and hide the nav bar.
import { Stack } from 'expo-router';
import RoleGate from '../../components/RoleGate';

export default function TransportLayout() {
  return (
    <RoleGate role="transporter">
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
