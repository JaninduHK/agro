// S10 Your orders — Athuraliya
// List of the buyer's orders; each opens its tracking screen.
import { query, where } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import Text from '../../../components/Text';
import AppBar from '../../../components/AppBar';
import Button from '../../../components/Button';
import Chip from '../../../components/Chip';
import EmptyState from '../../../components/EmptyState';
import Row from '../../../components/Row';
import Screen from '../../../components/Screen';
import { Loading, OfflineBanner } from '../../../components/StatusViews';
import { useAuth } from '../../../lib/auth';
import { formatShortDay } from '../../../lib/dates';
import { COL, col } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel } from '../../../lib/market';
import { formatLKR } from '../../../lib/money';
import { useQuery } from '../../../lib/useFirestore';
import { color, type } from '../../../theme';

const ORDER_STATUS = {
  placed: { label: 'Placed', tone: 'neutral' },
  accepted: { label: 'Accepted', tone: 'neutral' },
  collected: { label: 'Collected', tone: 'neutral' },
  'in-transit': { label: 'On the way', tone: 'time' },
  delivered: { label: 'Arrived', tone: 'time' },
  confirmed: { label: 'Received', tone: 'done' },
  problem: { label: 'Problem reported', tone: 'alert' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};
const UNPAID = { label: 'Payment not completed', tone: 'alert' };

export default function Orders() {
  const { user } = useAuth();
  const { t } = useI18n();
  const uid = user?.uid;
  const orders = useQuery(() => (uid ? query(col(COL.orders), where('buyerId', '==', uid)) : null), [uid]);
  const all = (orders.data ?? []).sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  const active = all.filter((o) => !['confirmed', 'cancelled'].includes(o.status));
  const done = all.filter((o) => ['confirmed', 'cancelled'].includes(o.status));

  const row = (o) => {
    const unpaid = o.paymentStatus === 'failed' && o.status !== 'cancelled';
    const status = unpaid ? UNPAID : ORDER_STATUS[o.status] ?? { label: o.status };
    return (
      <Row
        key={o.id}
        title={t('{crop} {kg} kg · {farmer}', { crop: cropLabel(o.crop), kg: o.quantityKg, farmer: o.farmerName })}
        subtitle={`${o.id} · ${formatShortDay(o.createdAt)} · ${formatLKR(o.total)}`}
        right={<Chip label={status.label} tone={status.tone} />}
        onPress={() => router.push(unpaid ? `/payment/${o.id}` : `/order/${o.id}`)}
      />
    );
  };

  return (
    <Screen header={<AppBar title="Your orders" />}>
      {orders.fromCache ? <OfflineBanner /> : null}
      {orders.loading ? <Loading /> : null}
      {!orders.loading && !all.length ? (
        <EmptyState icon="package" title="No orders yet" body="Produce you buy appears here, with its delivery and your payment status.">
          <Button title="Search produce" onPress={() => router.navigate('/search')} />
        </EmptyState>
      ) : null}
      {active.length ? <Text style={[type.label, { color: color.muted }]}>In progress</Text> : null}
      {active.map(row)}
      {done.length ? <Text style={[type.label, { color: color.muted, marginTop: 6 }]}>Finished</Text> : null}
      {done.map(row)}
    </Screen>
  );
}
