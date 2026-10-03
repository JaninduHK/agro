// Pieces shared by the entry screens of "Entry - Onboarding v3": splash, offline
// splash, welcome and role selection. These screens have no app bar — a logo
// tile or back button on the left, one language pill on the right.
import { Feather } from '@expo/vector-icons';
import { updateDoc } from '@react-native-firebase/firestore';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useAuth } from '../lib/auth';
import { COL, ref } from '../lib/firestore';
import { useI18n } from '../lib/i18n';
import { color, font, radius, sinhalaFont, TAP_MIN } from '../theme';
import Text from './Text';

// One pill that switches to the OTHER language, named in that language.
export function LanguagePill({ dark = false }) {
  const { language, setLanguage } = useI18n();
  const { user } = useAuth();
  const next = language === 'en' ? 'si' : 'en';
  const fg = dark ? color.paper : color.ink;

  function toggle() {
    setLanguage(next);
    if (user) updateDoc(ref(COL.users, user.uid), { language: next }).catch(() => {});
  }

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={next === 'si' ? 'සිංහල' : 'English'}
      style={[styles.pill, dark ? styles.pillDark : styles.pillLight]}
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={dark ? color.paper : color.field} strokeWidth={2}>
        <Circle cx="12" cy="12" r="9" />
        <Path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
      </Svg>
      <Text style={[styles.pillText, { color: fg }, next === 'si' && { fontFamily: sinhalaFont[font.semibold] }]}>
        {next === 'si' ? 'සිංහල' : 'English'}
      </Text>
    </Pressable>
  );
}

// Round white button with a chevron, top-left of role selection.
export function BackButton({ onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Back" style={styles.iconButton}>
      <Feather name="chevron-left" size={24} color={color.ink} />
    </Pressable>
  );
}

// The logo on a white tile. `size` 'bar' = the small tile in a top row.
export function LogoTile({ size = 'bar', bordered = false }) {
  const large = size === 'splash';
  return (
    <View style={[large ? styles.logoLarge : styles.logoBar, bordered && styles.logoBordered]}>
      <Image
        source={require('../assets/agro-logo.png')}
        // larger than the tile and cropped by it, as in the prototype (object-fit: cover)
        style={large ? { width: 230, height: 230 } : { width: 120, height: 120 }}
        resizeMode="cover"
      />
    </View>
  );
}

// Soft lime glow, centred on its box.
export function CenterGlow({ size = 300, opacity = 0.22, style }) {
  return (
    <Svg width={size} height={size} style={style} pointerEvents="none">
      <Defs>
        <RadialGradient id="cg" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color.lime} stopOpacity={opacity} />
          <Stop offset="0.65" stopColor={color.lime} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill="url(#cg)" />
    </Svg>
  );
}

// Role artwork from the prototype: sprout, shopping bag, lorry.
const ROLE_ART = {
  farmer: { bg: color.fieldLight, stroke: color.field },
  buyer: { bg: color.amberBg, stroke: color.amberIcon },
  transporter: { bg: color.skyBg, stroke: color.skyIcon },
};

export function RoleIcon({ role }) {
  const art = ROLE_ART[role];
  return (
    <View style={[styles.roleTile, { backgroundColor: art.bg }]}>
      <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={art.stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {role === 'farmer' ? (
          <>
            <Path d="M12 21V10" />
            <Path d="M12 13c-3.6 0-6-2.4-6-6 3.6 0 6 2.4 6 6z" />
            <Path d="M12 10c0-3.6 2.4-6 6-6 0 3.6-2.4 6-6 6z" />
            <Path d="M6 21h12" />
          </>
        ) : role === 'buyer' ? (
          <>
            <Path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
            <Path d="M9 11V7a3 3 0 0 1 6 0v4" />
          </>
        ) : (
          <>
            <Rect x="2" y="6" width="13" height="10" rx="2" />
            <Path d="M15 9h3.5l3.5 3.5V16h-7" />
            <Circle cx="6.5" cy="18" r="1.8" />
            <Circle cx="17.5" cy="18" r="1.8" />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: TAP_MIN,
    minHeight: TAP_MIN,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
  },
  pillLight: { backgroundColor: color.paper, borderColor: '#E4DFD2' },
  pillDark: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.22)' },
  pillText: { fontFamily: font.semibold, fontSize: 14 },
  iconButton: {
    width: TAP_MIN,
    height: TAP_MIN,
    borderRadius: radius.pill,
    backgroundColor: color.paper,
    borderWidth: 1,
    borderColor: '#E4DFD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBar: {
    width: 88,
    height: 44,
    borderRadius: 14,
    backgroundColor: color.paper,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLarge: {
    width: 148,
    height: 148,
    borderRadius: 44,
    backgroundColor: color.paper,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
  logoBordered: { borderWidth: 1, borderColor: '#E4DFD2' },
  roleTile: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
