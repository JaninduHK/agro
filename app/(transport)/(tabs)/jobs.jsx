// S12 Jobs near you — Karanayaka
// CRUD: read jobs, update job (accept it, collect, mark delivered).
// Two kinds of job: a bulk agreement (weight and photos recorded at the gate,
// on Confirm collection) and a retail order delivery (collected, then delivered).
import { query, where } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AppBar from '../../../components/AppBar';
import Button from '../../../components/Button';
import Card, { Divider } from '../../../components/Card';
import Chip from '../../../components/Chip';
import EmptyState from '../../../components/EmptyState';
import Screen from '../../../components/Screen';
import { ErrorText, Loading, OfflineBanner } from '../../../components/StatusViews';
import Text from '../../../components/Text';
import { claimJob, markDelivered, markOrderCollected } from '../../../lib/actions';
import { useAuth } from '../../../lib/auth';
import { formatShortDay, formatTime, toDate } from '../../../lib/dates';
import { COL, col } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel } from '../../../lib/market';
import { formatLKR } from '../../../lib/money';
import { useQuery } from '../../../lib/useFirestore';
import { color, font, type } from '../../../theme';

function JobCard({ job, action, featured = false }) {
  const { t } = useI18n();
  return (
    <Card padding={14} style={featured && styles.featured}>
      <View style={styles.between}>
        <View style={{ flex: 1 }}>
          <Text style={[type.heading, styles.ink]}>{job.fromLocation} → {job.toLocation}</Text>
          <Text style={[type.caption, styles.muted, { marginTop: 3 }]}>
            {t('{crop} {kg} kg · {day} {from}–{to}', {
              crop: cropLabel(job.crop),
              kg: job.quantityKg,
              day: formatShortDay(job.windowStart),
              from: formatTime(job.windowStart),
              to: formatTime(job.windowEnd),
            })}
          </Text>
          <Text style={[type.caption, styles.muted, { marginTop: 2 }]}>
            {job.orderId
              ? t('Delivery · {id}', { id: job.orderId })
              : job.farmerName
                ? t('Bulk collection from {name}', { name: job.farmerName })
                : t('Bulk collection')}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[type.title, styles.ink]}>{formatLKR(job.feeToTransporter)}</Text>
          <Text style={[type.caption, styles.muted]}>you earn</Text>
        </View>
      </View>
      {action ? <View style={{ marginTop: 12, gap: 8 }}>{action}</View> : null}
    </Card>
  );
}

export default function Jobs() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const uid = user?.uid;
  const open = useQuery(() => query(col(COL.jobs), where('status', '==', 'open')), []);
  const mine = useQuery(() => (uid ? query(col(COL.jobs), where('transporterId', '==', uid)) : null), [uid]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [weekAgo] = useState(() => Date.now() - 7 * 86400e3);

  const openJobs = (open.data ?? []).sort((a, b) => toDate(a.windowStart) - toDate(b.windowStart));
  const myJobs = mine.data ?? [];
  const active = myJobs.filter((j) => j.status === 'accepted' || j.status === 'collected');
  const delivered = myJobs.filter((j) => j.status === 'delivered');
  const thisWeek = myJobs.filter((j) => ['collected', 'delivered'].includes(j.status) && toDate(j.windowStart) >= weekAgo);
  const earned = thisWeek.reduce((s, j) => s + j.feeToTransporter, 0);

  async function run(id, fn) {
    setBusyId(id);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e);
    } finally {
      setBusyId(null);
    }
  }

  function activeAction(j) {
    if (j.status === 'accepted') {
      return (
        <>
          <Chip label="Accepted" tone="done" />
          {j.orderId ? (
            <Button title="Collected from the farm" loading={busyId === j.id} onPress={() => run(j.id, () => markOrderCollected(j))} />
          ) : (
            <Button title="Confirm collection" onPress={() => router.push(`/collect/${j.id}`)} />
          )}
        </>
      );
    }
    return (
      <>
        <Chip label="Collected · on the way" tone="done" />
        <Button title="Mark delivered" loading={busyId === j.id} onPress={() => run(j.id, () => markDelivered(j))} />
      </>
    );
  }

  return (
    <Screen header={<AppBar title="Jobs near you" subtitle={t('{place} · {n} open', { place: profile?.village ?? '', n: openJobs.length })} />}>
      {open.fromCache ? <OfflineBanner detail="Saved jobs — accepting one needs internet." /> : null}

      <Card>
        <View style={styles.between}>
          <View>
            <Text style={[type.label, styles.muted]}>Earned this week</Text>
            <Text style={[type.title, styles.ink, { marginTop: 4 }]}>{formatLKR(earned)}</Text>
          </View>
          <Text style={[type.caption, styles.muted]}>{t('{n} jobs', { n: thisWeek.length })}</Text>
        </View>
      </Card>

      <ErrorText error={error} />

      {active.length ? <Text style={[type.label, styles.muted]}>My jobs</Text> : null}
      {active.map((j) => (
        <JobCard key={j.id} job={j} action={activeAction(j)} />
      ))}

      <Text style={[type.label, styles.muted, { marginTop: 4 }]}>Open jobs</Text>
      {open.loading ? <Loading /> : null}
      {!open.loading && !openJobs.length ? (
        <EmptyState icon="truck" title="No open jobs right now" body="New jobs appear here as soon as a farmer accepts an offer or an order." />
      ) : null}
      {openJobs.map((j, i) => (
        <JobCard
          key={j.id}
          job={j}
          featured={i === 0}
          action={
            <Button
              title="Accept this job"
              variant={i === 0 ? 'primary' : 'secondary'}
              loading={busyId === j.id}
              disabled={open.fromCache}
              onPress={() => run(j.id, () => claimJob({ user, profile, job: j }))}
            />
          }
        />
      ))}

      {delivered.length ? (
        <>
          <Divider />
          <Text style={[type.label, styles.muted]}>Delivered</Text>
          {delivered.map((j) => (
            <Text key={j.id} style={[type.caption, styles.ink]}>
              {j.fromLocation} → {j.toLocation} · {formatShortDay(j.windowStart)} ·{' '}
              <Text style={{ fontFamily: font.semibold }}>{formatLKR(j.feeToTransporter)}</Text>
            </Text>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  featured: { borderColor: color.field, borderWidth: 2 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
