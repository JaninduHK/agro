// S01 Create account — Sahanya
// Farmer: what you do → who holds the phone → where money goes.
// Buyer / transporter skip the phone step. Each step is saved on the account as
// soon as Next is tapped, so a handed-back phone resumes where it stopped.
import { Feather } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../../components/Text';
import AppBar from '../../components/AppBar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import { BackButton, LanguagePill, RoleIcon } from '../../components/Onboarding';
import Row from '../../components/Row';
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
import { color, font, radius, type } from '../../theme';

const ROLES = [
  {
    id: 'farmer',
    title: 'Farmer',
    detail: 'I grow and sell produce',
    points: ['List crop, grade and harvest date', 'Compare offers by what you receive', 'Paid to your own account'],
  },
  {
    id: 'buyer',
    title: 'Buyer',
    detail: 'I buy fresh produce',
    points: ['Filter by harvest date and area', 'See farmer verification first', 'Money held until you confirm'],
  },
  {
    id: 'transporter',
    title: 'Transporter',
    detail: 'I collect and deliver',
    points: ['See jobs near you with the fee', 'Set your own fee, no commission', 'Record weight and photos at handover'],
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

// Entry - Onboarding v3 · Choose role. No app bar: back, language, a 3-part rail.
function RoleStep({ role, setRole, total, missing, busy, error, onNext, onBack }) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  return (
    <View style={[styles.rolePage, { paddingTop: insets.top + 4 }]}>
      <StatusBar style="dark" />
      <View style={styles.roleTop}>
        <BackButton onPress={onBack} />
        <LanguagePill />
      </View>
      <View style={styles.roleIntro}>
        <View style={styles.railRow}>
          <View style={styles.rail}>
            {Array.from({ length: total }, (_, i) => (
              <View key={i} style={[styles.railPart, i === 0 && { backgroundColor: color.forest }]} />
            ))}
          </View>
          <Text style={styles.railCount}>{t('{n} of {total}', { n: 1, total })}</Text>
        </View>
        <Text style={[type.hero, { color: color.ink, marginTop: 20, lineHeight: 35 }]}>How will you use agro?</Text>
        <Text style={[type.body, { color: color.muted, marginTop: 8 }]}>Pick the one that fits you. Each account has one role.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.roleList} showsVerticalScrollIndicator={false}>
        {missing ? (
          <View style={styles.roleError} accessibilityRole="alert">
            <View style={styles.roleErrorMark}>
              <Text style={styles.roleErrorBang}>!</Text>
            </View>
            <Text style={styles.roleErrorText}>Choose a role to continue</Text>
          </View>
        ) : null}

        {ROLES.map((r) => {
          const on = role === r.id;
          return (
            <Pressable
              key={r.id}
              onPress={() => setRole(r.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={[styles.roleCard, on && styles.roleCardOn]}
            >
              <View style={styles.roleHead}>
                <RoleIcon role={r.id} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.roleTitle}>{r.title}</Text>
                  <Text style={styles.roleDetail}>{r.detail}</Text>
                </View>
                <View style={[styles.roleRadio, on && styles.roleRadioOn]}>
                  {on ? <Feather name="check" size={15} color={color.forest} /> : null}
                </View>
              </View>
              {on ? (
                <View style={styles.rolePoints}>
                  {r.points.map((point) => (
                    <View key={point} style={styles.rolePoint}>
                      <Feather name="check" size={14} color={color.field} style={{ marginTop: 2 }} />
                      <Text style={styles.rolePointText}>{point}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Pressable>
          );
        })}

        {missing ? (
          <View style={styles.roleHelp}>
            <View style={styles.roleHelpIcon}>
              <Feather name="phone" size={18} color={color.field} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleHelpTitle}>Not sure which one?</Text>
              <Text style={styles.roleHelpText}>A field officer can set this up with you</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.roleFooter, { paddingBottom: insets.bottom + 26 }]}>
        <ErrorText error={error} />
        {role ? (
          <Button title={t(`Continue as ${role}`)} icon="arrow-right" onPress={onNext} loading={busy} />
        ) : (
          // looks unavailable, but a tap explains why rather than doing nothing
          <Pressable onPress={onNext} accessibilityRole="button" style={styles.roleOff}>
            <Text style={[type.button, { color: '#5A6158', fontFamily: font.bold }]}>Continue</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Prototype v3 · Registration abandoned halfway (saved state).
function SavedProgress({ saved, profile, steps, onContinue, onClose }) {
  const { t } = useI18n();
  const nextStep = Math.min(saved.step + 1, steps.length);
  const summary = (id) =>
    id === 'role'
      ? t('Role: {role}', { role: t(ROLES.find((r) => r.id === profile.role)?.title ?? '') })
      : id === 'holder'
        ? profile.operatorName
          ? t('Helper: {name}', { name: profile.operatorName })
          : t('Your own phone')
        : t(steps.find((x) => x.id === id).label);
  return (
    <Screen
      gap={12}
      header={
        <>
          <AppBar title="Create account" attached />
          <ProgressRail step={saved.step} total={steps.length} label={steps[saved.step - 1]?.label} />
          {profile.role === 'farmer' ? <OwnerStrip /> : null}
        </>
      }
      footer={
        <>
          <Button title={t('Continue step {n}', { n: nextStep })} onPress={onContinue} />
          <Button title="Close — finish later" variant="secondary" onPress={onClose} />
        </>
      }
    >
      <Card style={styles.savedCard}>
        <Text style={[type.heading, { color: color.harvestText }]}>Saved — you can stop here</Text>
        <Text style={[type.body, { color: color.ink, marginTop: 6 }]}>
          {saved.savedBy
            ? t('Everything entered so far is saved on this account. Step {n} of {total}, saved {time} by {name}.', {
                n: saved.step,
                total: steps.length,
                time: formatTime(saved.savedAt),
                name: firstName(saved.savedBy),
              })
            : t('Everything entered so far is saved on this account. Step {n} of {total}, saved {time}.', {
                n: saved.step,
                total: steps.length,
                time: formatTime(saved.savedAt),
              })}
        </Text>
        <Text style={[type.body, { color: color.ink, marginTop: 8 }]}>
          Opening the app on any phone continues from this step. Nothing needs to be typed twice.
        </Text>
      </Card>
      <Text style={[type.label, { color: color.ink }]}>Already saved</Text>
      {steps.map((x, i) => {
        const done = i < saved.step;
        return (
          <Row
            key={x.id}
            title={summary(x.id)}
            subtitle={done ? t('Step {n} · saved', { n: i + 1 }) : t('Step {n} · not started', { n: i + 1 })}
            right={<Chip label={done ? 'Done' : 'To do'} tone={done ? 'done' : 'neutral'} />}
          />
        );
      })}
    </Screen>
  );
}

export default function Register() {
  const { user, profile, status, signOut } = useAuth();
  const { language, t } = useI18n();

  const saved = profile?.registration;
  const [role, setRole] = useState(profile?.role ?? null);
  const [stepIndex, setStepIndex] = useState(saved ? Math.min(saved.step, STEPS[profile.role].length - 1) : 0);
  const [showErrors, setShowErrors] = useState(false);
  const [showSaved, setShowSaved] = useState(!!saved); // returning to a half-finished sign-up
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

  if (showSaved && saved) {
    return (
      <SavedProgress
        saved={saved}
        profile={profile}
        steps={STEPS[profile.role]}
        onContinue={() => setShowSaved(false)}
        onClose={signOut}
      />
    );
  }

  if (step.id === 'role') {
    return (
      <RoleStep
        role={role}
        setRole={(r) => {
          setRole(r);
          setShowErrors(false);
        }}
        total={steps.length}
        missing={showErrors && problems.role}
        busy={busy}
        error={error}
        onNext={next}
        onBack={signOut}
      />
    );
  }

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
              title={isLast ? t('Create account') : t('Next')}
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
  rolePage: { flex: 1, backgroundColor: color.canvas },
  roleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  roleIntro: { paddingHorizontal: 24, paddingTop: 18 },
  railRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rail: { flex: 1, flexDirection: 'row', gap: 6 },
  railPart: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: color.line },
  railCount: { fontFamily: font.bold, fontSize: 13, lineHeight: 19, color: color.ink },
  roleList: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12, gap: 12 },
  roleCard: { backgroundColor: color.paper, borderRadius: radius.card, borderWidth: 1, borderColor: color.lineFaint, padding: 16 },
  roleCardOn: {
    borderWidth: 2,
    borderColor: color.forest,
    padding: 15,
    shadowColor: color.forest,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  roleHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  roleTitle: { fontFamily: font.display, fontSize: 17, lineHeight: 22, letterSpacing: -0.17, color: color.ink },
  roleDetail: { fontFamily: font.medium, fontSize: 13, lineHeight: 19, color: color.muted, marginTop: 2 },
  roleRadio: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: color.radio, alignItems: 'center', justifyContent: 'center' },
  roleRadioOn: { borderWidth: 0, backgroundColor: color.lime },
  rolePoints: { marginTop: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: color.canvas, gap: 8 },
  rolePoint: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  rolePointText: { flex: 1, fontFamily: font.medium, fontSize: 13.5, lineHeight: 18, color: color.ink },
  roleError: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: color.alertBg, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14 },
  roleErrorMark: { width: 32, height: 32, borderRadius: 16, backgroundColor: color.alert, alignItems: 'center', justifyContent: 'center' },
  roleErrorBang: { fontFamily: font.extrabold, fontSize: 16, color: color.paper },
  roleErrorText: { flex: 1, fontFamily: font.semibold, fontSize: 14, lineHeight: 19, color: color.alertText },
  roleHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: color.radio,
  },
  roleHelpIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.paper, alignItems: 'center', justifyContent: 'center' },
  roleHelpTitle: { fontFamily: font.bold, fontSize: 14, lineHeight: 19, color: color.ink },
  roleHelpText: { fontFamily: font.medium, fontSize: 12.5, lineHeight: 19, color: color.muted },
  roleFooter: { paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  roleOff: { minHeight: 56, borderRadius: radius.control, backgroundColor: '#E6E1D4', alignItems: 'center', justifyContent: 'center' },
  savedCard: { borderColor: color.harvest, backgroundColor: color.harvestBg },
  muted: { color: color.muted },
  buttons: { flexDirection: 'row', gap: 10 },
  bold: { fontFamily: font.semibold },
});
