// S10 Track order — Athuraliya
// CRUD: read order, update order status (confirm received). Report a problem
// opens S11.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import Text from '../../../components/Text';
import AppBar from '../../../components/AppBar';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import { MoneyFigure } from '../../../components/LineItem';
import Notice from '../../../components/Notice';
import Screen from '../../../components/Screen';
import { ErrorText, Loading, OfflineBanner } from '../../../components/StatusViews';
import Timeline from '../../../components/Timeline';
import { confirmOrderReceived } from '../../../lib/actions';
import { formatDayTime } from '../../../lib/dates';
import { COL, ref } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { METHODS } from '../../../lib/payments';
import { cropLabel } from '../../../lib/market';
import { formatLKR } from '../../../lib/money';
import { useDocument } from '../../../lib/useFirestore';
import { color, type } from '../../../theme';

const FLOW = ['placed', 'accepted', 'collected', 'in-transit', 'delivered', 'confirmed'];

export default function TrackOrder() {
  const { id } = useLocalSearchParams();
  const { t } = useI18n();
  const order = useDocument(() => ref(COL.orders, id), [id]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const o = order.data;

  const header = <AppBar title="Your order" subtitle={o ? `${cropLabel(o.crop)} ${o.quantityKg} kg · ${o.id}` : undefined} onBack={router.back} />;
  if (order.loading) return <Screen header={header}><Loading /></Screen>;
  if (!o) return <Screen header={header}><Notice tone="alert" title="Order not found">{t('There is no order {id} on this account.', { id })}</Notice></Screen>;

  if (o.paymentStatus === 'failed' && o.status !== 'cancelled') {
    return (
      <Screen header={header}>
        <Notice tone="alert" title="Payment not completed">
          {t('This order is reserved but not paid. Pay another way to confirm it.')}
        </Notice>
        <Button title="Pay another way" onPress={() => router.replace(`/payment/${o.id}`)} />
      </Screen>
    );
  }
  if (o.status === 'cancelled') {
    return (
      <Screen header={header}>
        <Notice title="Order cancelled">
          {o.paymentStatus === 'refunded'
            ? t('Your {amount} has been refunded to {method}.', { amount: formatLKR(o.total), method: o.paymentMethod === 'bank' ? t('your bank account') : METHODS[o.paymentMethod]?.label ?? o.paymentMethod })
            : t('Nothing was charged.')}
        </Notice>
        <Button title="Search produce" onPress={() => router.navigate('/search')} />
      </Screen>
    );
  }

  const at = o.status === 'problem' ? FLOW.indexOf('delivered') : FLOW.indexOf(o.status);
  const state = (i) => (i < at ? 'done' : i === at ? 'now' : 'todo');
  const chip = (i) => (i < at ? 'Done' : i === at ? 'Happening now' : 'Not yet');
  const firstName = (n = '') => n.split(' ')[0];

  const steps = [
    { title: 'Order placed and paid', detail: t('{time} · {amount} held', { time: formatDayTime(o.createdAt), amount: formatLKR(o.total) }) },
    { title: 'Farmer accepted', detail: o.farmerName },
    { title: 'Collected from the farm', detail: o.farmerVillage ?? '' },
    { title: 'On the way to you', detail: `${o.farmerVillage ?? ''} → ${o.deliverTo ?? ''}` },
    { title: 'You confirm or report', detail: '2-hour inspection window after arrival' },
  ].map((s, i) => ({ ...s, state: o.status === 'confirmed' ? 'done' : state(i), chip: o.status === 'confirmed' ? 'Done' : chip(i) }));

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await confirmOrderReceived(o);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const settled = o.status === 'confirmed';

  return (
    <Screen header={header} gap={12}>
      {order.fromCache ? <OfflineBanner /> : null}

      <Card>
        {settled ? (
          <MoneyFigure label="Received and paid" amount={o.total} detail={t('Released to {name}. Thank you.', { name: firstName(o.farmerName) })} />
        ) : o.status === 'problem' ? (
          <>
            <Text style={[type.title, { color: color.ink }]}>Problem reported</Text>
            <Text style={[type.body, { color: color.muted, marginTop: 4 }]}>Your {formatLKR(o.total)} stays held until it is decided.</Text>
          </>
        ) : (
          <>
            <Text style={[type.label, { color: color.muted }]}>{o.status === 'in-transit' ? 'Arriving today' : 'Status'}</Text>
            <Text style={[type.title, { color: color.ink, marginTop: 4 }]}>
              {steps[Math.min(at, steps.length - 1)]?.title}
            </Text>
            <Text style={[type.body, { color: color.muted, marginTop: 4 }]}>
              {t('Check the {crop} within 2 hours of arrival. Your {amount} stays held until you confirm, or report a problem.', {
                crop: cropLabel(o.crop).toLowerCase(),
                amount: formatLKR(o.total),
              })}
            </Text>
          </>
        )}
      </Card>

      <Card padding={16} style={{ paddingBottom: 4 }}>
        <Timeline steps={steps} />
      </Card>

      <ErrorText error={error} />
      {!settled && o.status !== 'problem' ? (
        <>
          <Button title="Confirm order received" onPress={confirm} loading={busy} disabled={order.fromCache} />
          <Button title="Report a problem" variant="danger" onPress={() => router.push(`/problem/${o.id}`)} />
        </>
      ) : null}
      {o.status === 'problem' ? (
        <Button title="See the problem report" variant="secondary" onPress={() => router.push(`/problem/${o.id}`)} />
      ) : null}
    </Screen>
  );
}
