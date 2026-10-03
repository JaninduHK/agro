// S08 Search produce — Ranaweera
// CRUD: read and filter listings. Filters are applied on the phone so they keep
// working offline against saved results.
//
// Layout (Prototype v3): a search field with a filter button, the active filters
// as removable chips, then results. The filter button opens a bottom sheet with
// every option; nothing changes until "Show results" is tapped.
import { Feather } from '@expo/vector-icons';
import { query, where } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBar from '../../../components/AppBar';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import ChoiceGrid from '../../../components/ChoiceGrid';
import Chip from '../../../components/Chip';
import EmptyState from '../../../components/EmptyState';
import Screen from '../../../components/Screen';
import { Loading, OfflineBanner } from '../../../components/StatusViews';
import Text from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { daysAgo, formatDay, toDate } from '../../../lib/dates';
import { COL, col } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { CROPS, cropLabel } from '../../../lib/market';
import { formatPerKg } from '../../../lib/money';
import { useQuery } from '../../../lib/useFirestore';
import { color, font, radius, shadow, TAP_MIN, type } from '../../../theme';

const NO_FILTERS = { crop: 'all', minQty: '0', fresh: 'any', verifiedOnly: false };

const CROP_OPTIONS = [{ id: 'all', label: 'All crops' }, ...CROPS.filter((c) => c.id !== 'other').map((c) => ({ id: c.id, label: c.label }))];
const QTY_OPTIONS = [
  { id: '0', label: 'Any quantity' },
  { id: '10', label: '10 kg+' },
  { id: '50', label: '50 kg+' },
  { id: '100', label: '100 kg+' },
];
const FRESH_OPTIONS = [
  { id: 'any', label: 'Any date' },
  { id: '3', label: 'Within 3 days' },
  { id: '0', label: 'Today' },
];
// How each active filter reads as a chip.
const FRESH_CHIP = { 3: 'Harvested ≤ 3 days', 0: 'Harvested today' };

function ageDays(value) {
  const d = toDate(value);
  if (!d) return Infinity;
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((start(new Date()) - start(d)) / 86400e3);
}

function matches(listing, f, text) {
  const needle = text.trim().toLowerCase();
  const haystack = [listing.crop, cropLabel(listing.crop), listing.farmerName, listing.farmerVillage].join(' ').toLowerCase();
  return (
    (!needle || haystack.includes(needle)) &&
    (f.crop === 'all' || listing.crop === f.crop) &&
    (listing.quantityKg ?? 0) >= Number(f.minQty) &&
    (f.fresh === 'any' || ageDays(listing.harvestDate) <= Number(f.fresh)) &&
    (!f.verifiedOnly || listing.farmerVerified)
  );
}

const countActive = (f) => [f.crop !== 'all', f.minQty !== '0', f.fresh !== 'any', f.verifiedOnly].filter(Boolean).length;

// Removable pill for one active filter.
function FilterChip({ label, onRemove }) {
  return (
    <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={styles.fchip}>
      <Text style={styles.fchipText}>{label}</Text>
      <Feather name="x" size={14} color={color.field} />
    </Pressable>
  );
}

function SheetLabel({ children }) {
  return <Text style={[type.label, { color: color.ink, marginTop: 6 }]}>{children}</Text>;
}

// Bottom-sheet popup. Edits a draft; only "Show results" applies it.
function FilterSheet({ visible, initial, count, onApply, onClose }) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [draft, setDraft] = useState(initial);
  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));
  const n = count(draft);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={() => setDraft(initial)} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close filters" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />
          <View style={styles.sheetHead}>
            <Text style={[type.title, { color: color.ink, flex: 1 }]}>Filters</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close filters" style={styles.close}>
              <Feather name="x" size={22} color={color.ink} />
            </Pressable>
          </View>

          <ScrollView style={styles.sheetScroll} contentContainerStyle={{ gap: 10, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
            <SheetLabel>Crop</SheetLabel>
            <ChoiceGrid columns={3} options={CROP_OPTIONS} value={draft.crop} onChange={set('crop')} />

            <SheetLabel>Quantity available</SheetLabel>
            <ChoiceGrid columns={2} options={QTY_OPTIONS} value={draft.minQty} onChange={set('minQty')} />

            <SheetLabel>Harvested</SheetLabel>
            <ChoiceGrid columns={0} options={FRESH_OPTIONS} value={draft.fresh} onChange={set('fresh')} />

            <SheetLabel>Farmers</SheetLabel>
            <Pressable
              onPress={() => set('verifiedOnly')(!draft.verifiedOnly)}
              accessibilityRole="switch"
              accessibilityState={{ checked: draft.verifiedOnly }}
              style={[styles.check, draft.verifiedOnly && styles.checkOn]}
            >
              <View style={[styles.box, draft.verifiedOnly && styles.boxOn]}>
                {draft.verifiedOnly ? <Feather name="check" size={16} color={color.paper} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkTitle}>Verified farmers only</Text>
                <Text style={[type.caption, { color: color.muted, marginTop: 1 }]}>Identity checked in person by a field officer</Text>
              </View>
            </Pressable>
          </ScrollView>

          <View style={styles.sheetActions}>
            <Button title="Clear all" variant="secondary" onPress={() => setDraft(NO_FILTERS)} style={{ flex: 1 }} />
            <Button
              title={n === 1 ? t('Show 1 result') : t('Show {n} results', { n })}
              onPress={() => onApply(draft)}
              style={{ flex: 1.6 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function Search() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [filters, setFilters] = useState(NO_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const listings = useQuery(() => query(col(COL.listings), where('status', '==', 'live')), []);
  const all = listings.data ?? [];

  const results = all.filter((l) => matches(l, filters, text)).sort((a, b) => toDate(b.harvestDate) - toDate(a.harvestDate));
  const widened = filters.fresh === '0' ? all.filter((l) => matches(l, { ...filters, fresh: '3' }, text)) : [];
  const active = countActive(filters);
  const reset = (key) => () => setFilters((f) => ({ ...f, [key]: NO_FILTERS[key] }));
  const clearAll = () => {
    setFilters(NO_FILTERS);
    setText('');
  };

  const chips = [
    filters.crop !== 'all' && { key: 'crop', label: cropLabel(filters.crop) },
    filters.minQty !== '0' && { key: 'minQty', label: `${filters.minQty} kg+` },
    filters.fresh !== 'any' && { key: 'fresh', label: t(FRESH_CHIP[filters.fresh]) },
    filters.verifiedOnly && { key: 'verifiedOnly', label: t('Verified only') },
  ].filter(Boolean);

  const summary =
    (active === 0 ? t('No filters') : active === 1 ? t('1 filter') : t('{n} filters', { n: active })) +
    ' · ' +
    (results.length === 1 ? t('1 result') : t('{n} results', { n: results.length }));

  const cropName = filters.crop === 'all' ? null : cropLabel(filters.crop);

  return (
    <Screen
      gap={10}
      contentStyle={{ paddingTop: 12 }}
      header={
        <>
          <AppBar title="Search produce" subtitle={profile?.village ? t('Deliver to {place}', { place: profile.village }) : undefined} attached />
          <View style={styles.tools}>
            <View style={styles.searchRow}>
              <View style={styles.search}>
                <Feather name="search" size={20} color={color.muted} />
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder={t('Crop, farmer or village')}
                  placeholderTextColor={color.faint}
                  returnKeyType="search"
                  autoCorrect={false}
                  style={styles.searchInput}
                  accessibilityLabel={t('Search produce')}
                />
                {text ? (
                  <Pressable onPress={() => setText('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
                    <Feather name="x" size={18} color={color.muted} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                onPress={() => setSheetOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={t('Filters')}
                style={[styles.filterButton, active > 0 && styles.filterButtonOn]}
              >
                <Feather name="sliders" size={20} color={active > 0 ? color.paper : color.ink} />
                {active > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{active}</Text>
                  </View>
                ) : null}
              </Pressable>
            </View>

            {chips.length ? (
              <View style={styles.chips}>
                {chips.map((c) => (
                  <FilterChip key={c.key} label={c.label} onRemove={reset(c.key)} />
                ))}
              </View>
            ) : null}

            <View style={styles.summary}>
              <Text style={[type.caption, { color: color.muted }]}>{summary}</Text>
              {active > 0 || text ? (
                <Text style={styles.link} onPress={clearAll} accessibilityRole="button">Clear all</Text>
              ) : null}
            </View>
          </View>
        </>
      }
    >
      {listings.fromCache ? <OfflineBanner /> : null}
      {listings.loading ? <Loading /> : null}

      {results.map((l) => (
        <Card key={l.id} padding={12}>
          <Pressable onPress={() => router.push(`/listing/${l.id}`)} accessibilityRole="button" style={styles.result}>
            <View style={styles.thumb}>
              <Feather name="image" size={22} color={color.faint} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.between}>
                <Text style={[type.heading, { color: color.ink, flex: 1 }]} numberOfLines={1}>
                  {t('{crop} · Grade {grade}', { crop: cropLabel(l.crop), grade: l.grade })}
                </Text>
                {l.farmerVerified ? <Chip label="Verified" tone="done" /> : <Chip label="Not verified" tone="alert" />}
              </View>
              <Text style={[type.caption, { color: color.muted, marginTop: 3 }]} numberOfLines={1}>
                {l.farmerName} · {l.farmerVillage}
              </Text>
              <Text style={[type.body, { color: color.ink, marginTop: 6 }]}>
                <Text style={{ fontFamily: font.semibold }}>{formatPerKg(l.askingPricePerKg)}</Text>
                <Text style={[type.caption, { color: color.muted }]}>{` · ${t('{kg} kg available', { kg: l.quantityKg })}`}</Text>
              </Text>
              <Text style={[type.caption, styles.harvest]}>
                {t('Harvested {date} ({ago})', { date: formatDay(l.harvestDate), ago: daysAgo(l.harvestDate) })}
              </Text>
            </View>
          </Pressable>
        </Card>
      ))}

      {!listings.loading && !results.length ? (
        <EmptyState
          icon="search"
          title={
            filters.fresh === '0' && cropName
              ? t('No {crop} harvested today', { crop: cropName.toLowerCase() })
              : t('Nothing matches this search')
          }
          body={
            filters.fresh === '0' && cropName
              ? t('{crop} is usually picked early and listed the same evening. Widening the harvest window finds produce that is still fresh.', { crop: cropName })
              : t('Try a different word or fewer filters.')
          }
        >
          {widened.length ? (
            <Button title="Show produce from the last 3 days" onPress={() => setFilters((f) => ({ ...f, fresh: '3' }))} />
          ) : (
            <Button title="Clear all filters" onPress={clearAll} />
          )}
        </EmptyState>
      ) : null}

      <FilterSheet
        visible={sheetOpen}
        initial={filters}
        count={(draft) => all.filter((l) => matches(l, draft, text)).length}
        onApply={(draft) => {
          setFilters(draft);
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // white strip under the app bar
  tools: { backgroundColor: color.paper, borderBottomWidth: 1, borderBottomColor: color.lineFaint, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchRow: { flexDirection: 'row', gap: 10 },
  search: {
    flex: 1,
    minHeight: TAP_MIN,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: color.lineSoft,
    borderRadius: radius.input,
    backgroundColor: color.paper,
  },
  searchInput: { flex: 1, fontFamily: font.medium, fontSize: 16, color: color.ink, paddingVertical: 10 },
  filterButton: {
    width: TAP_MIN,
    height: TAP_MIN,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: color.lineSoft,
    backgroundColor: color.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonOn: { backgroundColor: color.forest, borderColor: color.forest },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: color.lime,
    borderWidth: 2,
    borderColor: color.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: font.bold, fontSize: 11, lineHeight: 14, color: color.forest },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  fchip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: color.field,
    backgroundColor: color.fieldLight,
  },
  fchipText: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18, color: color.field },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32, marginTop: 6 },
  link: { fontFamily: font.semibold, fontSize: 13, color: color.field, paddingVertical: 6, paddingLeft: 12 },

  result: { flexDirection: 'row', gap: 12 },
  thumb: { width: 76, height: 76, borderRadius: 14, backgroundColor: '#E0DED6', alignItems: 'center', justifyContent: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  harvest: { color: color.field, fontFamily: font.semibold, marginTop: 3 },

  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16,26,19,0.45)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: color.paper,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 16,
    paddingTop: 8,
    ...shadow.sheet,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: color.line },
  sheetHead: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  close: { width: TAP_MIN, height: TAP_MIN, alignItems: 'center', justifyContent: 'center', marginRight: -12 },
  sheetScroll: { flexGrow: 0 },
  check: {
    minHeight: TAP_MIN,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: color.lineSoft,
    borderRadius: radius.input,
    backgroundColor: color.paper,
  },
  checkOn: { borderWidth: 2, borderColor: color.field, backgroundColor: color.fieldLight },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: color.faint, backgroundColor: color.paper, alignItems: 'center', justifyContent: 'center' },
  boxOn: { borderColor: color.field, backgroundColor: color.field },
  checkTitle: { fontFamily: font.semibold, fontSize: 15, lineHeight: 20, color: color.ink },
  sheetActions: { flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: color.divider, marginTop: 4 },
});
