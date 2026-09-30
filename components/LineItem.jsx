// Money breakdown rows and the big "You receive" figure.
// Amounts are passed as numbers and formatted here, so they are always
// formatLKR and always ink — never coloured.
//
//   <LineItem label="Offer total" amount={38400} />
//   <LineItem label="Platform fee (3%)" amount={1150} deduction />
//   <LineItem label="Transport" value="Paid by buyer" />
//   <MoneyFigure label="You receive" amount={37250} detail="Paid by Friday, 18 September" />
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { formatDeduction, formatLKR } from '../lib/money';
import { color, font, type } from '../theme';

export function LineItem({ label, amount, value, deduction = false, strong = false, style }) {
  const shown = value ?? (deduction ? formatDeduction(amount) : formatLKR(amount));
  return (
    <View style={[styles.row, style]}>
      <Text style={[type.body, styles.label, strong && styles.strong]}>{label}</Text>
      <Text style={[type.body, styles.value, strong && styles.strong]}>{shown}</Text>
    </View>
  );
}

export function MoneyFigure({ label, amount, detail, size = 'display', style }) {
  return (
    <View style={style}>
      {label ? <Text style={[type.label, { color: color.muted }]}>{label}</Text> : null}
      <Text style={[type.display, styles.figure, size === 'medium' && styles.medium]}>{formatLKR(amount)}</Text>
      {detail ? <Text style={[type.body, styles.detail]}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginTop: 6 },
  label: { color: color.muted, flex: 1 },
  value: { color: color.ink, textAlign: 'right' },
  strong: { fontFamily: font.semibold, color: color.ink },
  figure: { color: color.ink, marginTop: 2 },
  medium: { fontSize: 25, lineHeight: 29 },
  detail: { color: color.ink, marginTop: 4 },
});
