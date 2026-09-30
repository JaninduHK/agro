// Boxed message with a title. Tone follows the colour rules:
//   neutral  grey    guidance, "what happens next"
//   field    green   reassurance: money held, saved
//   time     orange  ONLY time pressure / a figure to double-check before it counts
//   alert    red     errors and what to do about them
import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { color, radius, type } from '../theme';

const tones = {
  neutral: { bg: color.surface,    border: color.lineSoft,      title: color.ink,         icon: null },
  field:   { bg: color.fieldLight, border: color.fieldBorder,   title: color.field,       icon: 'shield' },
  time:    { bg: color.harvestBg,  border: color.harvestBorder, title: color.harvestText, icon: 'alert-triangle' },
  alert:   { bg: color.alertBg,    border: color.alertBorder,   title: color.alert,       icon: 'alert-circle' },
};

export default function Notice({ tone = 'neutral', title, children, style }) {
  const t = tones[tone];
  return (
    <View style={[styles.box, { backgroundColor: t.bg, borderColor: t.border }, style]}>
      {t.icon ? <Feather name={t.icon} size={18} color={t.title} style={styles.icon} /> : null}
      <View style={styles.text}>
        {title ? <Text style={[styles.title, { color: t.title }]}>{title}</Text> : null}
        {typeof children === 'string' ? (
          <Text style={[type.caption, { color: color.ink, marginTop: title ? 3 : 0 }]}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: radius.input, paddingVertical: 12, paddingHorizontal: 14 },
  icon: { marginTop: 1 },
  text: { flex: 1 },
  title: { ...type.heading, fontSize: 15, lineHeight: 20 },
});
