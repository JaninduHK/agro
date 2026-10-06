// S11 Report a problem — Ranaweera
// /problem/<orderId>. CRUD: create problem report (with photo evidence, FR-11).
// Once sent, the same route shows the case and what happens next.
import { Feather } from '@expo/vector-icons';
import { query, where } from '@react-native-firebase/firestore';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import AppBar from '../../../components/AppBar';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import ChoiceGrid from '../../../components/ChoiceGrid';
import Chip from '../../../components/Chip';
import { FieldLabel } from '../../../components/Field';
import { MoneyFigure } from '../../../components/LineItem';
import Notice from '../../../components/Notice';
import OptionCard from '../../../components/OptionCard';
import Row from '../../../components/Row';
import Screen from '../../../components/Screen';
import { ErrorText, Loading } from '../../../components/StatusViews';
import Timeline from '../../../components/Timeline';
import { newProblemId, refundFor, reportProblem } from '../../../lib/actions';
import { useAuth } from '../../../lib/auth';
import { formatDay, formatDayTime, formatTime } from '../../../lib/dates';
import { COL, col, ref } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel } from '../../../lib/market';
import { formatLKR } from '../../../lib/money';
import { takePhoto, uploadPhoto } from '../../../lib/photos';
import { useDocument, useQuery } from '../../../lib/useFirestore';
import { color, radius, type } from '../../../theme';

const ISSUES = [
  { id: 'spoiled', title: 'Part of the order was spoiled' },
  { id: 'short-weight', title: 'The order was short in weight' },
  { id: 'late', title: 'It arrived late' },
  { id: 'other', title: 'Something else' },
];

const firstName = (n = '') => n.split(' ')[0];

function Sent({ problem, order }) {
  const { t } = useI18n();
  const goodKg = order.quantityKg - problem.affectedQtyKg;
  return (
    <>
      <Card style={{ borderColor: color.field, borderWidth: 2 }}>
        <View style={styles.between}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Feather name="check" size={18} color={color.field} />
            <Text style={[type.heading, { color: color.field }]}>Report sent</Text>
          </View>
          <Chip label={problem.status === 'resolved' ? 'Resolved' : 'Open'} tone={problem.status === 'resolved' ? 'done' : 'time'} />
        </View>
        <Text style={[type.caption, styles.muted, { marginTop: 4 }]}>
          {t('Case {id} · {date}, {time}', { id: problem.id, date: formatDay(problem.createdAt), time: formatTime(problem.createdAt) })}
        </Text>
        <MoneyFigure
          label="Refund requested"
          amount={problem.refundRequested}
          style={{ marginTop: 12 }}
          detail={t('For {kg} kg of {total} kg · decided by {when}', { kg: problem.affectedQtyKg, total: order.quantityKg, when: formatDayTime(problem.decisionDueAt) })}
        />
      </Card>
      <Card padding={16} style={{ paddingBottom: 4 }}>
        <Timeline
          steps={[
            { title: 'You reported the problem', detail: t('{n} photos sent · {time}', { n: problem.photos?.length ?? 0, time: formatTime(problem.createdAt) }), state: 'done', chip: 'Done' },
            { title: 'Farmer and transporter notified', detail: 'They have 24 hours to respond', state: 'now', chip: 'Happening now' },
            { title: 'Refund decided', detail: 'Automatic if no one disputes', state: 'todo', chip: 'Not yet' },
          ]}
        />
      </Card>
      {goodKg > 0 ? (
        <Row
          title={t('{amount} released to {name}', { amount: formatLKR(order.total - problem.refundRequested), name: firstName(order.farmerName) })}
          subtitle={t('For the {kg} kg that arrived in good condition', { kg: goodKg })}
          right={<Chip label="Held" />}
        />
      ) : null}
    </>
  );
}

export default function ReportProblem() {
  const { id: orderId } = useLocalSearchParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const order = useDocument(() => ref(COL.orders, orderId), [orderId]);
  const existing = useQuery(
    () => (user ? query(col(COL.problems), where('orderId', '==', orderId), where('reportedBy', '==', user.uid)) : null),
    [orderId, user?.uid],
  );

  const [issue, setIssue] = useState('spoiled');
  const [kg, setKg] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const o = order.data;
  const report = existing.data?.[0];
  const header = (
    <AppBar
      title={report ? 'Problem reported' : 'Report a problem'}
      subtitle={o ? t('{crop} {kg} kg · {id}', { crop: cropLabel(o.crop), kg: o.quantityKg, id: o.id }) : undefined}
      onBack={router.back}
    />
  );

  if (order.loading || existing.loading) return <Screen header={header}><Loading /></Screen>;
  if (!o) return <Screen header={header}><Notice tone="alert" title="Order not found">{t('There is no order {id}.', { id: orderId })}</Notice></Screen>;
  if (report) return <Screen header={header} gap={12}><Sent problem={report} order={o} /></Screen>;

  const amounts = [...new Set([2, 5, o.quantityKg].filter((n) => n <= o.quantityKg))];
  const affected = kg ?? amounts[0];
  const refund = refundFor(o, affected);
  const noun = issue === 'spoiled' ? 'spoiled' : issue === 'short-weight' ? 'missing' : 'affected';

  async function addPhoto() {
    try {
      const uri = await takePhoto();
      if (uri) setPhotos((p) => [...p, uri]);
    } catch (e) {
      setError(e);
    }
  }

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const problemId = newProblemId();
      const photoPaths = [];
      for (const uri of photos) photoPaths.push(await uploadPhoto(`problems/${problemId}`, uri));
      await reportProblem({ user, order: o, problemId, issueType: issue, affectedQtyKg: affected, photoPaths });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      header={header}
      gap={12}
      footer={
        <>
          <ErrorText error={error} />
          <Button title="Send report" variant="alert" onPress={send} disabled={!photos.length} loading={busy} />
          <Button title="Cancel" variant="secondary" onPress={router.back} />
        </>
      }
    >
      <Text style={[type.label, styles.ink]}>What went wrong?</Text>
      {ISSUES.map((i) => (
        <OptionCard key={i.id} tone="alert" title={i.title} selected={issue === i.id} onPress={() => setIssue(i.id)} />
      ))}

      {issue !== 'late' ? (
        <>
          <FieldLabel style={{ marginTop: 4 }}>{t(`How much was ${noun}?`)}</FieldLabel>
          <ChoiceGrid
            columns={0}
            tone="ink"
            value={String(affected)}
            onChange={(v) => setKg(Number(v))}
            options={amounts.map((n) => ({ id: String(n), label: n === o.quantityKg ? t('All {kg} kg', { kg: n }) : t('About {kg} kg', { kg: n }) }))}
          />
        </>
      ) : null}

      <FieldLabel style={{ marginTop: 4 }}>Add photos — at least one</FieldLabel>
      <View style={styles.photos}>
        {photos.map((uri) => (
          <Image key={uri} source={{ uri }} style={styles.photo} />
        ))}
      </View>
      <Button title={photos.length ? 'Take another photo' : 'Take photo'} variant="secondary" onPress={addPhoto} />

      <Notice title="What happens next">
        <View style={{ gap: 4, marginTop: 4 }}>
          <Text style={[type.caption, styles.ink]}>{`1. ${t('Your {amount} stays held — nothing is paid out.', { amount: formatLKR(o.total) })}`}</Text>
          <Text style={[type.caption, styles.ink]}>{`2. ${t('{name} and the transporter see your photos today.', { name: firstName(o.farmerName) })}`}</Text>
          {issue !== 'late' ? (
            <Text style={[type.caption, styles.ink]}>
              {`3. ${t('If no one disputes within 24 hours, {amount} for {kg} kg is refunded automatically.', { amount: formatLKR(refund), kg: affected })}`}
            </Text>
          ) : (
            <Text style={[type.caption, styles.ink]}>3. The delivery time is checked against the transporter’s record.</Text>
          )}
          <Text style={[type.caption, styles.ink]}>4. You do not need to telephone anyone.</Text>
        </View>
      </Notice>

    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: 72, height: 72, borderRadius: radius.input - 4, backgroundColor: color.line },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
