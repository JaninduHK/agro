// S00b Welcome — Athuraliya   (Entry - Onboarding v3: Welcome)
// One screen, not a carousel. The three floating cards answer the findings the
// app is built on: the price shown before collection (F02), money held until
// delivery (T01), and the lorry booked for a known time.
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Button from '../../components/Button';
import { CenterGlow, LanguagePill, LogoTile } from '../../components/Onboarding';
import Text from '../../components/Text';
import { useI18n } from '../../lib/i18n';
import { formatLKR } from '../../lib/money';
import { color, font, type } from '../../theme';

function Floating({ style, children }) {
  return <View style={[styles.floating, style]}>{children}</View>;
}

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { t } = useI18n();
  // 452 of 800 in the prototype; scale with the phone but keep room for the cards.
  const heroHeight = Math.max(410, Math.min(480, Math.round(height * 0.565)));

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <View style={[styles.hero, { height: heroHeight, paddingTop: insets.top + 6 }]}>
        <CenterGlow size={300} opacity={0.28} style={styles.glow} />
        <View style={styles.ring} />
        <View style={styles.topRow}>
          <LogoTile />
          <LanguagePill dark />
        </View>

        <Floating style={{ top: insets.top + 64, left: 26, width: 190, transform: [{ rotate: '-4deg' }] }}>
          <Text style={styles.small}>{t('New offer · {buyer}', { buyer: 'Ranjith Stores' })}</Text>
          <Text style={styles.price}>
            {formatLKR(192)}
            <Text style={styles.perKg}> /kg</Text>
          </Text>
          <View style={styles.rule} />
          <Text style={styles.small}>You receive</Text>
          <Text style={styles.net}>{formatLKR(37250)}</Text>
        </Floating>

        <Floating style={{ top: insets.top + 162, left: 138, width: 196, transform: [{ rotate: '5deg' }] }}>
          <View style={styles.floatRow}>
            <View style={[styles.floatIcon, { backgroundColor: color.fieldLight, borderRadius: 17 }]}>
              <Feather name="check" size={16} color={color.field} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.floatTitle}>Payment held</Text>
              <Text style={styles.floatSub}>Released on delivery</Text>
            </View>
          </View>
        </Floating>

        <Floating style={{ top: insets.top + 264, left: 44, width: 204, transform: [{ rotate: '-2deg' }] }}>
          <View style={styles.floatRow}>
            <View style={[styles.floatIcon, { backgroundColor: color.amberBg }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color.amberIcon} strokeWidth={2.2} strokeLinecap="round">
                <Rect x="3" y="7" width="12" height="9" rx="2" />
                <Path d="M15 10h3l3 3v3h-6" />
                <Circle cx="7" cy="18" r="1.6" />
                <Circle cx="17.5" cy="18" r="1.6" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.floatTitle}>Lorry booked</Text>
              <Text style={styles.floatSub}>Wednesday · 7.00 am</Text>
            </View>
          </View>
        </Floating>
      </View>

      <View style={styles.copy}>
        <View style={styles.dots}>
          <View style={styles.dotOn} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.headline}>Sell direct.</Text>
        <Text style={[styles.headline, { color: color.field, marginTop: 0 }]}>Buy fresh.</Text>
        <Text style={[type.body, { color: color.muted, marginTop: 10 }]}>
          Farmers, buyers and transporters in one market — with the price agreed before collection.
        </Text>
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 26 }]}>
        <Button title="Get started" icon="arrow-right" onPress={() => router.push('/sign-in?intent=new')} />
        <Pressable onPress={() => router.push('/sign-in')} accessibilityRole="button" style={styles.signIn}>
          <Text style={styles.signInText}>{t('I already have an account ·')}</Text>
          <Text style={[styles.signInText, styles.signInLink]}>Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.canvas },
  hero: {
    backgroundColor: color.forest,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  glow: { position: 'absolute', right: -90, top: -60 },
  ring: {
    position: 'absolute',
    left: -60,
    bottom: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(183,227,107,0.18)',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  floating: {
    position: 'absolute',
    backgroundColor: color.paper,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  small: { fontFamily: font.medium, fontSize: 12, lineHeight: 17, color: color.muted },
  price: { fontFamily: font.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.6, color: color.ink, marginTop: 4 },
  perKg: { fontFamily: font.semibold, fontSize: 13, color: color.muted, letterSpacing: 0 },
  rule: { height: 1, backgroundColor: color.divider, marginVertical: 10 },
  net: { fontFamily: font.display, fontSize: 20, lineHeight: 26, letterSpacing: -0.5, color: color.ink },
  floatRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  floatIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  floatTitle: { fontFamily: font.bold, fontSize: 13.5, lineHeight: 18, color: color.ink },
  floatSub: { fontFamily: font.medium, fontSize: 12, lineHeight: 16, color: color.muted },

  copy: { flex: 1, paddingHorizontal: 24, paddingTop: 26 },
  dots: { flexDirection: 'row', gap: 6 },
  dotOn: { width: 22, height: 6, borderRadius: 3, backgroundColor: color.forest },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.lineStrong },
  headline: { fontFamily: font.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.85, color: color.ink, marginTop: 16 },

  actions: { paddingHorizontal: 20, gap: 8 },
  signIn: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  signInText: { fontFamily: font.semibold, fontSize: 15, color: color.ink },
  signInLink: { fontFamily: font.bold, color: color.field },
});
