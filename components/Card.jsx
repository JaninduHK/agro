// White rounded card (.card). Pass `padding` to override the default 16.
import { StyleSheet, View } from 'react-native';
import { color, radius, shadow } from '../theme';

export default function Card({ children, padding = 16, style }) {
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

// Thin rule between sections inside a card.
export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

// Grey inset panel inside a card — guidance, weight slips.
export function Inset({ children, style }) {
  return <View style={[styles.inset, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.paper,
    borderWidth: 1,
    borderColor: color.lineFaint,
    borderRadius: radius.card,
    ...shadow.card,
  },
  divider: { height: 1, backgroundColor: color.divider, marginVertical: 12 },
  inset: { backgroundColor: color.surface, borderRadius: radius.input, paddingVertical: 10, paddingHorizontal: 12 },
});
