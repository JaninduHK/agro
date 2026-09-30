// .btn (primary, ink) and .btn2 (secondary, outlined).
//
//   <Button title="Accept offer" onPress={accept} />
//   <Button title="Compare 3 offers" variant="secondary" />
//   <Button title="Weight is wrong" variant="danger" compact />
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import Text from './Text';
import { color, radius, shadow, TAP_MIN, type } from '../theme';

const variants = {
  primary:   { bg: color.ink,   pressed: '#2A2E22', text: color.paper, border: null },
  secondary: { bg: color.paper, pressed: color.surface, text: color.ink, border: color.lineStrong },
  danger:    { bg: color.paper, pressed: color.alertBg, text: color.alert, border: color.alert },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  compact = false, // 52 high, 15px — for buttons side by side inside a card
  disabled = false,
  loading = false,
  style,
}) {
  const v = variants[variant];
  const inactive = disabled || loading;
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
        variant === 'primary' && !disabled && shadow.btn,
        disabled && (variant === 'primary' ? styles.disabledPrimary : styles.disabled),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <Text
          style={[
            type.button,
            compact && styles.compactText,
            { color: disabled && variant === 'primary' ? color.disabledText : v.text },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  compact: { minHeight: TAP_MIN },
  compactText: { fontSize: 15 },
  // .btn with background #E7E5DE in the prototype: visibly "not yet", still readable
  disabledPrimary: { backgroundColor: color.disabledBg },
  disabled: { opacity: 0.45 },
});
