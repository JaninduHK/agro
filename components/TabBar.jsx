// Floating bottom nav (.nav in Prototype v3). Passed to expo-router <Tabs tabBar={...} />.
// Each tab's label and icon come from its screen options: tabBarLabel is an
// i18n key, tabBarIconName one of the icons below (the prototype's own paths).
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useI18n } from '../lib/i18n';
import { color, font, radius, shadow } from '../theme';
import Text from './Text';

const ICONS = {
  home: () => <Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  list: () => (
    <>
      <Rect x="3" y="4" width="18" height="16" rx="2" />
      <Path d="M7 9h10M7 13h7" />
    </>
  ),
  inbox: () => (
    <>
      <Path d="M4 7h16v12H4z" />
      <Path d="M8 7V5h8v2" />
    </>
  ),
  'credit-card': () => (
    <>
      <Circle cx="12" cy="12" r="8" />
      <Path d="M12 8v8M9.5 10h5M9.5 14h5" />
    </>
  ),
  search: () => (
    <>
      <Circle cx="11" cy="11" r="7" />
      <Path d="M16.5 16.5L21 21" />
    </>
  ),
  package: () => (
    <>
      <Rect x="4" y="4" width="16" height="16" rx="2" />
      <Path d="M8 9h8M8 13h5" />
    </>
  ),
  user: () => (
    <>
      <Circle cx="12" cy="9" r="3.5" />
      <Path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
    </>
  ),
  truck: () => (
    <>
      <Rect x="3" y="7" width="13" height="10" rx="2" />
      <Path d="M16 10h3l2 3v4h-5z" />
      <Circle cx="7" cy="18" r="1.6" />
      <Circle cx="18" cy="18" r="1.6" />
    </>
  ),
};

function NavIcon({ name, stroke }) {
  const Shape = ICONS[name] ?? ICONS.home;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Shape />
    </Svg>
  );
}

export default function TabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

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
                <NavIcon name={options.tabBarIconName} stroke={active ? color.forest : color.muted} />
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{t(options.tabBarLabel)}</Text>
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
  // Always has a background: Android drops the corner radius if one is added later.
  icon: { paddingVertical: 3, paddingHorizontal: 16, borderRadius: 14, backgroundColor: color.paper, overflow: 'hidden' },
  iconActive: { backgroundColor: color.lime },
  label: { fontFamily: font.medium, fontSize: 12.5, lineHeight: 16, color: color.muted },
  labelActive: { fontFamily: font.bold, color: color.forest },
});
