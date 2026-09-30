// Account tab shared by buyer and transporter. Minimal on purpose: role switching
// (which the role-selection copy promises) and sign-out. Extend as needed.
import { router } from 'expo-router';
import Text from './Text';
import { useAuth } from '../lib/auth';
import { ROLE_HOME, setActiveRole } from '../lib/firestore';
import { color, type } from '../theme';
import AppBar from './AppBar';
import Button from './Button';
import Card from './Card';
import Row from './Row';
import Screen from './Screen';

const roleLabel = { farmer: 'Farmer', buyer: 'Buyer', transporter: 'Transporter' };

export default function AccountScreen() {
  const { user, profile, signOut } = useAuth();

  async function switchTo(role) {
    await setActiveRole(user.uid, role);
    router.replace(ROLE_HOME[role]);
  }

  return (
    <Screen header={<AppBar title="Account" />}>
      <Card>
        <Text style={[type.heading, { color: color.ink }]}>{profile?.fullName}</Text>
        <Text style={[type.caption, { color: color.muted, marginTop: 2 }]}>
          {profile?.phone} · {profile?.village}
        </Text>
      </Card>

      <Text style={[type.label, { color: color.muted }]}>Your roles</Text>
      {(profile?.roles ?? []).map((role) => (
        <Row
          key={role}
          title={roleLabel[role]}
          subtitle={role === profile.role ? 'Using now' : 'Tap to switch'}
          onPress={role === profile.role ? undefined : () => switchTo(role)}
        />
      ))}

      <Button title="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}
