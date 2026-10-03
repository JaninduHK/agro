// S05 Collection & payout — Sahanya
// The shared record: the transporter writes the weight, the farmer confirms it
// here, and nothing is paid until they do.
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Button from '../../../components/Button';
import Card, { Divider, Inset } from '../../../components/Card';
import FarmerHeader from '../../../components/FarmerHeader';
import Field from '../../../components/Field';
import { LineItem, MoneyFigure } from '../../../components/LineItem';
import Notice from '../../../components/Notice';
import Screen from '../../../components/Screen';
import { ErrorText, Loading, OfflineBanner } from '../../../components/StatusViews';
import Text from '../../../components/Text';
import Timeline from '../../../components/Timeline';
import { confirmWeight, disputeWeight, paymentDueDate } from '../../../lib/actions';
import { useAuth } from '../../../lib/auth';
import { formatDay, formatDayTime, formatShortDay, formatTime } from '../../../lib/dates';
import { COL, ref } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel } from '../../../lib/market';
import { formatDeduction, formatLKR } from '../../../lib/money';
import { photoUrl } from '../../../lib/photos';
import { useDocument } from '../../../lib/useFirestore';
import { color, font, radius, type } from '../../../theme';

function Photos({ paths }) {
  const [urls, setUrls] = useState([]);
  useEffect(() => {
    Promise.all(paths.map((p) => photoUrl(p).catch(() => null))).then((u) => setUrls(u.filter(Boolean)));
  }, [paths]);
  if (!urls.length) return null;
  return (
    <View style={styles.photos}>
      {urls.map((u) => (
        <Image key={u} source={{ uri: u }} style={styles.photo} />
      ))}
    </View>
  );
}

function WeightPanel({ a }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [disputing, setDisputing] = useState(false);
  const [measured, setMeasured] = useState('');
  const [showPhotos, setShowPhotos] = useState(false);

  async function run(fn) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Inset style={styles.panel}>
      <Text style={[type.caption, styles.ink, styles.bold]}>{t('Weight recorded: {kg} kg', { kg: a.actualWeightKg })}</Text>
      <Text style={[type.caption, styles.muted, { marginTop: 2 }]}>
        {t('{n} photos taken at your gate, {time}, by {name}', {
          n: a.weightPhotos?.length ?? 0,
          time: formatTime(a.weightRecordedAt),
          name: a.transporterName ?? t('the transporter'),
        })}
      </Text>
      {a.weightPhotos?.length ? (
        <Text style={[type.caption, styles.link]} onPress={() => setShowPhotos((s) => !s)}>
          {showPhotos ? 'Hide photos' : 'View photos'}
        </Text>
      ) : null}
      {showPhotos ? <Photos paths={a.weightPhotos} /> : null}
      <Text style={[type.caption, styles.ink, { marginTop: 8 }]}>
        {`${a.actualWeightKg} kg × ${formatLKR(a.agreedPricePerKg)} ${formatDeduction(a.finalFee)} ${t('fee')} = `}
        <Text style={styles.bold}>{formatLKR(a.finalNet)}</Text>
      </Text>

      {disputing ? (
        <View style={{ gap: 8, marginTop: 10 }}>
          <Field label="The weight you measured" value={measured} onChangeText={setMeasured} keyboardType="number-pad" suffix="kg" />
          <View style={styles.pair}>
            <Button title="Cancel" variant="secondary" compact onPress={() => setDisputing(false)} style={{ flex: 1 }} />
            <Button
              title="Send"
              variant="danger"
              compact
              disabled={!(Number(measured) > 0)}
              loading={busy}
              onPress={() => run(() => disputeWeight(a, Number(measured)))}
              style={{ flex: 1.3 }}
            />
          </View>
        </View>
      ) : (
        <View style={[styles.pair, { marginTop: 10 }]}>
          <Button
            title={t('Confirm {kg} kg', { kg: a.actualWeightKg })}
            compact
            loading={busy}
            onPress={() => run(() => confirmWeight(a))}
            style={{ flex: 1.3 }}
          />
          <Button title="Weight is wrong" variant="danger" compact onPress={() => setDisputing(true)} style={{ flex: 1 }} />
        </View>
      )}
      <ErrorText error={error} />
    </Inset>
  );
}

export default function Collection() {
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  const { t } = useI18n();
  const agreement = useDocument(() => ref(COL.agreements, id), [id]);
  const a = agreement.data;

  const p = profile?.payout;
  const payTo =
    p?.method === 'bank'
      ? `${p.bankName} ••••${p.accountLast4}`
      : p?.method === 'mobile'
        ? t('mobile money ••••{last4}', { last4: p.accountLast4 })
        : t('cash at collection');

  const bare = (body) => (
    <Screen header={<FarmerHeader title="Collection & payout" onBack={router.back} />}>{body}</Screen>
  );
  if (agreement.loading) return bare(<Loading />);
  if (!a) return bare(<Notice tone="alert" title="Agreement not found">{t('There is no agreement {id} on this account.', { id })}</Notice>);

  const due = paymentDueDate(a);
  const net = a.finalNet ?? a.netToFarmer;
  const paid = a.status === 'paid';
  const weighed = a.actualWeightKg != null;

  const steps = [
    {
      title: 'Offer agreed',
      detail: `${formatShortDay(a.createdAt)}, ${formatTime(a.createdAt)} · ${a.buyerName}`,
      state: 'done',
      chip: 'Done',
    },
    a.transporterId
      ? { title: 'Lorry booked', detail: `${a.transporterName} · ${formatDayTime(a.collectionTime)}`, state: 'done', chip: 'Done' }
      : { title: 'Booking a lorry', detail: t('For {time}', { time: formatDayTime(a.collectionTime) }), state: 'now', chip: 'In progress' },
  ];

  if (a.status === 'weight-pending') {
    steps.push({
      title: 'Collected — check the weight',
      detail: formatDayTime(a.weightRecordedAt),
      state: 'now',
      chip: 'Happening now',
      children: <WeightPanel a={a} />,
    });
  } else if (a.status === 'disputed') {
    steps.push({
      title: 'Weight questioned',
      detail: t('Recorded {kg} kg · you measured {mine} kg', { kg: a.actualWeightKg, mine: a.farmerWeightKg }),
      state: 'now',
      chip: 'Being checked',
    });
  } else if (weighed) {
    steps.push({ title: 'Weight collected', detail: t('{kg} kg (you confirmed)', { kg: a.actualWeightKg }), state: 'done', chip: 'Done' });
  } else {
    steps.push({ title: 'Collection', detail: formatDayTime(a.collectionTime), state: 'todo', chip: 'Not yet' });
  }
  steps.push(
    { title: 'Payment released', detail: formatDay(paid ? a.paidAt : due), state: paid ? 'done' : 'todo', chip: paid ? 'Done' : 'Not yet' },
    {
      title: 'Paid into your account',
      detail: paid ? formatDay(a.paidAt) : t('Within 1 working day of release'),
      state: paid ? 'done' : 'todo',
      chip: paid ? 'Done' : 'Not yet',
    },
  );

  return (
    <Screen
      gap={12}
      header={
        <FarmerHeader
          title="Collection & payout"
          subtitle={t('{crop} {kg} kg · {id}', { crop: cropLabel(a.crop), kg: a.agreedQuantityKg, id: a.id })}
          onBack={router.back}
        />
      }
    >
      {agreement.fromCache ? <OfflineBanner /> : null}

      {paid ? (
        <Card style={styles.done}>
          <View style={styles.doneHead}>
            <Feather name="check" size={18} color={color.field} />
            <Text style={[type.heading, { color: color.field }]}>Paid</Text>
          </View>
          <Text style={[type.label, styles.muted, { marginTop: 10 }]}>Received</Text>
          <MoneyFigure amount={net} detail={`${formatDay(a.paidAt)}, ${formatTime(a.paidAt)} · ${payTo}`} />
        </Card>
      ) : (
        <Card>
          <MoneyFigure label="Payment expected" amount={net} detail={t('{date} · to {where}', { date: formatDay(due), where: payTo })} />
        </Card>
      )}

      {a.status === 'disputed' ? (
        <Notice tone="alert" title="Payment is held — not cancelled">
          {t('You and {buyer} are asked to agree the weight. Most weight questions are settled within 1 working day.', { buyer: a.buyerName })}
        </Notice>
      ) : null}

      <Card padding={16} style={{ paddingBottom: 4 }}>
        <Timeline steps={steps} />
      </Card>

      {paid || a.weightConfirmed === 'confirmed' ? (
        <Card>
          <LineItem label="Weight collected" value={`${a.actualWeightKg} kg`} />
          <LineItem label="Price agreed" value={`${formatLKR(a.agreedPricePerKg)} / kg`} />
          <LineItem label="Total" amount={a.finalTotal} />
          <LineItem label={t('Platform fee ({pct}%)', { pct: a.feePercent })} amount={a.finalFee} deduction />
          <Divider />
          <LineItem label="You receive" amount={a.finalNet} strong />
        </Card>
      ) : (
        <Card padding={14}>
          <Text style={[type.heading, { fontSize: 15, color: color.ink }]}>If the weight is wrong</Text>
          <Text style={[type.caption, styles.muted, { marginTop: 4 }]}>
            {t('Tap “Weight is wrong” and enter the weight you measured. Payment is held — not cancelled — until you and {buyer} agree. Most weight questions are settled within 1 working day.', { buyer: a.buyerName })}
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  done: { borderColor: color.field, borderWidth: 2 },
  doneHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  pair: { flexDirection: 'row', gap: 8 },
  panel: { marginTop: 8, borderWidth: 1, borderColor: color.lineSoft },
  photos: { flexDirection: 'row', gap: 8, marginTop: 8 },
  photo: { width: 64, height: 64, borderRadius: radius.input - 4, backgroundColor: color.line },
  link: { color: color.field, fontFamily: font.semibold, marginTop: 6 },
  muted: { color: color.muted },
  ink: { color: color.ink },
  bold: { fontFamily: font.semibold },
});
