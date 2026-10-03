// .btn (primary, forest green) and .btn2 (secondary, outlined) — Prototype v3.
//
//   <Button title="Accept offer" onPress={accept} />
//   <Button title="Compare 3 offers" variant="secondary" />
//   <Button title="Weight is wrong" variant="danger" compact />   // red outline
//   <Button title="Send report" variant="alert" />                // solid red
//   <Button title="Get started" icon="arrow-right" />
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { color, radius, shadow, TAP_MIN, type } from '../theme';
import Text from './Text';

const variants = {
  primary:   { bg: color.forest, pressed: color.forestPressed, text: color.paper, border: null, solid: true },
  alert:     { bg: color.alert,  pressed: color.alertText,     text: color.paper, border: null, solid: true },
  lime:      { bg: color.lime,   pressed: '#A6D455',           text: color.forest, border: null, solid: true },
  secondary: { bg: color.paper,  pressed: color.surface,       text: color.ink,   border: color.lineStrong },
  ghost:     { bg: 'transparent', pressed: color.surface,      text: color.forest, border: color.lineStrong },
  danger:    { bg: color.paper,  pressed: color.alertBg,       text: color.alert, border: color.alert },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  compact = false, // 52 high, 15px — for buttons side by side inside a card
  disabled = false,
  loading = false,
  icon,
  style,
}) {
  const v = variants[variant];
  const inactive = disabled || loading;
  const off = disabled && v.solid;
  const textColor = off ? color.disabledText : v.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: pressed ? v.pressed : v.bg },
        v.border && { borderWidth: 1.5, borderColor: v.border },
        v.solid && !disabled && variant !== 'lime' && shadow.btn,
        // .btn with background #E7E5DE in the prototype: visibly "not yet", still readable
        off && styles.off,
        disabled && !v.solid && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <>
          <Text style={[type.button, compact && styles.compactText, { color: textColor }]}>{title}</Text>
          {icon ? <Feather name={icon} size={20} color={textColor} /> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radius.control,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  compact: { minHeight: TAP_MIN },
  compactText: { fontSize: 15 },
  off: { backgroundColor: color.disabledBg },
  disabled: { opacity: 0.45 },
});
