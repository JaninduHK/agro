// − 10 kg + quantity control for buyer checkout.
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { color, font, radius, TAP_MIN } from '../theme';

export default function Stepper({ value, onChange, min = 1, max = Infinity, step = 1, unit = 'kg' }) {
  const set = (n) => onChange(Math.min(max, Math.max(min, n)));
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => set(value - step)}
        disabled={value <= min}
        accessibilityRole="button"
        accessibilityLabel={`Less ${unit}`}
        style={[styles.btn, value <= min && styles.off]}
      >
        <Feather name="minus" size={20} color={color.ink} />
      </Pressable>
      <Text style={styles.value} accessibilityLiveRegion="polite">{value} {unit}</Text>
      <Pressable
        onPress={() => set(value + step)}
        disabled={value >= max}
        accessibilityRole="button"
        accessibilityLabel={`More ${unit}`}
        style={[styles.btn, value >= max && styles.off]}
      >
        <Feather name="plus" size={20} color={color.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: {
    width: TAP_MIN,
    height: TAP_MIN,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: color.lineStrong,
    backgroundColor: color.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  off: { opacity: 0.4 },
  value: { fontFamily: font.semibold, fontSize: 17, color: color.ink, minWidth: 64, textAlign: 'center' },
});
