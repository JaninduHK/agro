// Buyer account — the Account tab.
// Adds what only a buyer has: a summary of orders and the money currently held.
import { query, where } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import Notice from '../../../components/Notice';
import ProfileScreen, { SectionLabel } from '../../../components/ProfileScreen';
import Row from '../../../components/Row';
import { useAuth } from '../../../lib/auth';
import { COL, col } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { formatLKR } from '../../../lib/money';
import { useQuery } from '../../../lib/useFirestore';

export default function BuyerAccount() {
  const { user } = useAuth();
  const { t } = useI18n();
  const uid = user?.uid;
  const orders = useQuery(() => (uid ? query(col(COL.orders), where('buyerId', '==', uid)) : null), [uid]);

  const all = orders.data ?? [];
  const received = all.filter((o) => o.status === 'confirmed');
  const active = all.filter((o) => !['confirmed', 'cancelled'].includes(o.status) && o.paymentStatus !== 'failed');
  const held = all.filter((o) => o.paymentStatus === 'held').reduce((s, o) => s + o.total, 0);
  const unpaid = all.filter((o) => o.paymentStatus === 'failed' && o.status !== 'cancelled').length;

  return (
    <ProfileScreen>
      <SectionLabel>Your buying</SectionLabel>
      <Row
        title={t('In progress: {n} · Received: {m}', { n: active.length, m: received.length })}
        subtitle={held ? t('{amount} held until you confirm delivery', { amount: formatLKR(held) }) : t('No money is held right now')}
        onPress={() => router.navigate('/orders')}
      />
      {unpaid ? (
        <Notice tone="alert" title={unpaid === 1 ? t('1 order is waiting for payment') : t('{n} orders are waiting for payment', { n: unpaid })}>
          Open Orders to pay another way or cancel.
        </Notice>
      ) : null}
    </ProfileScreen>
  );
}
