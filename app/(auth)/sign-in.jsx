// S01a Sign in — Athuraliya
// Phone number only. The account belongs to the number, whoever holds the phone.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import AppBar from '../../components/AppBar';
import Button from '../../components/Button';
import Card, { Divider } from '../../components/Card';
import Field from '../../components/Field';
import Screen from '../../components/Screen';
import { toE164, useAuth } from '../../lib/auth';
import { DEMO_CODE, DEMO_SIGN_IN } from '../../lib/demo';
import { translate, useI18n } from '../../lib/i18n';
import { color, type } from '../../theme';

// Explains a bad number in the terms the prototype uses.
function numberProblem(input) {
  const digits = input.replace(/\D/g, '');
  if (!digits) return null;
  if (!digits.startsWith('07')) return 'A Sri Lankan mobile number starts with 07.';
  if (digits.length < 10) return 'This number is too short. A Sri Lankan mobile number has 10 digits, starting 07.';
  if (digits.length > 10) return 'This number is too long. A Sri Lankan mobile number has 10 digits, starting 07.';
  return null;
}

function sendError(e) {
  switch (e?.code) {
    case 'auth/invalid-phone-number':
      return 'This number is not a Sri Lankan mobile number.';
    case 'auth/too-many-requests':
      return 'Too many codes sent to this number. Wait 15 minutes, or ask a field officer to sign you in.';
    case 'auth/network-request-failed':
      return 'No internet connection. Move to an area with signal and try again.';
    case 'auth/app-not-authorized':
    case 'auth/missing-client-identifier':
      return 'This build is not registered with Firebase yet (add its SHA fingerprints in the Firebase console).';
    case 'auth/operation-not-allowed':
      // Also what Firebase returns when SMS to Sri Lanka is not allowed
      // (Authentication → Settings → SMS region policy).
      return 'Sign-in by SMS is switched off for this number’s country. It needs turning on in the Firebase console.';
    case 'auth/billing-not': // as React Native Firebase reports it
    case 'auth/billing-not-enabled':
      // Spark plan: real SMS is not available. Only numbers listed under
      // Authentication → Sign-in method → Phone → "Phone numbers for testing" work.
      return 'This number cannot receive a code yet. Real SMS is not switched on for this app — use a registered test number.';
    case 'auth/quota-exceeded':
      return 'Today’s SMS limit for the app has been reached. Try again tomorrow, or ask a field officer to sign you in.';
    default:
      // Keep the code visible: it is what a developer needs to fix it.
      return translate('The code could not be sent ({code}). Try again in a minute.', { code: e?.code ?? 'unknown error' });
  }
}

export default function SignIn() {
  const { intent } = useLocalSearchParams();
  const { sendCode } = useAuth();
  const { t } = useI18n();
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const problem = numberProblem(phone);
  const valid = !!toE164(phone);

  async function onSend() {
    setError(null);
    setSending(true);
    try {
      const e164 = await sendCode(phone);
      router.push({ pathname: '/verify', params: { phone: e164 } });
    } catch (e) {
      setError(sendError(e));
    } finally {
      setSending(false);
    }
  }

  const newUser = intent === 'new';

  return (
    <Screen
      header={
        <AppBar
          title={newUser ? 'Create account' : 'Sign in'}
          subtitle="Sri Lanka produce market"
          onBack={router.canGoBack() ? router.back : undefined}
        />
      }
    >
      <Field
        label="Mobile number"
        value={phone}
        onChangeText={(v) => {
          setPhone(v);
          setError(null);
        }}
        onBlur={() => setTouched(true)}
        placeholder="07_ ___ ____"
        keyboardType="phone-pad"
        autoComplete="tel"
        maxLength={13}
        error={touched || phone.replace(/\D/g, '').length >= 10 ? problem : null}
        hint={
          DEMO_SIGN_IN
            ? t('Demo: no SMS is sent. On the next screen enter the code {code}.', { code: DEMO_CODE })
            : 'We send a 6-digit code by SMS. Standard SMS charges apply.'
        }
      />

      <Button title="Send code" onPress={onSend} disabled={!valid} loading={sending} />

      {error ? (
        <Card style={styles.alertCard}>
          <Text style={[type.heading, { color: color.alert }]}>{error}</Text>
          <Text style={[type.body, { color: color.muted, marginTop: 6 }]}>
            No SMS after 2 minutes? Call 0112 000 000, or ask any registered field officer to sign you in at the
            collection centre.
          </Text>
        </Card>
      ) : (
        <Card style={styles.helpCard}>
          <Text style={[type.heading, { color: color.ink }]}>Using someone else’s phone?</Text>
          <Text style={[type.body, { color: color.muted, marginTop: 6 }]}>
            {'Enter the farmer’s own number. The account and every payment belong to that number, whoever is holding the phone.'}
          </Text>
        </Card>
      )}

      <View style={{ marginTop: 8 }}>
        <Divider />
        <Text style={[type.body, { color: color.muted, marginBottom: 10 }]}>
          {newUser ? 'Already registered? Enter the same number — you will be signed in.' : 'New to the app? Enter your number — we set up your account after the code.'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  helpCard: { paddingVertical: 14, paddingHorizontal: 16 },
  alertCard: { paddingVertical: 14, paddingHorizontal: 16, borderColor: color.alertBorder, backgroundColor: color.alertBg },
});
