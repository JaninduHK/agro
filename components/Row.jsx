// Compact list row (.rowc) — "Also happening", payment history, jobs.
//
//   <Row title="Beans 200 kg · listed" subtitle="Tuesday · seen by 3 buyers"
//        right={<Chip label="Live" tone="done" />} onPress={...} />
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { color, radius, type } from '../theme';

export default function Row({ title, subtitle, left, right, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
    >
      {left}
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={[type.caption, styles.subtitle]}>{subtitle}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: color.paper,
    borderWidth: 1,
    borderColor: color.lineFaint,
    borderRadius: radius.row,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
  },
  pressed: { backgroundColor: color.surface },
  text: { flex: 1 },
  title: { ...type.heading, fontSize: 15, lineHeight: 20, color: color.ink },
  subtitle: { color: color.muted, marginTop: 2 },
});
