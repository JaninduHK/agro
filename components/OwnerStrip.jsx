// The green band on every farmer screen (FR-15, assisted participation).
// Reads the signed-in profile itself — screens just render <OwnerStrip />.
// Renders nothing when the farmer holds their own phone (no operator).
//
// It can be closed. Closing hides it on every screen for the rest of the
// session; it is shown again at each sign-in (and each time the app is opened),
// so whoever picks up the phone next is told who the money goes to.
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { color, font, type } from '../theme';
import Text from './Text';

const firstName = (name = '') => name.split(' ')[0];

// True when the strip is on screen — headers use it to decide whether the app
// bar keeps its rounded bottom corners.
export function useOwnerStripVisible() {
  const { profile, ownerStripDismissed } = useAuth();
  return !!(profile?.operatorName && profile?.fullName) && !ownerStripDismissed;
}

export default function OwnerStrip() {
  const { profile, dismissOwnerStrip } = useAuth();
  const { t, scriptFont } = useI18n();
  const visible = useOwnerStripVisible();
  const text = [styles.text, { fontFamily: scriptFont(font.regular) }];
  const bold = { fontFamily: scriptFont(font.semibold) };
  if (!visible) return null;

  const holder = profile.operatorRelation
    ? `${profile.operatorName} (${t(profile.operatorRelation)})`
    : profile.operatorName;

  return (
    <View style={styles.strip} accessibilityRole="summary">
      <View style={styles.body}>
        <View style={styles.cols}>
          <Text style={text}>
            <Text style={bold}>{t('owner.owner')}</Text>
            {'\n'}
            {profile.fullName}
          </Text>
          <Text style={[text, styles.right]}>
            <Text style={bold}>{t('owner.holder')}</Text>
            {'\n'}
            {holder}
          </Text>
        </View>
        <Text style={[text, styles.rule]}>
          {t('owner.rule', { owner: firstName(profile.fullName), operator: firstName(profile.operatorName) })}
        </Text>
      </View>
      <Pressable
        onPress={dismissOwnerStrip}
        hitSlop={14}
        accessibilityRole="button"
        accessibilityLabel={t('Hide this notice')}
        style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
      >
        <Feather name="x" size={18} color={color.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: color.fieldLight,
    borderBottomWidth: 1,
    borderBottomColor: color.fieldBorder,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  body: { flex: 1 },
  cols: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  text: { ...type.caption, color: color.ink },
  right: { textAlign: 'right' },
  rule: { color: color.muted, marginTop: 6 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closePressed: { backgroundColor: color.fieldBorder },
});
