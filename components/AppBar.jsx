// Dark-green app bar with the language toggle (.appbar + .lang in Prototype v3).
// Draws under the status bar, so it owns the top safe-area inset.
//
//   <AppBar title="Offers" subtitle="Beans 200 kg · 3 offers" onBack={router.back} />
//   <AppBar eyebrow="Good morning" title="Sunil Perera" />
//   <AppBar title="Create account" attached />   // a rail or strip sits directly below
//   <AppBar title="Payment not completed" tone="alert" />   // red: offline, failed payment
import { Feather } from '@expo/vector-icons';
import { updateDoc } from '@react-native-firebase/firestore';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useAuth } from '../lib/auth';
import { COL, ref } from '../lib/firestore';
import { useI18n } from '../lib/i18n';
import { color, font, radius, sinhalaFont, TAP_MIN, type } from '../theme';
import Text from './Text';

// The lime glow in the top-right corner of every green header:
// radial-gradient(90% 120% at 100% 0%, rgba(183,227,107,.22), transparent 60%)
export function Glow({ opacity = 0.22 }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id="glow" cx="100%" cy="0%" rx="90%" ry="120%" gradientUnits="objectBoundingBox">
          <Stop offset="0" stopColor={color.lime} stopOpacity={opacity} />
          <Stop offset="0.6" stopColor={color.lime} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow)" />
    </Svg>
  );
}

export function LanguageToggle({ activeColor = color.forest }) {
  const { language, setLanguage } = useI18n();
  const { user } = useAuth();

  // Remembered on the account once there is one, so it follows the farmer to any phone.
  function choose(code) {
    setLanguage(code);
    if (user) updateDoc(ref(COL.users, user.uid), { language: code }).catch(() => {});
  }
  return (
    <View style={styles.lang} accessibilityRole="radiogroup">
      {[
        ['si', 'සිං'],
        ['en', 'EN'],
      ].map(([code, label]) => {
        const active = language === code;
        return (
          <Pressable
            key={code}
            onPress={() => choose(code)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[styles.langItem, active && styles.langItemActive]}
          >
            <Text style={[styles.langText, code === 'si' && styles.sinhala, active && { color: activeColor }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AppBar({ title, subtitle, eyebrow, onBack, onProfile, attached = false, tone = 'default', right }) {
  const insets = useSafeAreaInsets();
  const alert = tone === 'alert';
  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top + 8, backgroundColor: alert ? color.alert : color.forest },
        !attached && styles.rounded,
      ]}
    >
      {alert ? null : <Glow />}
      <View style={styles.left}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
            <Feather name="chevron-left" size={26} color={color.paper} />
          </Pressable>
        )}
        <View style={styles.titles}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={[styles.title, subtitle && onBack && styles.titleCompact]} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>
      {onProfile ? (
        <Pressable onPress={onProfile} hitSlop={8} accessibilityRole="button" accessibilityLabel="Account" style={styles.profile}>
          <Feather name="user" size={22} color={color.paper} />
        </Pressable>
      ) : null}
      {right ?? <LanguageToggle activeColor={alert ? color.alert : color.forest} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 1,
    overflow: 'hidden',
  },
  rounded: { borderBottomLeftRadius: 26, borderBottomRightRadius: 26, paddingBottom: 20 },
  left: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { minHeight: TAP_MIN, justifyContent: 'center', marginLeft: -4 },
  profile: {
    width: TAP_MIN,
    height: TAP_MIN,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  titles: { flex: 1, minWidth: 0 },
  eyebrow: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: color.onField },
  title: { ...type.appbar, color: color.paper },
  titleCompact: { fontSize: 20, lineHeight: 26 },
  subtitle: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, marginTop: 2, color: color.onField },

  lang: {
    flexDirection: 'row',
    padding: 2,
    minHeight: TAP_MIN,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
  },
  langItem: { minWidth: 48, paddingHorizontal: 7, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  langItemActive: { backgroundColor: color.paper },
  langText: { fontFamily: font.semibold, fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  sinhala: { fontFamily: sinhalaFont[font.semibold] },
});
