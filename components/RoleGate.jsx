// Guards a role's route group. Anyone not signed in with a finished profile goes
// back through the splash; anyone whose active role differs goes to their own home.
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth';
import { ROLE_HOME } from '../lib/firestore';

export default function RoleGate({ role, children }) {
  const { status, profile } = useAuth();
  if (status === 'loading') return null;
  if (status !== 'ready') return <Redirect href="/" />;
  if (profile.role !== role) return <Redirect href={ROLE_HOME[profile.role]} />;
  return children;
}
