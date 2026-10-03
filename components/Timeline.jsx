// Vertical status timeline — Collection & payout, Track order, Problem reported.
// Put it inside a <Card padding={...}>; it draws no background of its own.
//
//   <Timeline steps={[
//     { title: 'Offer agreed', detail: 'Wed 13 Sep, 9.42 am', state: 'done', chip: 'Done' },
//     { title: 'Collected — check the weight', state: 'now', chip: 'Happening now', children: <WeightPanel/> },
//     { title: 'Payment released', detail: 'Friday, 18 September', state: 'todo', chip: 'Not yet' },
//   ]} />
//
// state: 'done' (green, tick) | 'now' (orange ring — time pressure) | 'todo' (grey)
import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { color, type } from '../theme';
import Chip from './Chip';

const chipTone = { done: 'done', now: 'time', todo: 'neutral' };

function Marker({ state }) {
  if (state === 'done') {
    return (
      <View style={[styles.dot, { borderColor: color.field, backgroundColor: color.field }]}>
        <Feather name="check" size={14} color={color.paper} />
      </View>
    );
  }
  if (state === 'now') {
    return (
      <View style={[styles.dot, { borderColor: color.harvest }]}>
        <View style={styles.pulse} />
      </View>
    );
  }
  return <View style={[styles.dot, { borderColor: color.line }]} />;
}

export default function Timeline({ steps }) {
  return (
    <View>
      {steps.map((s, i) => (
        <View key={s.key ?? i} style={styles.step}>
          <View style={styles.gutter}>
            <Marker state={s.state} />
            <View style={[styles.line, { backgroundColor: s.state === 'done' ? color.field : color.line }]} />
          </View>
          <View style={styles.body}>
            <View style={styles.head}>
              <Text style={styles.title}>{s.title}</Text>
              {s.chip ? <Chip label={s.chip} tone={chipTone[s.state]} /> : null}
            </View>
            {s.detail ? <Text style={[type.caption, styles.detail]}>{s.detail}</Text> : null}
            {s.children}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: 12 },
  gutter: { width: 24, alignItems: 'center' },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: color.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.harvest },
  line: { flex: 1, width: 2, minHeight: 14 },
  body: { flex: 1, paddingBottom: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { ...type.heading, fontSize: 15, lineHeight: 20, color: color.ink, flex: 1 },
  detail: { color: color.muted, marginTop: 3 },
});
