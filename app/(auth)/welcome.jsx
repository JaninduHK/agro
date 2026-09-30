// S00b Welcome — Karanayaka
// One screen, not a carousel. Each statement answers a finding: price shown before
// collection (F02), money held until delivery (T01), language on every screen (NFR-04).
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LanguageToggle } from '../../components/AppBar';
import Button from '../../components/Button';
import { color, font, radius, shadow, sinhalaFont, type } from '../../theme';

const BENEFITS = [
  { icon: 'eye', title: 'You see the price first', detail: 'Every offer shows what you receive after fees' },
  { icon: 'shield', title: 'Money is held until delivery', detail: 'Paid out only once produce is confirmed' },
  { icon: 'globe', title: 'සිංහල or English, any time', detail: 'Switch from the top of every screen', sinhala: true },
];

export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.page}>
      <View style={[styles.hero, { paddingTop: insets.top + 4 }]}>
        <View style={styles.langRow}>
          <LanguageToggle />
        </View>
        <View style={styles.logoBox}>
          <Image source={require('../../assets/agro-logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.headline}>Sell direct. Buy fresh.</Text>
        <Text style={styles.lede}>
          Farmers, buyers and transporters in one market — with the price agreed before collection.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {BENEFITS.map((b) => (
          <View key={b.title} style={styles.row}>
            <View style={styles.icon}>
              <Feather name={b.icon} size={16} color={color.field} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { fontFamily: b.sinhala ? sinhalaFont[font.medium] : font.medium, color: color.ink }]}>
                {b.title}
              </Text>
              <Text style={[type.caption, { color: color.muted, marginTop: 2 }]}>{b.detail}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Button title="Create an account" onPress={() => router.push('/sign-in?intent=new')} />
        <Button title="I already have an account" variant="secondary" onPress={() => router.push('/sign-in')} />
        <Text style={[type.caption, styles.center]}>
          Using someone else’s phone? Either choice works — the account stays with the farmer’s own number.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.canvas },
  hero: {
    backgroundColor: color.field,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 24,
    paddingBottom: 28,
    alignItems: 'center',
  },
  langRow: { alignSelf: 'stretch', alignItems: 'flex-end', marginRight: -8 },
  logoBox: {
    width: 112,
    height: 112,
    borderRadius: 30,
    backgroundColor: color.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  logo: { width: 96, height: 96 },
  headline: { fontFamily: font.semibold, fontSize: 26, lineHeight: 32, color: color.paper, marginTop: 16 },
  lede: { ...type.body, color: 'rgba(255,255,255,0.88)', textAlign: 'center', marginTop: 8 },
  list: { gap: 12, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: color.paper,
    borderWidth: 1,
    borderColor: color.lineFaint,
    borderRadius: radius.row,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.fieldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    backgroundColor: color.paper,
    borderTopWidth: 1,
    borderTopColor: color.lineFaint,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 14,
    paddingHorizontal: 16,
    gap: 10,
    ...shadow.nav,
  },
  center: { textAlign: 'center', color: color.muted },
});
