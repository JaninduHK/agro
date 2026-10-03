// Retail order to the farmer — Sahanya
// /sale/<orderId>. A buyer has paid (money held by the platform); the farmer
// accepts, which books a delivery job, or declines, which refunds the buyer.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '../../../components/Button';
import Card, { Divider } from '../../../components/Card';
import Chip from '../../../components/Chip';
import FarmerHeader from '../../../components/FarmerHeader';
import { LineItem, MoneyFigure } from '../../../components/LineItem';
import Notice from '../../../components/Notice';
import Screen from '../../../components/Screen';
import { ErrorText, Loading, OfflineBanner } from '../../../components/StatusViews';
import Text from '../../../components/Text';
import { acceptOrder, declineOrder } from '../../../lib/actions';
import { COL, ref } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel } from '../../../lib/market';
import { formatLKR } from '../../../lib/money';
import { useDocument } from '../../../lib/useFirestore';
import { color, type } from '../../../theme';

const STATUS = {
  placed: { label: 'New order', tone: 'neutral' },
  accepted: { label: 'Accepted', tone: 'done' },
  'in-transit': { label: 'On the way', tone: 'done' },
  delivered: { label: 'Delivered', tone: 'done' },
  confirmed: { label: 'Paid', tone: 'done' },
  problem: { label: 'Problem reported', tone: 'alert' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export default function Sale() {
  const { id } = useLocalSearchParams();
  const { t } = useI18n();
  const order = useDocument(() => ref(COL.orders, id), [id]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const o = order.data;

  const header = <FarmerHeader title="Order" subtitle={o ? `${o.id} · ${o.buyerName}` : undefined} onBack={router.back} />;
  if (order.loading) return <Screen header={header}><Loading /></Screen>;
  if (!o) return <Screen header={header}><Notice tone="alert" title="Order not found">{t('There is no order {id}.', { id })}</Notice></Screen>;

  async function run(kind, fn) {
    setBusy(kind);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  }

  const status = STATUS[o.status] ?? { label: o.status };
  const net = o.netToFarmer;

  return (
    <Screen header={header} gap={12}>
      {order.fromCache ? <OfflineBanner detail="Saved information. Accepting needs internet." /> : null}

      <Card>
        <View style={styles.between}>
          <Text style={[type.title, styles.ink, { flex: 1 }]}>{o.buyerName}</Text>
          <Chip label={status.label} tone={status.tone} />
        </View>
        <Text style={[type.body, styles.muted, { marginTop: 2 }]}>
          {t('{crop} {kg} kg · deliver to {place}', { crop: cropLabel(o.crop), kg: o.quantityKg, place: o.deliverTo ?? '' })}
        </Text>
        <Divider />
        <LineItem label={t('{kg} kg × {price}', { kg: o.quantityKg, price: formatLKR(o.pricePerKg) })} amount={o.goodsTotal} />
        <LineItem label="Platform fee (3%)" amount={o.feeAmount} deduction />
        <Divider />
        <MoneyFigure label="You receive" amount={net} />
      </Card>

      {o.status === 'placed' ? (
        <>
          <Notice tone="field" title="The buyer has already paid">
            {t('{amount} is held by the platform and paid to you once {buyer} confirms the {crop} arrived.', {
              amount: formatLKR(net),
              buyer: o.buyerName,
              crop: cropLabel(o.crop),
            })}
          </Notice>
          <ErrorText error={error} />
          <Button
            title={t('Accept — {amount}', { amount: formatLKR(net) })}
            onPress={() => run('accept', () => acceptOrder(o))}
            loading={busy === 'accept'}
            disabled={!!busy || order.fromCache}
          />
          <Button
            title="I cannot supply this"
            variant="danger"
            onPress={() => run('decline', () => declineOrder(o))}
            loading={busy === 'decline'}
            disabled={!!busy || order.fromCache}
          />
          <Text style={[type.caption, styles.muted, { textAlign: 'center' }]}>
            Declining refunds the buyer in full. It does not affect your rating.
          </Text>
        </>
      ) : null}

      {['accepted', 'in-transit', 'delivered'].includes(o.status) ? (
        <Notice title={o.transporterName ? t('{name} delivers this order', { name: o.transporterName }) : 'A transporter is being booked'}>
          {o.status === 'delivered'
            ? t('Delivered. You are paid when {buyer} confirms, within 2 hours of arrival.', { buyer: o.buyerName })
            : o.status === 'in-transit'
              ? t('Collected and on the way to {place}.', { place: o.deliverTo ?? '' })
              : 'Pick-up is the next morning. Have it packed and weighed.'}
        </Notice>
      ) : null}

      {o.status === 'confirmed' ? (
        <Notice tone="field" title="Paid">{t('{buyer} confirmed the order. {amount} is on its way to you.', { buyer: o.buyerName, amount: formatLKR(net) })}</Notice>
      ) : null}
      {o.status === 'problem' ? (
        <Notice tone="alert" title="The buyer reported a problem">
          Payment is held while it is checked. You will see the buyer’s photos and can respond within 24 hours.
        </Notice>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
