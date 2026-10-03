// Transporter account — the Account tab.
// Adds what only a transporter has: jobs done and earnings, and where they are
// paid (changed the same way as a farmer's payout: with a fresh code).
import { query, where } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Card from '../../../components/Card';
import ChangePayout, { payoutLabel } from '../../../components/ChangePayout';
import ProfileScreen, { SectionLabel } from '../../../components/ProfileScreen';
import Row from '../../../components/Row';
import Text from '../../../components/Text';
import { maskPhone, useAuth } from '../../../lib/auth';
import { COL, col } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { formatLKR } from '../../../lib/money';
import { useQuery } from '../../../lib/useFirestore';
import { color, font, type } from '../../../theme';

export default function TransporterAccount() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const uid = user?.uid;
  const [changing, setChanging] = useState(false);
  const jobs = useQuery(() => (uid ? query(col(COL.jobs), where('transporterId', '==', uid)) : null), [uid]);

  const all = jobs.data ?? [];
  const done = all.filter((j) => j.status === 'delivered');
  const active = all.filter((j) => j.status === 'accepted' || j.status === 'collected');
  const earned = all.filter((j) => ['collected', 'delivered'].includes(j.status)).reduce((s, j) => s + j.feeToTransporter, 0);

  if (!profile) return null;

  return (
    <ProfileScreen>
      <SectionLabel>Your work</SectionLabel>
      <Row
        title={t('Jobs delivered: {n} · {amount} earned', { n: done.length, amount: formatLKR(earned) })}
        subtitle={active.length === 1 ? t('1 job in progress') : t('{n} jobs in progress', { n: active.length })}
        onPress={() => router.navigate('/jobs')}
      />

      <SectionLabel>Where money goes</SectionLabel>
      <Card>
        <View style={styles.between}>
          <Text style={[type.heading, styles.ink, { flex: 1 }]}>{payoutLabel(profile.payout, t)}</Text>
          {!changing ? (
            <Text style={styles.link} onPress={() => setChanging(true)} accessibilityRole="button">Change</Text>
          ) : null}
        </View>
        {changing ? (
          <ChangePayout profile={profile} uid={uid} onDone={() => setChanging(false)} />
        ) : (
          <Text style={[type.caption, styles.muted, { marginTop: 4 }]}>
            {t('Changing this needs a code sent to {phone}.', { phone: maskPhone(profile.phone) })}
          </Text>
        )}
      </Card>
    </ProfileScreen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  link: { fontFamily: font.semibold, fontSize: 15, color: color.field, paddingVertical: 8, paddingLeft: 12 },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
