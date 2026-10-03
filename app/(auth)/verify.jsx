// S01a Enter code — Athuraliya
// Six boxes over one hidden input. 3 wrong codes locks sign-in for 15 minutes
// (Firebase enforces its own limit; this screen tells the user in plain words).
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Text from '../../components/Text';
import AppBar from '../../components/AppBar';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Screen from '../../components/Screen';
import { maskPhone, useAuth } from '../../lib/auth';
import { DEMO_CODE, DEMO_SIGN_IN } from '../../lib/demo';
import { useI18n } from '../../lib/i18n';
import { color, font, radius, type } from '../../theme';

const LENGTH = 6;
const RESEND_AFTER = 60;
const MAX_TRIES = 3;

export default function Verify() {
  const { phone } = useLocalSearchParams();
  const { status, sendCode, confirmCode } = useAuth();
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [wrong, setWrong] = useState(0);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [seconds, setSeconds] = useState(RESEND_AFTER);
  const input = useRef(null);

  // Android can verify the SMS by itself; once signed in, let the splash route onwards.
  useEffect(() => {
    if (status === 'noProfile' || status === 'ready') router.replace('/');
  }, [status]);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const locked = wrong >= MAX_TRIES;

  async function onConfirm() {
    setChecking(true);
    setError(null);
    try {
      await confirmCode(code);
      router.replace('/');
    } catch (e) {
      if (e?.code === 'auth/invalid-verification-code') {
        setWrong((w) => w + 1);
        setError('wrong');
      } else if (e?.code === 'auth/session-expired' || e?.code === 'auth/code-expired') {
        setError('That code has expired. Send a new code.');
      } else if (e?.code === 'auth/network-request-failed') {
        setError('The code could not be checked. Check your connection and try again.');
      } else if (e?.code === 'auth/operation-not-allowed') {
        // Demo sign-in needs Authentication → Sign-in method → Email/Password enabled.
        setError('Sign-in is not switched on for this app yet. It needs turning on in the Firebase console.');
      } else {
        // Keep the code visible: it is what a developer needs to fix it.
        setError(t('The code could not be checked ({code}). Try again.', { code: e?.code ?? 'unknown error' }));
      }
    } finally {
      setChecking(false);
    }
  }

  async function onResend() {
    setError(null);
    setCode('');
    setWrong(0);
    setSeconds(RESEND_AFTER);
    try {
      await sendCode(phone);
    } catch {
      setError('The code could not be sent. Try again in a minute.');
    }
  }

  const triesLeft = MAX_TRIES - wrong;
  const clock = `0:${String(Math.max(0, seconds)).padStart(2, '0')}`;

  return (
    <Screen header={<AppBar title="Enter code" subtitle={phone ? t('Sent to {phone}', { phone: maskPhone(phone) }) : undefined} onBack={router.back} />}>
      <Pressable onPress={() => input.current?.focus()} style={styles.boxes} accessibilityLabel="Enter the 6-digit code">
        {Array.from({ length: LENGTH }, (_, i) => {
          const filled = i < code.length;
          const bad = error === 'wrong';
          return (
            <View key={i} style={[styles.box, filled && styles.boxFilled, bad && styles.boxBad]}>
              <Text style={styles.digit}>{code[i] ?? ''}</Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={input}
        value={code}
        onChangeText={(v) => {
          setCode(v.replace(/\D/g, '').slice(0, LENGTH));
          if (error === 'wrong') setError(null);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={LENGTH}
        autoFocus
        style={styles.hidden}
        editable={!locked}
      />

      {error === 'wrong' ? (
        <Card style={styles.alertCard}>
          <Text style={[type.heading, { color: color.alert }]}>That code was not correct</Text>
          <Text style={[type.body, { color: color.ink, marginTop: 4 }]}>
            {locked ? t('Sign-in is locked for 15 minutes.') : triesLeft === 1 ? t('1 try left.') : t('{n} tries left.', { n: triesLeft })}
          </Text>
          <Text style={[type.caption, { color: color.muted, marginTop: 4 }]}>
            Check the newest SMS — an older code will not work.
          </Text>
        </Card>
      ) : (
        <Text style={[type.caption, { color: color.muted }]}>
          {DEMO_SIGN_IN
            ? t('Demo: no SMS is sent. Enter the code {code}.', { code: DEMO_CODE })
            : '6-digit code · usually arrives within 60 seconds'}
        </Text>
      )}
      {error && error !== 'wrong' ? <Text style={[type.caption, { color: color.alert }]}>{error}</Text> : null}

      <Button
        title={error === 'wrong' ? 'Try again' : 'Confirm'}
        onPress={onConfirm}
        disabled={code.length !== LENGTH || locked}
        loading={checking}
      />

      {seconds > 0 ? (
        <Text style={[type.body, styles.center]}>{t('Send the code again in {clock}', { clock })}</Text>
      ) : (
        <Button title="Send a new code" variant="secondary" onPress={onResend} />
      )}
      <Button title="Change phone number" variant="secondary" onPress={router.back} />

      <Card style={styles.help}>
        <Text style={[type.heading, { color: color.ink }]}>{locked ? 'After 3 wrong codes' : 'Not getting the SMS?'}</Text>
        <Text style={[type.body, { color: color.muted, marginTop: 4 }]}>
          {locked
            ? 'Sign-in locks for 15 minutes. Call 0112 000 000 or ask a field officer — no money or listing is affected.'
            : 'Call 0112 000 000 or ask a registered field officer to sign you in.'}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  boxes: { flexDirection: 'row', gap: 8 },
  box: {
    flex: 1,
    height: 64,
    borderWidth: 1,
    borderColor: color.lineSoft,
    borderRadius: radius.input,
    backgroundColor: color.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: { borderWidth: 1.5, borderColor: color.ink },
  boxBad: { borderWidth: 1.5, borderColor: color.alert },
  digit: { fontFamily: font.semibold, fontSize: 24, lineHeight: 28, color: color.ink },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  alertCard: { paddingVertical: 14, paddingHorizontal: 16, borderColor: color.alertBorder, backgroundColor: color.alertBg },
  help: { paddingVertical: 14, paddingHorizontal: 16 },
  center: { textAlign: 'center', color: color.muted },
});
