// S14 Earnings — Karanayaka
// What the transporter has earned, what is still to come from accepted jobs,
// and the history of finished jobs. A fee counts as earned once the load is collected.
// CRUD: read jobs.
import { query, where } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import AppBar from '../../../components/AppBar';
import Card, { Divider } from '../../../components/Card';
import { payoutLabel } from '../../../components/ChangePayout';
import Chip from '../../../components/Chip';
import { LineItem, MoneyFigure } from '../../../components/LineItem';
import Row from '../../../components/Row';
import Screen from '../../../components/Screen';
import { Loading, OfflineBanner } from '../../../components/StatusViews';
import Text from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { formatShortDay, toDate } from '../../../lib/dates';
import { COL, col } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel } from '../../../lib/market';
import { formatLKR } from '../../../lib/money';
import { useQuery } from '../../../lib/useFirestore';
import { color, type } from '../../../theme';

const sum = (jobs) => jobs.reduce((s, j) => s + j.feeToTransporter, 0);

export default function Earnings() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const uid = user?.uid;
  const jobs = useQuery(() => (uid ? query(col(COL.jobs), where('transporterId', '==', uid)) : null), [uid]);
  const [weekAgo] = useState(() => Date.now() - 7 * 86400e3);

  const all = jobs.data ?? [];
  const earnedJobs = all
    .filter((j) => ['collected', 'delivered'].includes(j.status))
    .sort((a, b) => toDate(b.windowStart) - toDate(a.windowStart));
  const thisWeek = earnedJobs.filter((j) => toDate(j.windowStart) >= weekAgo);
  const delivered = earnedJobs.filter((j) => j.status === 'delivered');
  const accepted = all.filter((j) => j.status === 'accepted');

  return (
    <Screen header={<AppBar title="Earnings" subtitle={profile?.fullName} />}>
      {jobs.fromCache ? <OfflineBanner /> : null}
      {jobs.loading ? <Loading /> : null}

      <Card>
        <MoneyFigure
          label="Earned this week"
          amount={sum(thisWeek)}
          detail={thisWeek.length === 1 ? t('1 job') : t('{n} jobs', { n: thisWeek.length })}
        />
        <Divider />
        <LineItem label="All time" amount={sum(earnedJobs)} />
        <LineItem label="Jobs delivered" value={String(delivered.length)} />
        {accepted.length ? <LineItem label="Still to earn" amount={sum(accepted)} /> : null}
      </Card>

      <Row
        title="Where money goes"
        subtitle={payoutLabel(profile?.payout, t)}
        onPress={() => router.navigate('/transport-account')}
      />

      <Text style={[type.label, styles.muted]}>Job history</Text>
      {earnedJobs.map((j) => (
        <Row
          key={j.id}
          title={`${formatLKR(j.feeToTransporter)} · ${j.fromLocation} → ${j.toLocation}`}
          subtitle={t('{crop} {kg} kg · {day}', { crop: cropLabel(j.crop), kg: j.quantityKg, day: formatShortDay(j.windowStart) })}
          right={j.status === 'delivered' ? <Chip label="Delivered" tone="done" /> : <Chip label="On the way" tone="time" />}
        />
      ))}
      {!jobs.loading && !earnedJobs.length ? (
        <Text style={[type.caption, styles.muted]}>No jobs finished yet.</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: color.muted },
});
