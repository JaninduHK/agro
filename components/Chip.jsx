// Status pill (.chip). Tone carries meaning — pick by what the state IS:
//   done     green   — Done, Live, Verified, Paid
//   time     amber   — ONLY time pressure: "Ends in 4 hours", "Happening now"
//   alert    red     — Not verified, Disputed
//   neutral  grey    — Not yet, Pending, Draft, Saved
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { color, radius, type } from '../theme';

const tones = {
  done:    { bg: color.fieldLight, fg: color.fieldDark },
  time:    { bg: color.amberBg,    fg: color.amberText },
  alert:   { bg: color.alertChip,  fg: color.alertText },
  neutral: { bg: color.surface,    fg: color.muted },
};

export default function Chip({ label, tone = 'neutral', style }) {
  const t = tones[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }, style]}>
      <Text style={[type.chip, { color: t.fg }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexShrink: 0,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
});
