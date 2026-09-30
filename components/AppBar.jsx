// Green app bar with the language toggle (.appbar + .lang in the prototype).
// Draws under the status bar, so it owns the top safe-area inset.
//
//   <AppBar title="Offers" subtitle="Beans 200 kg · 3 offers" onBack={router.back} />
//   <AppBar eyebrow="Good morning" title="Sunil Perera" />
//   <AppBar title="Create account" attached />   // a rail or strip sits directly below
import { Feather } from '@expo/vector-icons';
import { updateDoc } from '@react-native-firebase/firestore';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { COL, ref } from '../lib/firestore';
import { useI18n } from '../lib/i18n';
import { color, font, sinhalaFont, TAP_MIN, type } from '../theme';

export function LanguageToggle() {
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
            <Text style={[styles.langText, code === 'si' && styles.sinhala, active && styles.langTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AppBar({ title, subtitle, eyebrow, onBack, attached = false, right }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }, !attached && styles.rounded]}>
      <View style={styles.left}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
            <Feather name="arrow-left" size={24} color={color.paper} />
          </Pressable>
        )}
        <View style={styles.titles}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>
      {right ?? <LanguageToggle />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: color.field,
    paddingHorizontal: 18,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 1,
  },
  rounded: { borderBottomLeftRadius: 26, borderBottomRightRadius: 26, paddingBottom: 20 },
  left: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { minHeight: TAP_MIN, justifyContent: 'center' },
  titles: { flex: 1, minWidth: 0 },
  eyebrow: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: color.onField },
  title: { ...type.appbar, color: color.paper },
  subtitle: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, marginTop: 2, color: color.onField },

  lang: {
    flexDirection: 'row',
    padding: 2,
    minHeight: TAP_MIN,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 16,
  },
  langItem: { minWidth: 48, paddingHorizontal: 7, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  langItemActive: { backgroundColor: color.paper },
  langText: { fontFamily: font.semibold, fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  langTextActive: { color: color.field },
  sinhala: { fontFamily: sinhalaFont[font.semibold] },
});
