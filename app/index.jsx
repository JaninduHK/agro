// S00a Splash — Karanayaka
// Not an interstitial: it resolves the session and routes by role —
//   no session            → /welcome
//   session, no profile   → /register   (also: registration started but not finished)
//   session with profile  → role home, by users.role
// and it is where a lost connection is reported before any task is attempted
// (NFR-09). "Continue without internet" works because Firestore keeps its
// cache on the phone (see firebase.js).
// <Redirect /> replaces this route, so Back never returns here.
import { Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Button from '../components/Button';
import Text from '../components/Text';
import { useAuth } from '../lib/auth';
import { ROLE_HOME } from '../lib/firestore';
import { useI18n } from '../lib/i18n';
import { checkOnline } from '../lib/network';
import { color, radius, type } from '../theme';

export default function Splash() {
  const { status, profile } = useAuth();
  const { t } = useI18n();
  const [network, setNetwork] = useState('checking'); // checking | online | offline | continue

  const probe = useCallback(() => {
    setNetwork('checking');
    checkOnline().then((ok) => setNetwork(ok ? 'online' : 'offline'));
  }, []);

  useEffect(() => {
    let alive = true;
    checkOnline().then((ok) => alive && setNetwork(ok ? 'online' : 'offline'));
    return () => {
      alive = false;
    };
  }, []);

  if (network === 'offline') {
    return (
      <View style={styles.page}>
        <Image source={require('../assets/agro-logo.png')} style={[styles.logoSmall, { opacity: 0.45 }]} resizeMode="contain" />
        <Text style={[type.title, styles.center, { marginTop: 20, color: color.ink }]}>Cannot reach the market</Text>
        <Text style={[type.body, styles.center, { marginTop: 8, color: color.muted }]}>
          Your phone has no internet connection. Nothing has been lost — your listings and payments are safe.
        </Text>
        <View style={styles.actions}>
          <Button title="Try again" onPress={probe} />
          <Button title="Continue without internet" variant="secondary" onPress={() => setNetwork('continue')} />
        </View>
        <Text style={[type.caption, styles.center, { marginTop: 14, color: color.muted }]}>
          Without internet you can read saved information and make phone calls, but cannot accept offers.
        </Text>
      </View>
    );
  }

  if (network !== 'checking') {
    if (status === 'signedOut') return <Redirect href="/welcome" />;
    if (status === 'noProfile') return <Redirect href="/register" />;
    if (status === 'ready') return <Redirect href={ROLE_HOME[profile.role] ?? '/welcome'} />;
  }

  return (
    <View style={styles.page}>
      <Image source={require('../assets/agro-logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={[type.heading, styles.tagline]}>{t('app.tagline')}</Text>
      <View style={styles.track}>
        <View style={styles.bar} />
      </View>
      <Text style={[type.caption, styles.loading]}>{t('splash.loading')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.canvas, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { width: 200, height: 200 },
  logoSmall: { width: 132, height: 132 },
  tagline: { color: color.muted, marginTop: 8 },
  track: { width: 160, height: 6, borderRadius: radius.pill, backgroundColor: color.line, marginTop: 32, overflow: 'hidden' },
  bar: { width: '45%', height: '100%', borderRadius: radius.pill, backgroundColor: color.field },
  loading: { color: color.muted, marginTop: 10 },
  center: { textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 22 },
});
