// S07 Money — Sahanya
// What is coming, where it goes, what has been paid. Changing where money goes
// needs a fresh code sent to the farmer's own number — the database refuses the
// write otherwise (firestore.rules, FR-15), so an operator cannot redirect payouts.
import { query, where } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import Card from '../../../components/Card';
import ChangePayout, { payoutLabel } from '../../../components/ChangePayout';
import Chip from '../../../components/Chip';
import FarmerHeader from '../../../components/FarmerHeader';
import { MoneyFigure } from '../../../components/LineItem';
import Notice from '../../../components/Notice';
import Row from '../../../components/Row';
import Screen from '../../../components/Screen';
import { Loading, OfflineBanner } from '../../../components/StatusViews';
import { paymentDueDate } from '../../../lib/actions';
import { maskPhone, useAuth } from '../../../lib/auth';
import { formatDay, formatShortDay, toDate } from '../../../lib/dates';
import { COL, col } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel } from '../../../lib/market';
import { formatLKR } from '../../../lib/money';
import { useQuery } from '../../../lib/useFirestore';
import { color, font, type } from '../../../theme';

const firstName = (n = '') => n.split(' ')[0];

export default function Money() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const uid = user?.uid;
  const [changing, setChanging] = useState(false);
  const agreements = useQuery(() => (uid ? query(col(COL.agreements), where('farmerId', '==', uid)) : null), [uid]);

  const all = agreements.data ?? [];
  const incoming = all
    .filter((a) => ['agreed', 'collected', 'weight-pending', 'disputed'].includes(a.status))
    .sort((a, b) => toDate(paymentDueDate(a)) - toDate(paymentDueDate(b)));
  const next = incoming[0];
  const paid = all
    .filter((a) => a.status === 'paid')
    .sort((a, b) => (b.paidAt?.toMillis?.() ?? 0) - (a.paidAt?.toMillis?.() ?? 0));

  const now = new Date();
  const thisMonth = paid.filter((a) => {
    const d = toDate(a.paidAt);
    return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthNet = thisMonth.reduce((s, a) => s + (a.finalNet ?? a.netToFarmer), 0);
  const monthFees = thisMonth.reduce((s, a) => s + (a.finalFee ?? a.feeAmount), 0);

  const p = profile?.payout;
  const destination = payoutLabel(p, t);

  return (
    <Screen header={<FarmerHeader title="Money" subtitle={profile?.fullName} />}>
      {agreements.fromCache ? <OfflineBanner /> : null}
      {agreements.loading ? <Loading /> : null}

      {next ? (
        <Card>
          <MoneyFigure
            label="Coming to you"
            amount={next.finalNet ?? next.netToFarmer}
            detail={`${formatDay(paymentDueDate(next))} · ${next.buyerName}`}
          />
          <Text style={[type.caption, styles.muted, { marginTop: 4 }]}>
            {t('{crop} {kg} kg · held by the platform until you confirm collection', { crop: cropLabel(next.crop), kg: next.agreedQuantityKg })}
          </Text>
          {incoming.length > 1 ? (
            <Text style={[type.caption, styles.ink, { marginTop: 6 }]}>
              {incoming.length === 2 ? t('+ 1 more payment on the way') : t('+ {n} more payments on the way', { n: incoming.length - 1 })}
            </Text>
          ) : null}
        </Card>
      ) : !agreements.loading ? (
        <Card>
          <Text style={[type.label, styles.muted]}>Coming to you</Text>
          <Text style={[type.body, styles.ink, { marginTop: 6 }]}>Nothing yet. Money appears here once you accept an offer.</Text>
        </Card>
      ) : null}

      <Card>
        <View style={styles.between}>
          <Text style={[type.label, styles.muted]}>Where it goes</Text>
          {!changing ? (
            <Text style={styles.link} onPress={() => setChanging(true)} accessibilityRole="button">Change</Text>
          ) : null}
        </View>
        <Text style={[type.heading, styles.ink, { marginTop: 6 }]}>{destination}</Text>
        {p?.accountName ? <Text style={[type.caption, styles.muted, { marginTop: 2 }]}>{t('Account name: {name}', { name: p.accountName })}</Text> : null}
        {changing ? (
          <ChangePayout profile={profile} uid={uid} onDone={() => setChanging(false)} />
        ) : (
          <Notice tone="field" style={{ marginTop: 12 }}>
            {t('Only {name} can change this — it needs a code sent to {phone}.', { name: firstName(profile?.fullName), phone: maskPhone(profile?.phone ?? '') }) +
              (profile?.operatorName
                ? ` ${t('{helper} can read this page but cannot edit it or receive payment.', { helper: firstName(profile.operatorName) })}`
                : '')}
          </Notice>
        )}
      </Card>

      <Text style={[type.label, styles.muted]}>Payment history</Text>
      {paid.length ? (
        paid.map((a) => (
          <Row
            key={a.id}
            title={t('{amount} received', { amount: formatLKR(a.finalNet ?? a.netToFarmer) })}
            subtitle={t('{crop} {kg} kg · {buyer} · {date} · fee {fee}', {
              crop: cropLabel(a.crop),
              kg: a.actualWeightKg ?? a.agreedQuantityKg,
              buyer: a.buyerName,
              date: formatShortDay(a.paidAt),
              fee: formatLKR(a.finalFee ?? a.feeAmount),
            })}
            right={<Chip label="Paid" tone="done" />}
            onPress={() => router.push(`/collection/${a.id}`)}
          />
        ))
      ) : (
        <Text style={[type.caption, styles.muted]}>No payments yet.</Text>
      )}

      {thisMonth.length ? (
        <Card>
          <Text style={[type.label, styles.muted]}>Received this month</Text>
          <Text style={[type.title, styles.ink, { marginTop: 4 }]}>{formatLKR(monthNet)}</Text>
          <Text style={[type.caption, styles.muted, { marginTop: 2 }]}>{t('after {amount} fees', { amount: formatLKR(monthFees) })}</Text>
        </Card>
      ) : null}

      <Row title="Account" subtitle={t('Your details, helper, language and sign out')} onPress={() => router.push('/profile')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  link: { fontFamily: font.semibold, fontSize: 15, color: color.field, paddingVertical: 8, paddingLeft: 12 },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
