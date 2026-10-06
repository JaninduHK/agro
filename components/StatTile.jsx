// Small "at a glance" tile: an icon, one figure and what it counts.
// Lay several out in a wrapping row; each takes half the width.
//
//   <StatTile icon="map-pin" tint="sky" value="2" label="Open jobs near you" onPress={…} />
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { color, radius, type } from '../theme';
import Text from './Text';

const tints = {
  field: { bg: color.fieldLight, fg: color.field },
  sky: { bg: color.skyBg, fg: color.skyIcon },
  lime: { bg: color.lime, fg: color.forest },
  neutral: { bg: color.surface, fg: color.muted },
};

export default function StatTile({ icon, tint = 'field', value, label, onPress }) {
  const c = tints[tint];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: c.bg }]}>
          <Feather name={icon} size={18} color={c.fg} />
        </View>
        {onPress ? <Feather name="chevron-right" size={18} color={color.faint} /> : null}
      </View>
      <Text style={[type.title, styles.value]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[type.caption, styles.label]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: color.paper,
    borderWidth: 1,
    borderColor: color.lineFaint,
    borderRadius: radius.row,
    padding: 14,
  },
  pressed: { backgroundColor: color.surface },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  value: { color: color.ink, marginTop: 10 },
  label: { color: color.muted, marginTop: 2 },
});
