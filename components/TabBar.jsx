// Floating bottom nav (.nav). Passed to expo-router <Tabs tabBar={...} />.
// Each tab's label and icon come from its screen options: tabBarLabel is an
// i18n key, tabBarIconName a Feather icon name.
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../lib/i18n';
import { color, font, radius, shadow } from '../theme';

export default function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { t, scriptFont } = useI18n();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.nav}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const active = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!active && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={styles.item}
            >
              <View style={[styles.icon, active && styles.iconActive]}>
                <Feather name={options.tabBarIconName} size={22} color={active ? color.field : color.muted} />
              </View>
              <Text
                style={[
                  styles.label,
                  active && styles.labelActive,
                  { fontFamily: scriptFont(active ? font.bold : font.medium) },
                ]}
              >
                {t(options.tabBarLabel)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: color.canvas, paddingHorizontal: 12 },
  nav: {
    height: 68,
    backgroundColor: color.paper,
    borderWidth: 1,
    borderColor: color.lineFaint,
    borderRadius: radius.nav,
    flexDirection: 'row',
    paddingHorizontal: 4,
    ...shadow.nav,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  icon: { paddingVertical: 3, paddingHorizontal: 16, borderRadius: 12 },
  iconActive: { backgroundColor: color.fieldLight },
  label: { fontFamily: font.medium, fontSize: 12.5, lineHeight: 16, color: color.muted },
  labelActive: { fontFamily: font.bold, color: color.field },
});
