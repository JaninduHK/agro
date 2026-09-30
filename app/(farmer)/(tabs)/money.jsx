// S07 Money — Ranaweera
// What is coming, where it goes, what has been paid. Changing where money goes
// needs a fresh code sent to the farmer's own number — the database refuses the
// write otherwise (firestore.rules, FR-15), so an operator cannot redirect payouts.
import { query, where } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import Card, { Divider } from '../../../components/Card';
import ChoiceGrid from '../../../components/ChoiceGrid';
import Chip from '../../../components/Chip';
import FarmerHeader from '../../../components/FarmerHeader';
import Field from '../../../components/Field';
import { MoneyFigure } from '../../../components/LineItem';
import Notice from '../../../components/Notice';
import Row from '../../../components/Row';
import Screen from '../../../components/Screen';
import { ErrorText, Loading, OfflineBanner } from '../../../components/StatusViews';
import { paymentDueDate, updatePayout } from '../../../lib/actions';
import { maskPhone, useAuth } from '../../../lib/auth';
import { formatDay, formatShortDay, toDate } from '../../../lib/dates';
import { COL, col } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel } from '../../../lib/market';
import { formatLKR } from '../../../lib/money';
import { useQuery } from '../../../lib/useFirestore';
import { color, font, type } from '../../../theme';

const firstName = (n = '') => n.split(' ')[0];
const METHODS = [
  { id: 'bank', label: 'Bank account' },
  { id: 'mobile', label: 'Mobile money' },
  { id: 'cash', label: 'Cash' },
];

// idle → code sent → code confirmed (fresh sign-in) → edit → saved
function ChangePayout({ profile, uid, onDone }) {
  const { sendCode, confirmCode } = useAuth();
  const { t } = useI18n();
  const [stage, setStage] = useState('start');
  const [code, setCode] = useState('');
  const [method, setMethod] = useState(profile.payout?.method ?? 'bank');
  const [bankName, setBankName] = useState(profile.payout?.bankName ?? '');
  const [account, setAccount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function step(fn) {
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

  const digits = account.replace(/\D/g, '');
  const canSave = method === 'cash' || (digits.length >= 6 && (method !== 'bank' || bankName.trim()));

  return (
    <View style={{ gap: 10, marginTop: 12 }}>
      {stage === 'start' ? (
        <>
          <Text style={[type.caption, styles.ink]}>
            {t('We send a code to {name}’s number {phone}. Only someone with that phone can continue.', { name: firstName(profile.fullName), phone: maskPhone(profile.phone) })}
          </Text>
          <Button title="Send code" compact loading={busy} onPress={() => step(async () => { await sendCode(profile.phone); setStage('code'); })} />
        </>
      ) : null}
      {stage === 'code' ? (
        <>
          <Field label="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
          <Button
            title="Confirm code"
            compact
            disabled={code.length !== 6}
            loading={busy}
            onPress={() => step(async () => { await confirmCode(code); setStage('edit'); })}
          />
        </>
      ) : null}
      {stage === 'edit' ? (
        <>
          <ChoiceGrid columns={0} options={METHODS} value={method} onChange={setMethod} />
          {method === 'bank' ? <Field label="Bank" value={bankName} onChangeText={setBankName} /> : null}
          {method !== 'cash' ? (
            <Field
              label={method === 'bank' ? 'Account number' : 'eZ Cash or mCash number'}
              value={account}
              onChangeText={setAccount}
              keyboardType="number-pad"
            />
          ) : null}
          <Button
            title="Save where money goes"
            compact
            disabled={!canSave}
            loading={busy}
            onPress={() =>
              step(async () => {
                const payout =
                  method === 'cash'
                    ? { method }
                    : { method, bankName: method === 'bank' ? bankName.trim() : null, accountLast4: digits.slice(-4), accountName: profile.fullName };
                await updatePayout(uid, payout);
                onDone();
              })
            }
          />
          <Text style={[type.caption, styles.muted]}>This change must be saved within 5 minutes of the code.</Text>
        </>
      ) : null}
      <ErrorText error={error} />
      <Button title="Cancel" variant="secondary" compact onPress={onDone} />
    </View>
  );
}

export default function Money() {
  const { user, profile, signOut } = useAuth();
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
  const destination =
    p?.method === 'bank'
      ? `${p.bankName} ••••${p.accountLast4}`
      : p?.method === 'mobile'
        ? t('Mobile money ••••{last4}', { last4: p.accountLast4 })
        : t('Cash at collection');

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

      <Divider />
      <Button title="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  link: { fontFamily: font.semibold, fontSize: 15, color: color.field, paddingVertical: 8, paddingLeft: 12 },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
