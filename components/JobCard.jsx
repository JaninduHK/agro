// One transport job: route, load, pickup window and the fee. Used on the
// transporter's Home (current jobs) and Jobs (open jobs) screens.
//
//   <JobCard job={job} featured action={<Button title="Accept this job" … />} />
import { StyleSheet, View } from 'react-native';
import { formatShortDay, formatTime } from '../lib/dates';
import { useI18n } from '../lib/i18n';
import { cropLabel } from '../lib/market';
import { formatLKR } from '../lib/money';
import { color, type } from '../theme';
import Card from './Card';
import Text from './Text';

export default function JobCard({ job, action, featured = false }) {
  const { t } = useI18n();
  return (
    <Card padding={14} style={featured && styles.featured}>
      <View style={styles.between}>
        <View style={{ flex: 1 }}>
          <Text style={[type.heading, styles.ink]}>{job.fromLocation} → {job.toLocation}</Text>
          <Text style={[type.caption, styles.muted, { marginTop: 3 }]}>
            {t('{crop} {kg} kg · {day} {from}–{to}', {
              crop: cropLabel(job.crop),
              kg: job.quantityKg,
              day: formatShortDay(job.windowStart),
              from: formatTime(job.windowStart),
              to: formatTime(job.windowEnd),
            })}
          </Text>
          <Text style={[type.caption, styles.muted, { marginTop: 2 }]}>
            {job.orderId
              ? t('Delivery · {id}', { id: job.orderId })
              : job.farmerName
                ? t('Bulk collection from {name}', { name: job.farmerName })
                : t('Bulk collection')}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[type.title, styles.ink]}>{formatLKR(job.feeToTransporter)}</Text>
          <Text style={[type.caption, styles.muted]}>you earn</Text>
        </View>
      </View>
      {action ? <View style={{ marginTop: 12, gap: 8 }}>{action}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  featured: { borderColor: color.field, borderWidth: 2 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
