// The green band on every farmer screen (FR-15, assisted participation).
// Reads the signed-in profile itself — screens just render <OwnerStrip />.
// Renders nothing when the farmer holds their own phone (no operator).
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { color, font, type } from '../theme';

const firstName = (name = '') => name.split(' ')[0];

export default function OwnerStrip() {
  const { profile } = useAuth();
  const { t, scriptFont } = useI18n();
  const text = [styles.text, { fontFamily: scriptFont(font.regular) }];
  const bold = { fontFamily: scriptFont(font.semibold) };
  if (!profile?.operatorName || !profile?.fullName) return null;

  const holder = profile.operatorRelation
    ? `${profile.operatorName} (${t(profile.operatorRelation)})`
    : profile.operatorName;

  return (
    <View style={styles.strip} accessibilityRole="summary">
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
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: color.fieldLight,
    borderBottomWidth: 1,
    borderBottomColor: color.fieldBorder,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cols: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  text: { ...type.caption, color: color.ink },
  bold: { fontFamily: font.semibold },
  right: { textAlign: 'right' },
  rule: { color: color.muted, marginTop: 6 },
});
