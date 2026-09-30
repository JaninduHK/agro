// Page frame: canvas background, header slot, scrolling body (.scroll), footer slot.
//
//   <Screen header={<><AppBar title="Offers" attached /><OwnerStrip /></>}>
//     <Card>…</Card>
//   </Screen>
//
// Pass `scroll={false}` for layouts that manage their own list (FlatList).
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../theme';

export default function Screen({ header, footer, children, scroll = true, gap = 14, contentStyle }) {
  const insets = useSafeAreaInsets();
  const body = [styles.content, { gap }, contentStyle];
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
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.canvas },
  scroll: { flex: 1 },
  content: { paddingTop: 18, paddingHorizontal: 16, paddingBottom: 18 },
  footer: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
});
