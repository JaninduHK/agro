// Loading, offline and error states shared by every screen.
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Text from './Text';
import { translate } from '../lib/i18n';
import { color, font, radius, type } from '../theme';

// Shown while a screen is reading saved data with no connection (NFR-09).
export function OfflineBanner({ detail = 'You are seeing information saved on this phone. It may have changed.' }) {
  return (
    <View style={styles.offline} accessibilityRole="alert">
      <Feather name="wifi-off" size={18} color={color.alert} />
      <View style={{ flex: 1 }}>
        <Text style={styles.offlineTitle}>No internet connection</Text>
        <Text style={[type.caption, { color: color.ink, marginTop: 2 }]}>{detail}</Text>
      </View>
    </View>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={color.field} />
      <Text style={[type.caption, { color: color.muted, marginTop: 8 }]}>{label}</Text>
    </View>
  );
}

// A write failed. Says what happened; nothing is lost.
export function ErrorText({ error }) {
  if (!error) return null;
  const offline = /unavailable|network/i.test(String(error?.code ?? error?.message));
  return (
    <Text style={[type.caption, styles.error]} accessibilityRole="alert">
      {offline
        ? 'No internet connection. Nothing has been lost — try again when you have signal.'
        : translate('That did not work ({code}). Try again.', { code: error.code ?? error.message })}
    </Text>
  );
}

const styles = StyleSheet.create({
  offline: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: color.alertBg,
    borderWidth: 1,
    borderColor: color.alertBorder,
    borderRadius: radius.input,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  offlineTitle: { fontFamily: font.semibold, fontSize: 15, lineHeight: 20, color: color.alert },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  error: { color: color.alert },
});
