// Page frame: canvas background, header slot, scrolling body (.scroll), footer slot.
//
//   <Screen header={<><AppBar title="Offers" attached /><OwnerStrip /></>}>
//     <Card>…</Card>
//   </Screen>
//
//   footer  white rounded action sheet with the screen's primary buttons
//   bar     flat strip pinned above a tab bar
// On a tab screen the tab bar floats over the page, so the body gets extra
// bottom padding (and `bar` a margin) to stay clear of it.
// Pass `scroll={false}` for layouts that manage their own list (FlatList).
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, radius, shadow } from '../theme';
import { useTabBarSpace } from './TabBar';

export default function Screen({ header, footer, bar, children, scroll = true, gap = 14, contentStyle }) {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBarSpace();
  const body = [styles.content, { gap }, tabBar && !bar ? { paddingBottom: tabBar + 18 } : null, contentStyle];
  return (
    <View style={styles.page}>
      {header}
      {scroll ? (
        <ScrollView style={styles.scroll} contentContainerStyle={body} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, ...body]}>{children}</View>
      )}
      {bar ? <View style={[styles.bar, { marginBottom: tabBar }]}>{bar}</View> : null}
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.canvas },
  scroll: { flex: 1 },
  content: { paddingTop: 18, paddingHorizontal: 16, paddingBottom: 18 },
  // flat strip pinned above the tab bar (My listings: "List new produce")
  bar: { backgroundColor: color.surface, borderTopWidth: 1, borderColor: color.lineFaint, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  // white action sheet, rounded on top, with the screen's primary buttons
  footer: {
    backgroundColor: color.paper,
    borderTopWidth: 1,
    borderColor: color.lineFaint,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
    ...shadow.sheet,
  },
});
