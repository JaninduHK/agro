// The Account screen every role shares: who you are and how you were verified,
// your details, language, help, and sign out. An account has exactly one role,
// chosen at registration. Each role's route passes its own sections as children;
// they render between Language and Help.
//
//   <ProfileScreen onBack={router.back}> <FarmerSections /> </ProfileScreen>
import { useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { formatPhone, useAuth } from '../lib/auth';
import { formatFullDate } from '../lib/dates';
import { updateProfile } from '../lib/firestore';
import { useI18n } from '../lib/i18n';
import { color, font, type } from '../theme';
import AppBar from './AppBar';
import Button from './Button';
import Card, { Divider } from './Card';
import Chip from './Chip';
import ChoiceGrid from './ChoiceGrid';
import Field from './Field';
import OwnerStrip, { useOwnerStripVisible } from './OwnerStrip';
import Screen from './Screen';
import { ErrorText } from './StatusViews';
import Text from './Text';

const ROLES = [
  { id: 'farmer', label: 'Farmer', detail: 'I grow produce and want to sell it' },
  { id: 'buyer', label: 'Buyer', detail: 'I want to buy produce' },
  { id: 'transporter', label: 'Transporter', detail: 'I collect and deliver for a fee' },
];
const LANGUAGES = [
  { id: 'si', label: 'සිංහල' },
  { id: 'en', label: 'English' },
];
const HELPLINE = '0112000000';

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

// Heading above a group of cards.
export function SectionLabel({ children }) {
  return <Text style={[type.label, styles.section]}>{children}</Text>;
}

function VillageEditor({ uid, profile, label }) {
  const [editing, setEditing] = useState(false);
  const [village, setVillage] = useState(profile.village ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await updateProfile(uid, { village: village.trim() });
      setEditing(false);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <View style={styles.between}>
        <View style={{ flex: 1 }}>
          <Text style={[type.caption, styles.muted]}>{label}</Text>
          <Text style={[type.body, styles.ink]}>{profile.village || '—'}</Text>
        </View>
        <Text style={styles.link} onPress={() => setEditing(true)} accessibilityRole="button">Change</Text>
      </View>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      <Field label={label} value={village} onChangeText={setVillage} autoCapitalize="words" autoFocus />
      <ErrorText error={error} />
      <View style={styles.pair}>
        <Button title="Cancel" variant="secondary" compact onPress={() => setEditing(false)} style={{ flex: 1 }} />
        <Button title="Save" compact onPress={save} loading={busy} disabled={!village.trim()} style={{ flex: 1.4 }} />
      </View>
    </View>
  );
}

export default function ProfileScreen({ onBack, children }) {
  const { user, profile, signOut } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const stripVisible = useOwnerStripVisible();

  if (!profile || !user) return null;
  const uid = user.uid;
  const role = ROLES.find((r) => r.id === profile.role);

  function chooseLanguage(code) {
    setLanguage(code);
    updateProfile(uid, { language: code }).catch(() => {});
  }

  function confirmSignOut() {
    Alert.alert(t('Sign out?'), t('Your listings, orders and payments stay on your account. Sign in again with the same number.'), [
      { text: t('Stay signed in'), style: 'cancel' },
      { text: t('Sign out'), style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <Screen
      gap={12}
      header={
        <>
          <AppBar title="Account" onBack={onBack} attached={profile.role === 'farmer' && stripVisible} />
          {profile.role === 'farmer' ? <OwnerStrip /> : null}
        </>
      }
    >
      <Card>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials(profile.fullName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.title, styles.ink]}>{profile.fullName}</Text>
            <Text style={[type.body, styles.muted]}>{formatPhone(profile.phone)}</Text>
          </View>
        </View>
        <View style={styles.chips}>
          <Chip label={role?.label ?? profile.role} tone="done" />
          <Chip label={profile.verified ? 'Verified' : 'Not verified'} tone={profile.verified ? 'done' : 'alert'} />
        </View>
        <Text style={[type.caption, styles.muted, { marginTop: 10 }]}>
          {profile.verified
            ? t('Identity checked in person — {who}, {date}.', { who: t(profile.verifiedBy ?? 'Field officer'), date: formatFullDate(profile.verifiedAt) })
            : t('Not verified yet. A field officer checks your identity in person — buyers trust verified accounts more.')}
        </Text>
        {profile.ratingCount ? (
          <Text style={[type.body, styles.ink, { marginTop: 6 }]}>
            {t('{rating} from {n} ratings', { rating: Number(profile.rating ?? 0).toFixed(1), n: profile.ratingCount })}
          </Text>
        ) : null}
      </Card>

      <SectionLabel>Your details</SectionLabel>
      <Card style={{ gap: 12 }}>
        <View>
          <Text style={[type.caption, styles.muted]}>{profile.role === 'buyer' ? 'Business or buyer name' : 'Full name'}</Text>
          <Text style={[type.body, styles.ink]}>{profile.fullName}</Text>
          <Text style={[type.caption, styles.muted, { marginTop: 2 }]}>
            The name was checked with your identity. A field officer can change it.
          </Text>
        </View>
        <Divider style={{ marginVertical: 0 }} />
        <VillageEditor
          uid={uid}
          profile={profile}
          label={profile.role === 'buyer' ? 'Deliver to (town or area)' : 'Village / collection area'}
        />
      </Card>

      <SectionLabel>Language</SectionLabel>
      <ChoiceGrid columns={0} options={LANGUAGES} value={language} onChange={chooseLanguage} />

      {children}

      <SectionLabel>Help</SectionLabel>
      <Card>
        <Text style={[type.body, styles.ink]}>Call us, or ask any registered field officer at the collection centre.</Text>
        <Button title="Call 0112 000 000" variant="secondary" onPress={() => Linking.openURL(`tel:${HELPLINE}`)} style={{ marginTop: 12 }} />
      </Card>

      <Button title="Sign out" variant="danger" onPress={confirmSignOut} style={{ marginTop: 8 }} />
      <Text style={[type.caption, styles.muted, { textAlign: 'center' }]}>
        Your listings, orders and payments stay on your account.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { color: color.muted, marginTop: 6 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: color.fieldLight,
    borderWidth: 1,
    borderColor: color.fieldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: font.bold, fontSize: 22, color: color.field },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  pair: { flexDirection: 'row', gap: 10 },
  link: { fontFamily: font.semibold, fontSize: 15, color: color.field, paddingVertical: 8, paddingLeft: 12 },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
