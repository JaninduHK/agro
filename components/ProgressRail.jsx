// "Step 2 of 3 · Who holds the phone" with the segmented bar underneath.
// Used by registration (3 steps) and create listing (4 steps).
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { useI18n } from '../lib/i18n';
import { color, font, radius, type } from '../theme';

export default function ProgressRail({ step, total, label }) {
  const { t, scriptFont } = useI18n();
  return (
    <View
      style={styles.rail}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: step }}
    >
      <View style={styles.head}>
        <Text style={[type.label, { color: color.ink, fontFamily: scriptFont(font.semibold) }]}>
          {t('common.stepOf', { n: step, total })}
        </Text>
        {label ? <Text style={[type.caption, { color: color.muted }]}>{label}</Text> : null}
      </View>
      <View style={styles.segments}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.segment, { backgroundColor: i < step ? color.field : color.line }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    backgroundColor: color.paper,
    borderBottomWidth: 1,
    borderBottomColor: color.lineFaint,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  segments: { flexDirection: 'row', gap: 6, marginTop: 8 },
  segment: { flex: 1, height: 6, borderRadius: radius.pill },
});
