import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { ROLE_HOME } from '../../lib/firestore';

export default function AuthLayout() {
  const { status, profile } = useAuth();
  // A finished account has no business on the entry screens.
  if (status === 'ready') return <Redirect href={ROLE_HOME[profile.role]} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
