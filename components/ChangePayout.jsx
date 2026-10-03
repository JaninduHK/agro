// Change where money is paid. Needs a fresh sign-in code sent to the account's own
// number first — the database refuses the write otherwise (firestore.rules, FR-15),
// so someone merely holding the phone cannot redirect payouts.
// start → code sent → code confirmed (fresh sign-in) → edit → saved
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { updatePayout } from '../lib/actions';
import { maskPhone, useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { color, type } from '../theme';
import Button from './Button';
import ChoiceGrid from './ChoiceGrid';
import Field from './Field';
import { ErrorText } from './StatusViews';
import Text from './Text';

const firstName = (n = '') => n.split(' ')[0];
const METHODS = [
  { id: 'bank', label: 'Bank account' },
  { id: 'mobile', label: 'Mobile money' },
  { id: 'cash', label: 'Cash' },
];

export default function ChangePayout({ profile, uid, onDone }) {
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

// 'Bank of Ceylon ••••4471' | 'Mobile money ••••0321' | 'Cash at collection'
export function payoutLabel(payout, t) {
  if (payout?.method === 'bank') return `${payout.bankName} ••••${payout.accountLast4}`;
  if (payout?.method === 'mobile') return t('Mobile money ••••{last4}', { last4: payout.accountLast4 });
  return t('Cash at collection');
}

const styles = StyleSheet.create({
  ink: { color: color.ink },
  muted: { color: color.muted },
});
