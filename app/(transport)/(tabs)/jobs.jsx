// S12 Jobs near you — Karanayaka
// Every open job a transporter can accept. An accepted job moves to Home.
// CRUD: read jobs, update job (accept it).
// Two kinds of job: a bulk agreement (weight and photos recorded at the gate,
// on Confirm collection) and a retail order delivery (collected, then delivered).
import { query, where } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { useState } from 'react';
import AppBar from '../../../components/AppBar';
import Button from '../../../components/Button';
import EmptyState from '../../../components/EmptyState';
import JobCard from '../../../components/JobCard';
import Screen from '../../../components/Screen';
import { ErrorText, Loading, OfflineBanner } from '../../../components/StatusViews';
import { claimJob } from '../../../lib/actions';
import { useAuth } from '../../../lib/auth';
import { toDate } from '../../../lib/dates';
import { COL, col } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { useQuery } from '../../../lib/useFirestore';

export default function Jobs() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const open = useQuery(() => query(col(COL.jobs), where('status', '==', 'open')), []);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const openJobs = (open.data ?? []).sort((a, b) => toDate(a.windowStart) - toDate(b.windowStart));

  async function accept(job) {
    setBusyId(job.id);
    setError(null);
    try {
      await claimJob({ user, profile, job });
      router.navigate('/transport-home'); // the job and its next step are there
    } catch (e) {
      setError(e);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Screen header={<AppBar title="Jobs near you" subtitle={t('{place} · {n} open', { place: profile?.village ?? '', n: openJobs.length })} />}>
      {open.fromCache ? <OfflineBanner detail="Saved jobs — accepting one needs internet." /> : null}
      <ErrorText error={error} />
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
              onPress={() => accept(j)}
            />
          }
        />
      ))}
    </Screen>
  );
}
