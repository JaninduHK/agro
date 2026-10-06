// Farmer account — opened from the profile button on Home.
// Adds what only a farmer has: who holds the phone (the helper, FR-15), where
// money goes, and a summary of sales.
import { query, where } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { payoutLabel } from '../../components/ChangePayout';
import ChoiceGrid from '../../components/ChoiceGrid';
import Field, { FieldLabel } from '../../components/Field';
import Notice from '../../components/Notice';
import ProfileScreen, { SectionLabel } from '../../components/ProfileScreen';
import Row from '../../components/Row';
import { ErrorText } from '../../components/StatusViews';
import Text from '../../components/Text';
import { formatPhone, toE164, useAuth } from '../../lib/auth';
import { COL, col, updateProfile } from '../../lib/firestore';
import { useI18n } from '../../lib/i18n';
import { formatLKR } from '../../lib/money';
import { useQuery } from '../../lib/useFirestore';
import { color, type } from '../../theme';

const RELATIONS = [
  { id: 'son', label: 'Son' },
  { id: 'daughter', label: 'Daughter' },
  { id: 'family', label: 'Other family' },
  { id: 'shop', label: 'Shop' },
  { id: 'field officer', label: 'Field officer' },
];
const firstName = (n = '') => n.split(' ')[0];

function Helper({ uid, profile }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.operatorName ?? '');
  const [phone, setPhone] = useState(profile.operatorPhone ? formatPhone(profile.operatorPhone) : '');
  const [relation, setRelation] = useState(profile.operatorRelation ?? 'son');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  const phoneOk = !!toE164(phone);
  const valid = name.trim() && phoneOk;

  async function write(fields) {
    setBusy(true);
    setError(null);
    try {
      await updateProfile(uid, fields);
      setEditing(false);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!valid) return setShowErrors(true);
    return write({ operatorName: name.trim(), operatorPhone: toE164(phone), operatorRelation: relation });
  }
  const remove = () => write({ operatorName: null, operatorPhone: null, operatorRelation: null });

  if (editing) {
    return (
      <Card style={{ gap: 10 }}>
        <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" error={showErrors && !name.trim() ? 'Enter the helper’s name.' : null} />
        <Field
          label="Mobile number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="07_ ___ ____"
          error={showErrors && !phoneOk ? 'A Sri Lankan mobile number has 10 digits, starting 07.' : null}
        />
        <FieldLabel>They are the farmer’s</FieldLabel>
        <ChoiceGrid columns={3} options={RELATIONS} value={relation} onChange={setRelation} />
        <ErrorText error={error} />
        <View style={styles.pair}>
          <Button title="Cancel" variant="secondary" compact onPress={() => setEditing(false)} style={{ flex: 1 }} />
          <Button title="Save helper" compact onPress={save} loading={busy} style={{ flex: 1.4 }} />
        </View>
      </Card>
    );
  }

  if (!profile.operatorName) {
    return (
      <Card>
        <Text style={[type.body, styles.ink]}>Only you use this account.</Text>
        <Text style={[type.caption, styles.muted, { marginTop: 4 }]}>
          If a family member, a shop or a field officer enters details for you, add them here. They can never receive your money.
        </Text>
        <Button title="Add a helper" variant="secondary" onPress={() => setEditing(true)} style={{ marginTop: 12 }} />
      </Card>
    );
  }

  return (
    <Card>
      <Text style={[type.heading, styles.ink]}>
        {profile.operatorRelation ? `${profile.operatorName} (${t(profile.operatorRelation)})` : profile.operatorName}
      </Text>
      <Text style={[type.body, styles.muted]}>{formatPhone(profile.operatorPhone)}</Text>
      <Notice tone="field" style={{ marginTop: 12 }}>
        {t('{name} can enter details and read the account, but cannot receive payment or change where money is sent.', { name: firstName(profile.operatorName) })}
      </Notice>
      <ErrorText error={error} />
      <View style={[styles.pair, { marginTop: 12 }]}>
        <Button title="Change" variant="secondary" compact onPress={() => setEditing(true)} style={{ flex: 1 }} />
        <Button title="Remove helper" variant="danger" compact onPress={remove} loading={busy} style={{ flex: 1.2 }} />
      </View>
    </Card>
  );
}

export default function FarmerProfile() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const uid = user?.uid;
  const agreements = useQuery(() => (uid ? query(col(COL.agreements), where('farmerId', '==', uid)) : null), [uid]);
  const listings = useQuery(() => (uid ? query(col(COL.listings), where('farmerId', '==', uid)) : null), [uid]);

  const paid = (agreements.data ?? []).filter((a) => a.status === 'paid');
  const received = paid.reduce((s, a) => s + (a.finalNet ?? a.netToFarmer ?? 0), 0);
  const live = (listings.data ?? []).filter((l) => l.status === 'live').length;

  if (!profile) return null;

  return (
    <ProfileScreen onBack={router.back}>
      <SectionLabel>Who holds the phone</SectionLabel>
      <Helper uid={uid} profile={profile} />

      <SectionLabel>Where money goes</SectionLabel>
      <Row
        title={payoutLabel(profile.payout, t)}
        subtitle={t('Only {name} can change this — it needs a code sent to this number', { name: firstName(profile.fullName) })}
        onPress={() => router.push('/money')}
      />

      <SectionLabel>Your selling</SectionLabel>
      <Row
        title={t('Sales paid: {n} · {amount} received', { n: paid.length, amount: formatLKR(received) })}
        subtitle={live === 1 ? t('1 listing live now') : t('{n} listings live now', { n: live })}
        onPress={() => router.push('/listings')}
      />
    </ProfileScreen>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: 10 },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
