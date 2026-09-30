// Underlined tabs under the app bar — "Live (2) | Sold (6) | Drafts (1)".
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { color, font, TAP_MIN } from '../theme';

export default function TopTabs({ tabs, value, onChange }) {
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.tab, active && styles.active]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: color.paper, borderBottomWidth: 1, borderBottomColor: color.lineFaint },
  tab: {
    flex: 1,
    minHeight: TAP_MIN,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  active: { borderBottomColor: color.field },
  label: { fontFamily: font.medium, fontSize: 15, lineHeight: 20, color: color.muted },
  labelActive: { fontFamily: font.semibold, color: color.field },
});
