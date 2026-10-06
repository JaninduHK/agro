// S12a Transporter home — Karanayaka
// What needs doing next, the week at a glance, the jobs in progress with their
// next step, and the best job waiting nearby.
// CRUD: read jobs, update job (collect, mark delivered).
import { Feather } from '@expo/vector-icons';
import { query, where } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AppBar, { Glow } from '../../../components/AppBar';
import Button from '../../../components/Button';
import Chip from '../../../components/Chip';
import EmptyState from '../../../components/EmptyState';
import JobCard from '../../../components/JobCard';
import Screen from '../../../components/Screen';
import StatTile from '../../../components/StatTile';
import { ErrorText, Loading, OfflineBanner } from '../../../components/StatusViews';
import Text from '../../../components/Text';
import { markDelivered, markOrderCollected } from '../../../lib/actions';
import { useAuth } from '../../../lib/auth';
import { formatShortDay, formatTime, greeting, timeLeft, toDate } from '../../../lib/dates';
import { COL, col } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel } from '../../../lib/market';
import { formatLKR } from '../../../lib/money';
import { useQuery } from '../../../lib/useFirestore';
import { color, font, radius, type } from '../../../theme';

// The one thing to do next, on the app bar's green so it reads first.
// No money here: figures are always ink, and ink does not show on forest.
function NextUp({ job }) {
  const { t } = useI18n();
  const collected = job.status === 'collected';
  const startsIn = timeLeft(job.windowStart);
  const overdue = !collected && !timeLeft(job.windowEnd);
  return (
    <View style={styles.hero}>
      <Glow opacity={0.28} />
      <View style={styles.heroTop}>
        <Text style={[type.label, styles.heroLabel]}>{collected ? 'Deliver next' : 'Next pickup'}</Text>
        <Feather name={collected ? 'navigation' : 'map-pin'} size={18} color={color.lime} />
      </View>
      <Text style={[type.hero, styles.heroTitle]}>{collected ? job.toLocation : job.fromLocation}</Text>
      <Text style={[type.body, styles.heroSub]}>
        {collected
          ? t('{crop} {kg} kg · from {place}', { crop: cropLabel(job.crop), kg: job.quantityKg, place: job.fromLocation })
          : t('{crop} {kg} kg · {day} {from}–{to}', {
              crop: cropLabel(job.crop),
              kg: job.quantityKg,
              day: formatShortDay(job.windowStart),
              from: formatTime(job.windowStart),
              to: formatTime(job.windowEnd),
            })}
      </Text>
      <Chip
        style={{ marginTop: 12 }}
        tone={collected ? 'done' : 'time'}
        label={collected ? 'On the way' : overdue ? 'Pickup time has passed' : startsIn ? t('Starts in {time}', { time: startsIn }) : 'Happening now'}
      />
    </View>
  );
}

// The route this transporter has driven most, once it has been driven twice.
function usualRoute(jobs) {
  const trips = {};
  for (const j of jobs) {
    const route = `${j.fromLocation} → ${j.toLocation}`;
    trips[route] = (trips[route] ?? 0) + 1;
  }
  const [route, n] = Object.entries(trips).sort((a, b) => b[1] - a[1])[0] ?? [];
  return n >= 2 ? { route, n } : null;
}

export default function TransportHome() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const uid = user?.uid;
  const open = useQuery(() => query(col(COL.jobs), where('status', '==', 'open')), []);
  const mine = useQuery(() => (uid ? query(col(COL.jobs), where('transporterId', '==', uid)) : null), [uid]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [weekAgo] = useState(() => Date.now() - 7 * 86400e3);

  const myJobs = mine.data ?? [];
  const active = myJobs
    .filter((j) => j.status === 'accepted' || j.status === 'collected')
    .sort((a, b) => toDate(a.windowStart) - toDate(b.windowStart));
  const carried = myJobs.filter((j) => ['collected', 'delivered'].includes(j.status));
  const delivered = carried.filter((j) => j.status === 'delivered');
  const earned = carried.filter((j) => toDate(j.windowStart) >= weekAgo).reduce((s, j) => s + j.feeToTransporter, 0);
  const kg = carried.reduce((s, j) => s + (j.quantityKg ?? 0), 0);
  const openJobs = open.data ?? [];
  const best = [...openJobs].sort((a, b) => b.feeToTransporter - a.feeToTransporter)[0];
  const usual = usualRoute(carried);

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

  function nextStep(j) {
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
    <Screen header={<AppBar eyebrow={greeting()} title={profile?.fullName ?? ''} />}>
      {mine.fromCache ? <OfflineBanner /> : null}
      {mine.loading ? <Loading /> : null}

      {active.length ? <NextUp job={active[0]} /> : null}

      <Text style={[type.label, styles.muted]}>At a glance</Text>
      <View style={styles.grid}>
        <StatTile icon="trending-up" tint="lime" value={formatLKR(earned)} label="Earned this week" onPress={() => router.navigate('/earnings')} />
        <StatTile icon="map-pin" tint="sky" value={String(openJobs.length)} label="Open jobs near you" onPress={() => router.navigate('/jobs')} />
        <StatTile icon="check-circle" tint="field" value={String(delivered.length)} label="Jobs delivered" />
        <StatTile icon="package" tint="neutral" value={t('{n} kg', { n: kg })} label="Produce carried" />
      </View>

      <ErrorText error={error} />

      {active.length ? <Text style={[type.label, styles.muted]}>Your current jobs</Text> : null}
      {active.map((j) => (
        <JobCard key={j.id} job={j} action={nextStep(j)} />
      ))}

      {best ? (
        <>
          <Text style={[type.label, styles.muted]}>Best paying job near you</Text>
          <JobCard
            job={best}
            featured={!active.length}
            action={<Button title="See open jobs" variant={active.length ? 'secondary' : 'primary'} onPress={() => router.navigate('/jobs')} />}
          />
        </>
      ) : null}

      {!mine.loading && !active.length && !best ? (
        <EmptyState icon="truck" title="No job in progress" body="New jobs appear here as soon as a farmer accepts an offer or an order." />
      ) : null}

      {usual ? (
        <View style={styles.insight}>
          <View style={styles.insightIcon}>
            <Feather name="repeat" size={18} color={color.field} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.caption, styles.muted]}>Your usual route</Text>
            <Text style={styles.insightText}>{t('{route} · {n} trips', usual)}</Text>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: color.muted },
  hero: { backgroundColor: color.forest, borderRadius: radius.card, padding: 18, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: color.lime },
  heroTitle: { color: color.paper, marginTop: 6 },
  heroSub: { color: color.onField, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: color.fieldLight,
    borderWidth: 1,
    borderColor: color.fieldBorder,
    borderRadius: radius.row,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  insightIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: color.paper, alignItems: 'center', justifyContent: 'center' },
  insightText: { fontFamily: font.semibold, fontSize: 15, lineHeight: 21, color: color.ink },
});
