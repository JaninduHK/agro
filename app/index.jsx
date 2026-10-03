// S00a Splash — Athuraliya   (Entry - Onboarding v3: Splash, Splash offline)
// Not an interstitial: it resolves the session and routes by role —
//   no session            → /welcome
//   session, no profile   → /register   (also: registration started but not finished)
//   session with profile  → role home, by users.role
// and it is where a lost connection is reported before any task is attempted
// (NFR-09). "Continue offline" works because Firestore keeps its cache on the
// phone (see firebase.js).
// <Redirect /> replaces this route, so Back never returns here.
import { Feather } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Card from '../components/Card';
import { CenterGlow, LanguagePill, LogoTile } from '../components/Onboarding';
import Text from '../components/Text';
import { useAuth } from '../lib/auth';
import { ROLE_HOME } from '../lib/firestore';
import { useI18n } from '../lib/i18n';
import { checkOnline } from '../lib/network';
import { color, font, radius, type } from '../theme';

const OFFLINE_ABILITIES = [
  { ok: true, text: 'Read saved listings and offers' },
  { ok: true, text: 'Call a buyer or transporter' },
  { ok: false, text: 'Accept an offer — needs internet' },
];

function Offline({ onRetry, onContinue }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.offlinePage, { paddingTop: insets.top + 6 }]}>
      <StatusBar style="dark" />
      <View style={styles.topRow}>
        <LogoTile bordered />
        <LanguagePill />
      </View>
      <View style={styles.offlineBody}>
        <View style={styles.offlineIcon}>
          <Feather name="wifi-off" size={42} color={color.alert} />
        </View>
        <View style={styles.offlinePill}>
          <Text style={styles.offlinePillText}>No internet connection</Text>
        </View>
        <Text style={[type.hero, { color: color.ink, marginTop: 12 }]}>We can’t reach the market right now</Text>
        <Text style={[type.body, { color: color.muted, marginTop: 10 }]}>
          Nothing has been lost. Your listings, offers and payments are safe.
        </Text>
        <Card padding={18} style={{ marginTop: 22 }}>
          <Text style={styles.overline}>Still works offline</Text>
          {OFFLINE_ABILITIES.map((a) => (
            <View key={a.text} style={styles.ability}>
              <View style={[styles.abilityMark, { backgroundColor: a.ok ? color.fieldLight : color.surface }]}>
                <Feather name={a.ok ? 'check' : 'x'} size={14} color={a.ok ? color.field : '#5A6158'} />
              </View>
              <Text style={[type.body, { fontSize: 14.5, color: a.ok ? color.ink : '#5A6158', flex: 1 }]}>{a.text}</Text>
            </View>
          ))}
        </Card>
      </View>
      <View style={[styles.offlineActions, { paddingBottom: insets.bottom + 28 }]}>
        <Button title="Try again" onPress={onRetry} />
        <Button title="Continue offline" variant="ghost" onPress={onContinue} />
      </View>
    </View>
  );
}

export default function Splash() {
  const { status, profile } = useAuth();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
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

  if (network === 'offline') return <Offline onRetry={probe} onContinue={() => setNetwork('continue')} />;

  if (network !== 'checking') {
    if (status === 'signedOut') return <Redirect href="/welcome" />;
    if (status === 'noProfile') return <Redirect href="/register" />;
    if (status === 'ready') return <Redirect href={ROLE_HOME[profile.role] ?? '/welcome'} />;
  }

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <View style={styles.rings} pointerEvents="none">
        {[520, 400, 290].map((d, i) => (
          <View
            key={d}
            style={[styles.ring, { width: d, height: d, borderRadius: d / 2, borderColor: `rgba(183,227,107,${[0.08, 0.13, 0.18][i]})` }]}
          />
        ))}
        <CenterGlow size={300} style={{ position: 'absolute' }} />
      </View>

      <View style={styles.centre}>
        <LogoTile size="splash" />
        <Text style={[type.hero, styles.tagline]}>{t('Grown here.\nSold fairly.')}</Text>
        <Text style={[type.body, styles.sub]}>Sri Lanka’s direct produce market</Text>
      </View>

      <View style={[styles.loading, { paddingBottom: insets.bottom + 44 }]}>
        <View style={styles.track}>
          <View style={styles.bar} />
        </View>
        <Text style={styles.loadingText}>{t('splash.loading')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.forest },
  rings: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', top: '-12%' },
  ring: { position: 'absolute', borderWidth: 1 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  tagline: { color: color.paper, textAlign: 'center', marginTop: 30 },
  sub: { color: 'rgba(255,255,255,0.72)', textAlign: 'center', marginTop: 10 },
  loading: { paddingHorizontal: 32, alignItems: 'center', gap: 14 },
  track: { alignSelf: 'stretch', height: 6, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  bar: { width: '62%', height: '100%', borderRadius: radius.pill, backgroundColor: color.lime },
  loadingText: { fontFamily: font.medium, fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.7)' },

  offlinePage: { flex: 1, backgroundColor: color.canvas },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  offlineBody: { flex: 1, paddingHorizontal: 24, paddingTop: 26 },
  offlineIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: color.alertBg,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  offlinePill: { alignSelf: 'flex-start', marginTop: 26, backgroundColor: color.alertBg, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 12 },
  offlinePillText: { fontFamily: font.bold, fontSize: 12.5, lineHeight: 16, color: color.alertText },
  overline: { fontFamily: font.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.96, textTransform: 'uppercase', color: color.muted },
  ability: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  abilityMark: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  offlineActions: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
});
