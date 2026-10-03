// Large radio card: "The farmer — this is my own phone", role selection.
// `children` render only while selected — the role cards reveal their
// benefits at the moment someone picks them.
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { color, font, radius, TAP_MIN, type } from '../theme';

export default function OptionCard({ title, detail, icon, selected, onPress, error, tone = 'field', children }) {
  const alert = tone === 'alert';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={[styles.card, selected && (alert ? styles.selectedAlert : styles.selected), error && !selected && styles.error]}
    >
      {icon ? (
        <View style={[styles.iconBox, selected && { backgroundColor: color.paper }]}>
          <Feather name={icon} size={22} color={color.field} />
        </View>
      ) : null}
      <View style={[styles.radio, selected && (alert ? styles.radioOnAlert : styles.radioOn), icon && styles.radioRight]}>
        {selected ? <Feather name="check" size={14} color={color.paper} /> : null}
      </View>
      <View style={[styles.text, icon && { paddingRight: 32 }]}>
        <Text style={[detail ? type.heading : styles.plain, { color: color.ink }]}>{title}</Text>
        {detail ? <Text style={[type.body, styles.detail]}>{detail}</Text> : null}
        {selected && children ? <View style={styles.extra}>{children}</View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: color.lineSoft,
    backgroundColor: color.paper,
    borderRadius: radius.option,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    minHeight: TAP_MIN,
  },
  selected: { borderWidth: 2, borderColor: color.field, backgroundColor: color.fieldLight },
  selectedAlert: { borderWidth: 2, borderColor: color.alert, backgroundColor: color.alertBg },
  error: { borderColor: color.alertBorder },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: color.faint,
    backgroundColor: color.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOn: { borderColor: color.field, backgroundColor: color.field },
  radioOnAlert: { borderColor: color.alert, backgroundColor: color.alert },
  // with an icon, the radio moves to the right-hand edge as in the role cards
  radioRight: { position: 'absolute', right: 16, top: 16 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  detail: { color: color.muted, marginTop: 3 },
  // a title with no detail line reads as body text, as in Report a problem
  plain: { ...type.body, fontFamily: font.medium },
  extra: { marginTop: 10, gap: 4 },
});
