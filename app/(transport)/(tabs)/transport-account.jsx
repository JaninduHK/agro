// Transporter account — the Account tab.
// Adds what only a transporter has: where they are paid (changed the same way
// as a farmer's payout: with a fresh code). Jobs and earnings have their own tabs.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Card from '../../../components/Card';
import ChangePayout, { payoutLabel } from '../../../components/ChangePayout';
import ProfileScreen, { SectionLabel } from '../../../components/ProfileScreen';
import Text from '../../../components/Text';
import { maskPhone, useAuth } from '../../../lib/auth';
import { useI18n } from '../../../lib/i18n';
import { color, font, type } from '../../../theme';

export default function TransporterAccount() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const uid = user?.uid;
  const [changing, setChanging] = useState(false);

  if (!profile) return null;

  return (
    <ProfileScreen>
      <SectionLabel>Where money goes</SectionLabel>
      <Card>
        <View style={styles.between}>
          <Text style={[type.heading, styles.ink, { flex: 1 }]}>{payoutLabel(profile.payout, t)}</Text>
          {!changing ? (
            <Text style={styles.link} onPress={() => setChanging(true)} accessibilityRole="button">Change</Text>
          ) : null}
        </View>
        {changing ? (
          <ChangePayout profile={profile} uid={uid} onDone={() => setChanging(false)} />
        ) : (
          <Text style={[type.caption, styles.muted, { marginTop: 4 }]}>
            {t('Changing this needs a code sent to {phone}.', { phone: maskPhone(profile.phone) })}
          </Text>
        )}
      </Card>
    </ProfileScreen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  link: { fontFamily: font.semibold, fontSize: 15, color: color.field, paddingVertical: 8, paddingLeft: 12 },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
