// S01 Create account — Karanayaka
// Farmer: what you do → who holds the phone → where money goes.
// Buyer / transporter skip the phone step. Each step is saved on the account as
// soon as Next is tapped, so a handed-back phone resumes where it stopped.
import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import AppBar from '../../components/AppBar';
import Button from '../../components/Button';
import ChoiceGrid from '../../components/ChoiceGrid';
import Field, { FieldLabel } from '../../components/Field';
import Notice from '../../components/Notice';
import OptionCard from '../../components/OptionCard';
import OwnerStrip from '../../components/OwnerStrip';
import ProgressRail from '../../components/ProgressRail';
import Screen from '../../components/Screen';
import { ErrorText } from '../../components/StatusViews';
import { toE164, useAuth } from '../../lib/auth';
import { formatTime } from '../../lib/dates';
import { finishRegistration, saveRegistrationStep } from '../../lib/firestore';
import { useI18n } from '../../lib/i18n';
import { color, font, type } from '../../theme';

const ROLES = [
  {
    id: 'farmer',
    icon: 'sun',
    title: 'Farmer',
    detail: 'I grow produce and want to sell it',
    points: [
      'List your crop, grade, quantity and harvest date',
      'Compare offers and see what you receive after fees',
      'Get paid to your own account, even on a shared phone',
    ],
  },
  {
    id: 'buyer',
    icon: 'shopping-bag',
    title: 'Buyer',
    detail: 'I want to buy produce',
    points: [
      'Search by crop, quantity, harvest date and delivery area',
      'See the farmer’s verification and rating before you pay',
      'Your money is held until you confirm the order arrived',
    ],
  },
  {
    id: 'transporter',
    icon: 'truck',
    title: 'Transporter',
    detail: 'I collect and deliver for a fee',
    points: [
      'See jobs near you with the fee before you accept',
      'You set your own fee — no commission is taken from transport',
      'Record weight and photos at handover so nothing is disputed',
    ],
  },
];

const STEPS = {
  farmer: [
    { id: 'role', label: 'What you do' },
    { id: 'holder', label: 'Who holds the phone' },
    { id: 'payout', label: 'Where money goes' },
  ],
  buyer: [
    { id: 'role', label: 'What you do' },
    { id: 'details', label: 'Your details' },
  ],
  transporter: [
    { id: 'role', label: 'What you do' },
    { id: 'payout', label: 'Your details and pay' },
  ],
};

const RELATIONS = [
  { id: 'son', label: 'Son' },
  { id: 'daughter', label: 'Daughter' },
  { id: 'family', label: 'Other family' },
  { id: 'shop', label: 'Shop' },
  { id: 'field officer', label: 'Field officer' },
];

const PAY_METHODS = [
  { id: 'bank', label: 'Bank account' },
  { id: 'mobile', label: 'Mobile money' },
  { id: 'cash', label: 'Cash on collection' },
];

const firstName = (name = '') => name.trim().split(' ')[0];

export default function Register() {
  const { user, profile, status, signOut } = useAuth();
  const { language, t } = useI18n();

  const saved = profile?.registration;
  const [role, setRole] = useState(profile?.role ?? null);
  const [stepIndex, setStepIndex] = useState(saved ? Math.min(saved.step, STEPS[profile.role].length - 1) : 0);
  const [showErrors, setShowErrors] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // step 2 — who holds the phone
  const [holder, setHolder] = useState(profile?.operatorName ? 'helper' : profile?.registration?.step >= 2 ? 'self' : null);
  const [helperName, setHelperName] = useState(profile?.operatorName ?? '');
  const [helperPhone, setHelperPhone] = useState(profile?.operatorPhone ? `0${profile.operatorPhone.slice(3)}` : '');
  const [relation, setRelation] = useState(profile?.operatorRelation ?? 'son');

  // last step — details and payout
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [village, setVillage] = useState(profile?.village ?? '');
  const [payMethod, setPayMethod] = useState(profile?.payout?.method ?? 'bank');
  const [bankName, setBankName] = useState(profile?.payout?.bankName ?? '');
  const [accountNumber, setAccountNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const steps = STEPS[role ?? 'farmer'];
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const problems = useMemo(() => {
    const p = {};
    if (step.id === 'role' && !role) p.role = true;
    if (step.id === 'holder') {
      if (!holder) p.holder = 'Choose who is holding the phone.';
      if (holder === 'helper' && !helperName.trim()) p.helperName = 'Enter the helper’s name.';
      if (holder === 'helper' && !toE164(helperPhone)) p.helperPhone = 'A Sri Lankan mobile number has 10 digits, starting 07.';
    }
    if (step.id === 'payout' || step.id === 'details') {
      if (!fullName.trim()) p.fullName = 'Enter a name.';
      if (!village.trim()) p.village = 'Enter your village or area.';
    }
    if (step.id === 'payout') {
      if (payMethod === 'bank' && !bankName.trim()) p.bankName = 'Enter the bank.';
      if (payMethod === 'bank' && accountNumber.replace(/\D/g, '').length < 6 && !profile?.payout?.accountLast4)
        p.accountNumber = 'Enter the account number.';
      if (payMethod === 'mobile' && !toE164(mobileNumber) && !profile?.payout?.accountLast4)
        p.mobileNumber = 'Enter the mobile money number.';
    }
    return p;
  }, [step.id, role, holder, helperName, helperPhone, fullName, village, payMethod, bankName, accountNumber, mobileNumber, profile]);

  if (status === 'signedOut') return <Redirect href="/welcome" />;
  if (!user) return null;

  const ownerName = fullName.trim() || t('the farmer');
  const helperFirst = firstName(helperName) || t('The helper');

  function payout() {
    if (payMethod === 'cash') return { method: 'cash' };
    if (payMethod === 'mobile') {
      const digits = mobileNumber.replace(/\D/g, '');
      return { method: 'mobile', accountLast4: digits.slice(-4) || profile?.payout?.accountLast4, accountName: fullName.trim() };
    }
    const digits = accountNumber.replace(/\D/g, '');
    // Only the last four digits are stored; the full number goes to the payment provider, not Firestore.
    return {
      method: 'bank',
      bankName: bankName.trim(),
      accountLast4: digits.slice(-4) || profile?.payout?.accountLast4,
      accountName: fullName.trim(),
    };
  }

  async function next() {
    if (Object.keys(problems).length) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setBusy(true);
    setError(null);
    try {
      if (step.id === 'role') {
        await saveRegistrationStep(user, 1, { role, roles: [role], language });
      } else if (step.id === 'holder') {
        const helper = holder === 'helper';
        await saveRegistrationStep(
          user,
          2,
          {
            operatorName: helper ? helperName.trim() : null,
            operatorPhone: helper ? toE164(helperPhone) : null,
            operatorRelation: helper ? relation : null,
          },
          helper ? helperName.trim() : null,
        );
      }

      if (isLast) {
        const fields = { fullName: fullName.trim(), village: village.trim() };
        if (step.id === 'payout') fields.payout = payout();
        if (role !== 'farmer') Object.assign(fields, { operatorName: null, operatorPhone: null, operatorRelation: null });
        await finishRegistration(user.uid, fields);
        // status becomes 'ready' and the (auth) layout routes to the role's home
      } else {
        setStepIndex((i) => i + 1);
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const resumed = saved && stepIndex === Math.min(saved.step, steps.length - 1);

  return (
    <Screen
      header={
        <>
          <AppBar title="Create account" attached />
          <ProgressRail step={stepIndex + 1} total={steps.length} label={step.label} />
          {role === 'farmer' ? <OwnerStrip /> : null}
        </>
      }
      gap={12}
      footer={
        <>
          {error ? <ErrorText error={error} /> : null}
          <View style={styles.buttons}>
            {stepIndex > 0 ? (
              <Button title="Back" variant="secondary" onPress={() => setStepIndex((i) => i - 1)} style={{ flex: 1 }} />
            ) : null}
            <Button
              title={
                isLast ? t('Create account') : step.id === 'role' && role ? t(`Continue as a ${role}`) : t('Next')
              }
              onPress={next}
              loading={busy}
              style={{ flex: 1.6 }}
            />
          </View>
          {stepIndex > 0 ? (
            <Button title="Close — finish later" variant="secondary" onPress={signOut} />
          ) : null}
        </>
      }
    >
      {resumed ? (
        <Notice tone="field" title="Saved — you can stop here">
          {saved.savedBy
            ? t('Everything entered so far is saved on this account. Step {n} of {total}, saved {time} by {name}. Opening the app on any phone continues from here.', {
                n: saved.step,
                total: steps.length,
                time: formatTime(saved.savedAt),
                name: firstName(saved.savedBy),
              })
            : t('Everything entered so far is saved on this account. Step {n} of {total}, saved {time}. Opening the app on any phone continues from here.', {
                n: saved.step,
                total: steps.length,
                time: formatTime(saved.savedAt),
              })}
        </Notice>
      ) : null}

      {step.id === 'role' ? (
        <>
          <Text style={[type.title, { color: color.ink }]}>What do you do?</Text>
          {showErrors && problems.role ? (
            <Notice tone="alert" title="Choose one to continue">
              Tap Farmer, Buyer or Transporter. Nothing is final — you can change this afterwards in Account.
            </Notice>
          ) : (
            <Text style={[type.body, styles.muted]}>
              Choose one. This only changes what the app shows you — you can add another role later.
            </Text>
          )}
          {ROLES.map((r) => (
            <OptionCard
              key={r.id}
              icon={r.icon}
              title={r.title}
              detail={r.detail}
              selected={role === r.id}
              error={showErrors && problems.role}
              onPress={() => setRole(r.id)}
            >
              {r.points.map((p) => (
                <Text key={p} style={[type.caption, { color: color.ink }]}>· {p}</Text>
              ))}
            </OptionCard>
          ))}
          {showErrors && problems.role ? (
            <Notice title="Not sure which one?">
              If you grow and also deliver for other people, choose Farmer now and add Transporter later. A field
              officer can also set this up with you.
            </Notice>
          ) : null}
        </>
      ) : null}

      {step.id === 'holder' ? (
        <>
          <Text style={[type.title, { color: color.ink }]}>Who is holding this phone?</Text>
          <OptionCard
            title="The farmer — this is my own phone"
            detail="The farmer signs in with their own number"
            selected={holder === 'self'}
            error={showErrors && problems.holder}
            onPress={() => setHolder('self')}
          />
          <OptionCard
            title="Someone helping the farmer"
            detail="A family member, shop or field officer is entering details"
            selected={holder === 'helper'}
            error={showErrors && problems.holder}
            onPress={() => setHolder('helper')}
          />
          {holder === 'helper' ? (
            <>
              <FieldLabel style={{ marginTop: 4 }}>Helper’s name and number</FieldLabel>
              <Field
                label="Name"
                value={helperName}
                onChangeText={setHelperName}
                autoCapitalize="words"
                error={showErrors ? problems.helperName : null}
              />
              <Field
                label="Mobile number"
                value={helperPhone}
                onChangeText={setHelperPhone}
                keyboardType="phone-pad"
                placeholder="07_ ___ ____"
                error={showErrors ? problems.helperPhone : null}
              />
              <FieldLabel>They are the farmer’s</FieldLabel>
              <ChoiceGrid columns={3} options={RELATIONS} value={relation} onChange={setRelation} />
              <Notice tone="field" title="Payments go to the farmer only">
                {t('{name} can enter details but cannot receive money or change where it is sent.', { name: helperFirst })}
              </Notice>
            </>
          ) : null}
        </>
      ) : null}

      {step.id === 'payout' || step.id === 'details' ? (
        <>
          <Text style={[type.title, { color: color.ink }]}>
            {step.id === 'details' ? 'About your business' : role === 'farmer' ? 'Where should the money go?' : 'Your details and pay'}
          </Text>
          <Field
            label={role === 'farmer' ? 'Farmer’s full name' : role === 'buyer' ? 'Business or buyer name' : 'Full name'}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            error={showErrors ? problems.fullName : null}
          />
          <Field
            label={role === 'buyer' ? 'Deliver to (town or area)' : 'Village / collection area'}
            value={village}
            onChangeText={setVillage}
            autoCapitalize="words"
            error={showErrors ? problems.village : null}
          />

          {step.id === 'payout' ? (
            <>
              <FieldLabel style={{ marginTop: 4 }}>Pay into</FieldLabel>
              <ChoiceGrid columns={0} options={PAY_METHODS} value={payMethod} onChange={setPayMethod} />
              {payMethod === 'bank' ? (
                <>
                  <Field
                    label="Bank"
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="Bank of Ceylon"
                    error={showErrors ? problems.bankName : null}
                  />
                  <Field
                    label="Account number"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    keyboardType="number-pad"
                    placeholder={profile?.payout?.accountLast4 ? `•••• ${profile.payout.accountLast4}` : ''}
                    error={showErrors ? problems.accountNumber : null}
                    hint="Only the last 4 digits are shown in the app."
                  />
                </>
              ) : null}
              {payMethod === 'mobile' ? (
                <Field
                  label="eZ Cash or mCash number"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  placeholder="07_ ___ ____"
                  error={showErrors ? problems.mobileNumber : null}
                />
              ) : null}
              {payMethod === 'cash' ? (
                <Text style={[type.caption, styles.muted]}>
                  The transporter hands over cash at collection and records it in the app.
                </Text>
              ) : null}

              {role === 'farmer' ? (
                <Notice tone="field" title={t('Money is paid to {name} only.', { name: ownerName })}>
                  {profile?.operatorName
                    ? t('{name} can enter details and read the account, but cannot receive payment or change where money is sent.', { name: firstName(profile.operatorName) })
                    : t('Changing where money goes later needs a code sent to this phone number.')}
                </Notice>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: color.muted },
  buttons: { flexDirection: 'row', gap: 10 },
  bold: { fontFamily: font.semibold },
});
