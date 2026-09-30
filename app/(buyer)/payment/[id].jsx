// Payment not completed — Sahanya
// /payment/<orderId>. No money has left the buyer's account; the order stays
// reserved for 30 minutes while they pay another way.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AppBar from '../../../components/AppBar';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import Chip from '../../../components/Chip';
import Notice from '../../../components/Notice';
import Screen from '../../../components/Screen';
import { ErrorText, Loading } from '../../../components/StatusViews';
import Text from '../../../components/Text';
import { cancelOrder, retryPayment } from '../../../lib/actions';
import { formatTime, toDate } from '../../../lib/dates';
import { COL, ref } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel } from '../../../lib/market';
import { formatLKR } from '../../../lib/money';
import { charge, METHODS } from '../../../lib/payments';
import { useDocument } from '../../../lib/useFirestore';
import { color, radius, type } from '../../../theme';

export default function PaymentFailed() {
  const { id } = useLocalSearchParams();
  const { t } = useI18n();
  const order = useDocument(() => ref(COL.orders, id), [id]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const o = order.data;

  const header = <AppBar title="Payment not completed" onBack={router.back} />;
  if (order.loading) return <Screen header={header}><Loading /></Screen>;
  if (!o) return <Screen header={header}><Notice tone="alert" title="Order not found">{t('There is no order {id}.', { id })}</Notice></Screen>;

  if (o.paymentStatus !== 'failed' || o.status === 'cancelled') {
    return (
      <Screen header={header}>
        <Notice tone={o.status === 'cancelled' ? 'neutral' : 'field'} title={o.status === 'cancelled' ? 'Order cancelled' : 'Payment received'}>
          {o.status === 'cancelled' ? 'Nothing was charged.' : t('Your {amount} is held until you confirm the order arrived.', { amount: formatLKR(o.total) })}
        </Notice>
        <Button title="See the order" onPress={() => router.replace(`/order/${o.id}`)} />
      </Screen>
    );
  }

  const expired = o.reservedUntil && toDate(o.reservedUntil) < new Date();
  const method = METHODS[o.paymentMethod]?.label ?? o.paymentMethod;

  async function pay(next) {
    setBusy(next);
    setError(null);
    try {
      const payment = await charge(next, o.total);
      await retryPayment(o, next, payment);
      if (payment.ok) router.replace(`/order/${o.id}`);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    setBusy('cancel');
    try {
      await cancelOrder(o);
      router.replace('/orders');
    } catch (e) {
      setError(e);
      setBusy(null);
    }
  }

  return (
    <Screen header={header} gap={12}>
      <Notice tone="alert" title={t('{method} could not complete the payment', { method })}>
        {t('No money has left your account. The reason given was “{reason}”.', { reason: t(o.paymentFailure ?? 'unknown') })}
      </Notice>

      <Card>
        <Text style={[type.heading, styles.ink]}>{expired ? 'Reservation ended' : 'Your order is still reserved'}</Text>
        <Text style={[type.body, styles.ink, { marginTop: 4 }]}>
          {t('{crop} {kg} kg from {farmer} · {amount}', {
            crop: cropLabel(o.crop),
            kg: o.quantityKg,
            farmer: o.farmerName,
            amount: formatLKR(o.total),
          })}
        </Text>
        <Text style={[type.caption, styles.muted, { marginTop: 4 }]}>
          {expired
            ? t('The 30 minutes have passed. The produce may still be available — try paying again.')
            : t('Held for 30 minutes, until {time}. Nothing is lost if you pay with a different method.', { time: formatTime(o.reservedUntil) })}
        </Text>
      </Card>

      <Text style={[type.label, styles.muted]}>Try another way to pay</Text>
      {Object.entries(METHODS).map(([key, m]) => {
        const failed = key === o.paymentMethod;
        return (
          <View key={key} style={styles.method}>
            <View style={{ flex: 1 }}>
              <Text style={[type.heading, styles.ink]}>{m.label}</Text>
              <Text style={[type.caption, styles.muted, { marginTop: 2 }]}>{failed ? 'Last attempt failed' : m.detail}</Text>
            </View>
            {failed ? <Chip label="Failed" tone="alert" /> : null}
            <Button
              title={failed ? 'Retry' : 'Use'}
              compact
              variant={failed ? 'secondary' : 'primary'}
              loading={busy === key}
              disabled={!!busy}
              onPress={() => pay(key)}
              style={{ minWidth: 88 }}
            />
          </View>
        );
      })}

      <ErrorText error={error} />
      <Button title="Cancel this order" variant="secondary" onPress={cancel} loading={busy === 'cancel'} disabled={!!busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.paper,
    borderWidth: 1,
    borderColor: color.lineFaint,
    borderRadius: radius.row,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
