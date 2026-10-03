// Labelled text input (52 high, 14 radius). Red border and message on error.
//
//   <Field label="Mobile number" value={phone} onChangeText={setPhone}
//          keyboardType="phone-pad" placeholder="07_ ___ ____" error={err} />
//   <Field label="Quantity" suffix="kg" keyboardType="number-pad" … />
import { StyleSheet, TextInput, View } from 'react-native';
import Text from './Text';
import { color, font, radius, TAP_MIN, type } from '../theme';

export function FieldLabel({ children, style }) {
  return <Text style={[type.label, { color: color.ink }, style]}>{children}</Text>;
}

export default function Field({ label, suffix, error, hint, style, inputStyle, ...input }) {
  return (
    <View style={style}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <View style={[styles.box, label && { marginTop: 6 }, error && styles.boxError]}>
        <TextInput
          placeholderTextColor={color.faint}
          style={[styles.input, inputStyle]}
          accessibilityLabel={label}
          {...input}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={[type.caption, styles.error]}>{error}</Text> : null}
      {!error && hint ? <Text style={[type.caption, styles.hint]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: TAP_MIN,
    borderWidth: 1,
    borderColor: color.lineSoft,
    borderRadius: radius.input,
    backgroundColor: color.paper,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  boxError: { borderWidth: 1.5, borderColor: color.alert },
  input: { flex: 1, fontFamily: font.medium, fontSize: 16, color: color.ink, paddingVertical: 12 },
  suffix: { fontFamily: font.medium, fontSize: 16, color: color.muted },
  error: { color: color.alert, marginTop: 6 },
  hint: { color: color.muted, marginTop: 6 },
});
