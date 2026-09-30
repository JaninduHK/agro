// Grid of tap-to-select tiles — crop, grade, quantity presets, filters.
//
//   <ChoiceGrid columns={2} value={crop} onChange={setCrop}
//     options={[{ id: 'beans', label: 'Beans' }, …]} />
// Pass `columns={0}` to lay tiles out in one row that shares the width.
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { color, font, radius, TAP_MIN } from '../theme';

export default function ChoiceGrid({ options, value, onChange, columns = 2, style }) {
  const basis = columns ? `${100 / columns - 2}%` : undefined;
  return (
    <View style={[styles.grid, style]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={[styles.tile, columns ? { flexBasis: basis } : styles.flex, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flex: { flex: 1 },
  tile: {
    flexGrow: 1,
    minHeight: TAP_MIN,
    borderWidth: 1,
    borderColor: color.lineSoft,
    backgroundColor: color.paper,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selected: { borderWidth: 2, borderColor: color.field, backgroundColor: color.fieldLight },
  label: { fontFamily: font.medium, fontSize: 15, lineHeight: 20, color: color.ink, textAlign: 'center' },
  labelSelected: { fontFamily: font.semibold },
});
