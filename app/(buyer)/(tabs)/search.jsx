// S08 Search produce — Sahanya
// CRUD: read and filter listings. Filters are applied on the phone so they keep
// working offline against saved results.
import { query, where } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import AppBar from '../../../components/AppBar';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import ChoiceGrid from '../../../components/ChoiceGrid';
import Chip from '../../../components/Chip';
import EmptyState from '../../../components/EmptyState';
import Screen from '../../../components/Screen';
import { Loading, OfflineBanner } from '../../../components/StatusViews';
import { useAuth } from '../../../lib/auth';
import { daysAgo, formatDay, toDate } from '../../../lib/dates';
import { COL, col } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { CROPS, cropLabel } from '../../../lib/market';
import { formatPerKg } from '../../../lib/money';
import { useQuery } from '../../../lib/useFirestore';
import { color, font, radius, TAP_MIN, type } from '../../../theme';

const CROP_FILTERS = [{ id: 'all', label: 'All crops' }, ...CROPS.filter((c) => c.id !== 'other').map((c) => ({ id: c.id, label: c.label }))];
const QTY_FILTERS = [
  { id: '0', label: 'Any qty' },
  { id: '10', label: '10 kg+' },
  { id: '50', label: '50 kg+' },
  { id: '100', label: '100 kg+' },
];
const FRESH = [
  { id: 'any', label: 'Any date' },
  { id: '3', label: 'Harvested ≤ 3 days' },
  { id: '0', label: 'Harvested today' },
];

function Toggle({ label, on, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      style={[styles.toggle, on && styles.toggleOn]}
    >
      <Text style={[styles.toggleText, on && { color: color.field, fontFamily: font.semibold }]}>{label}</Text>
    </Pressable>
  );
}

function ageDays(value) {
  const d = toDate(value);
  if (!d) return Infinity;
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((start(new Date()) - start(d)) / 86400e3);
}

export default function Search() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [crop, setCrop] = useState('beans');
  const [minQty, setMinQty] = useState('10');
  const [fresh, setFresh] = useState('3');
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  const listings = useQuery(() => query(col(COL.listings), where('status', '==', 'live')), []);
  const all = listings.data ?? [];

  const matches = (l, overrides = {}) => {
    const f = { crop, minQty, fresh, verifiedOnly, ...overrides };
    return (
      (f.crop === 'all' || l.crop === f.crop) &&
      l.quantityKg >= Number(f.minQty) &&
      (f.fresh === 'any' || ageDays(l.harvestDate) <= Number(f.fresh)) &&
      (!f.verifiedOnly || l.farmerVerified)
    );
  };
  const results = all.filter((l) => matches(l)).sort((a, b) => toDate(b.harvestDate) - toDate(a.harvestDate));
  const widened = fresh === '0' ? all.filter((l) => matches(l, { fresh: '3' })) : [];

  const activeFilters = [crop !== 'all', minQty !== '0', fresh !== 'any', verifiedOnly].filter(Boolean).length;

  function clearAll() {
    setCrop('all');
    setMinQty('0');
    setFresh('any');
    setVerifiedOnly(false);
  }

  return (
    <Screen header={<AppBar title="Search produce" subtitle={profile?.village ? t('Deliver to {place}', { place: profile.village }) : undefined} />}>
      {listings.fromCache ? <OfflineBanner /> : null}

      <ChoiceGrid columns={3} value={crop} onChange={setCrop} options={CROP_FILTERS} />
      <ChoiceGrid columns={0} value={minQty} onChange={setMinQty} options={QTY_FILTERS} />
      <ChoiceGrid columns={0} value={fresh} onChange={setFresh} options={FRESH} />
      <Toggle label="Verified farmers only" on={verifiedOnly} onPress={() => setVerifiedOnly((v) => !v)} />

      <View style={styles.between}>
        <Text style={[type.caption, { color: color.ink }]}>
          {t('{f} filters · {n} results', { f: activeFilters, n: results.length })}
        </Text>
        {activeFilters ? (
          <Text style={styles.link} onPress={clearAll} accessibilityRole="button">Clear all</Text>
        ) : null}
      </View>

      {listings.loading ? <Loading /> : null}

      {results.map((l) => (
        <Card key={l.id} padding={14}>
          <Pressable onPress={() => router.push(`/listing/${l.id}`)} accessibilityRole="button">
            <View style={styles.between}>
              <Text style={[type.heading, { color: color.ink, flex: 1 }]}>
                {t('{crop} · Grade {grade}', { crop: cropLabel(l.crop), grade: l.grade })}
              </Text>
              {l.farmerVerified ? <Chip label="Verified" tone="done" /> : <Chip label="Not verified" tone="alert" />}
            </View>
            <Text style={[type.caption, { color: color.muted, marginTop: 3 }]}>
              {l.farmerName} · {l.farmerVillage}
            </Text>
            <Text style={[type.body, { color: color.ink, marginTop: 8 }]}>
              <Text style={{ fontFamily: font.semibold }}>{formatPerKg(l.askingPricePerKg)}</Text>
              {` · ${t('{kg} kg available', { kg: l.quantityKg })}`}
            </Text>
            <Text style={[type.caption, { color: color.muted, marginTop: 2 }]}>
              {t('Harvested {date} ({ago})', { date: formatDay(l.harvestDate), ago: daysAgo(l.harvestDate) })}
            </Text>
          </Pressable>
        </Card>
      ))}

      {!listings.loading && !results.length ? (
        <EmptyState
          icon="search"
          title={
            crop === 'all'
              ? t('Nothing matches these filters')
              : fresh === '0'
                ? t('No {crop} harvested today', { crop: cropLabel(crop).toLowerCase() })
                : t('No {crop} matching these filters', { crop: cropLabel(crop).toLowerCase() })
          }
          body={
            fresh === '0'
              ? t('{crop} is usually picked early and listed the same evening. Widening the harvest window finds produce that is still fresh.', { crop: cropLabel(crop) })
              : 'Try fewer filters, or ask to be told when new produce is listed.'
          }
        >
          {widened.length ? (
            <Button title="Show produce from the last 3 days" onPress={() => setFresh('3')} />
          ) : (
            <Button title="Clear all filters" onPress={clearAll} />
          )}
        </EmptyState>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  link: { fontFamily: font.semibold, fontSize: 13, color: color.field, paddingVertical: 8 },
  toggle: {
    minHeight: TAP_MIN,
    borderWidth: 1,
    borderColor: color.lineSoft,
    backgroundColor: color.paper,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOn: { borderWidth: 2, borderColor: color.field, backgroundColor: color.fieldLight },
  toggleText: { fontFamily: font.medium, fontSize: 15, color: color.ink },
});
