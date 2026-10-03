// Centered empty / no-results state: icon, heading, explanation, then actions.
// Every empty state in the prototype says what to do next — pass the buttons as children.
//
//   <EmptyState icon="package" title="You have no listings yet" body="List what you have ready to sell…">
//     <Button title="List produce" onPress={...} />
//   </EmptyState>
import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { color, type } from '../theme';

export default function EmptyState({ icon = 'inbox', title, body, children }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Feather name={icon} size={28} color={color.field} />
      </View>
      <Text style={[type.title, styles.center]}>{title}</Text>
      {body ? <Text style={[type.body, styles.center, { color: color.muted }]}>{body}</Text> : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: color.fieldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  center: { textAlign: 'center', color: color.ink },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 12 },
});
