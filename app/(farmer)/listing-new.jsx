// S02 Create listing — Athuraliya
// CRUD: create listing, update draft (saved after every step), delete draft.
// Steps: what you are selling → how much → when and where → price and review.
// /listing-new?draft=<id> resumes a draft ("Step 2 of 4 · saved 11.20 am by Kasun").
import { query, where } from '@react-native-firebase/firestore';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Card, { Divider, Inset } from '../../components/Card';
import ChoiceGrid from '../../components/ChoiceGrid';
import Chip from '../../components/Chip';
import FarmerHeader from '../../components/FarmerHeader';
import Field, { FieldLabel } from '../../components/Field';
import { LineItem, MoneyFigure } from '../../components/LineItem';
import Notice from '../../components/Notice';
import ProgressRail from '../../components/ProgressRail';
import Screen from '../../components/Screen';
import { ErrorText, Loading } from '../../components/StatusViews';
import { deleteListing, publishListing, saveListingStep } from '../../lib/actions';
import { useAuth } from '../../lib/auth';
import { addDays, formatDay, formatTime, toDate } from '../../lib/dates';
import { COL, col, ref } from '../../lib/firestore';
import { useI18n } from '../../lib/i18n';
import { COLLECTION_WINDOWS, CROPS, GRADE_HELP, GRADES, cropLabel, guidanceFor } from '../../lib/market';
import { calcNet, formatLKR } from '../../lib/money';
import { useDocument, useQuery } from '../../lib/useFirestore';
import { color, font, type } from '../../theme';

const STEP_LABELS = ['What you are selling', 'How much', 'When and where', 'Price and review'];
const QTY_PRESETS = [50, 100, 200];
const HARVEST_OPTIONS = [
  { id: '0', label: 'Today' },
  { id: '1', label: 'Yesterday' },
  { id: '2', label: '2 days ago' },
  { id: '3', label: '3 days ago' },
];

const firstName = (n = '') => n.split(' ')[0];

function harvestFromChoice(daysBack) {
  const d = addDays(new Date(), -Number(daysBack));
  d.setHours(6, 0, 0, 0);
  return d;
}

function choiceFromHarvest(value) {
  const d = toDate(value);
  if (!d) return '0';
  const days = Math.round((new Date().setHours(6, 0, 0, 0) - new Date(d).setHours(6, 0, 0, 0)) / 86400e3);
  return String(Math.min(3, Math.max(0, days)));
}

// Loads the draft (if resuming) before the form mounts, so the form can take it
// as its initial state.
export default function CreateListing() {
  const { draft: draftId } = useLocalSearchParams();
  const draft = useDocument(() => (draftId ? ref(COL.listings, draftId) : null), [draftId]);
  if (draftId && draft.loading) {
    return <Screen header={<FarmerHeader title="List produce" onBack={router.back} />}><Loading /></Screen>;
  }
  return <ListingForm key={draftId ?? 'new'} draft={draft.data ?? null} />;
}

function ListingForm({ draft: d }) {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const history = useQuery(() => (user ? query(col(COL.listings), where('farmerId', '==', user.uid)) : null), [user?.uid]);
  const knownCrop = d?.crop && CROPS.some((c) => c.id === d.crop);

  const [id, setId] = useState(d?.id ?? null);
  const [step, setStep] = useState(d ? Math.min(4, Math.max(1, (d.draftStep ?? 0) + 1)) : 1);
  const [crop, setCrop] = useState(d?.crop ? (knownCrop ? d.crop : 'other') : null);
  const [otherCrop, setOtherCrop] = useState(d?.crop && !knownCrop ? d.crop : '');
  const [grade, setGrade] = useState(d?.grade ?? 'A');
  const [qtyText, setQtyText] = useState(d?.quantityKg ? String(d.quantityKg) : '');
  const [qtyConfirmed, setQtyConfirmed] = useState(false);
  const [harvest, setHarvest] = useState(d?.harvestDate ? choiceFromHarvest(d.harvestDate) : '0');
  const [collectFrom, setCollectFrom] = useState(
    d?.collectFrom ?? (profile?.village ? t('{place} — home garden', { place: profile.village }) : ''),
  );
  const [windowId, setWindowId] = useState(d?.collectionWindow ?? 'wed-fri');
  const [priceText, setPriceText] = useState(d?.askingPricePerKg ? String(d.askingPricePerKg) : '');
  const [savedInfo, setSavedInfo] = useState(d ? { savedAt: d.savedAt, savedBy: d.savedBy, step: d.draftStep } : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const cropId = crop === 'other' ? otherCrop.trim().toLowerCase() : crop;
  const qty = Number(qtyText) || 0;
  const price = Number(priceText) || 0;
  const guide = guidanceFor(cropId, grade);

  // Quantity check against this farmer's other listings.
  const past = useMemo(
    () => (history.data ?? []).filter((l) => l.id !== id && l.quantityKg).map((l) => l.quantityKg),
    [history.data, id],
  );
  const pastMax = past.length ? Math.max(...past) : null;
  const pastMin = past.length ? Math.min(...past) : null;
  const unusualQty = pastMax && qty > pastMax * 3 && !qtyConfirmed;
  const suggestedQty = unusualQty ? (qty % 10 === 0 && qty / 10 <= pastMax * 1.5 ? qty / 10 : pastMax) : null;

  const fieldsFor = (s) => {
    if (s === 1) return { crop: cropId, grade };
    if (s === 2) return { quantityKg: qty };
    if (s === 3) return { harvestDate: harvestFromChoice(harvest), collectFrom: collectFrom.trim(), collectionWindow: windowId };
    return { askingPricePerKg: price };
  };

  const canNext =
    (step === 1 && !!cropId) ||
    (step === 2 && qty > 0 && !unusualQty) ||
    (step === 3 && collectFrom.trim().length > 0) ||
    (step === 4 && price > 0);

  async function save(s) {
    const newId = await saveListingStep({ id, user, profile, step: s, fields: fieldsFor(s) });
    setId(newId);
    setSavedInfo({ savedAt: new Date(), savedBy: profile.operatorName ?? profile.fullName, step: s });
    return newId;
  }

  async function run(fn) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const next = () => run(async () => { await save(step); setStep(step + 1); });
  const publish = () =>
    run(async () => {
      const listingId = await save(4);
      await publishListing(listingId, fieldsFor(4));
      router.replace('/listings');
    });
  const saveDraft = () => run(async () => { await save(4); router.replace('/listings'); });
  const discard = () =>
    run(async () => {
      if (id) await deleteListing(id);
      router.back();
    });

  const subtitle = cropId ? t('{crop} · Grade {grade}', { crop: cropLabel(cropId), grade }) : undefined;
  const whole = calcNet(price, qty);

  return (
    <Screen
      gap={12}
      header={
        <FarmerHeader
          title={step === 4 ? 'Review listing' : 'List produce'}
          subtitle={step > 1 ? subtitle : undefined}
          onBack={router.back}
          below={<ProgressRail step={step} total={4} label={STEP_LABELS[step - 1]} />}
        />
      }
      footer={
        <>
          <ErrorText error={error} />
          {step < 4 ? (
            <View style={styles.pair}>
              {step > 1 ? <Button title="Back" variant="secondary" onPress={() => setStep(step - 1)} style={{ flex: 1 }} /> : null}
              <Button title="Next" onPress={next} disabled={!canNext} loading={busy} style={{ flex: 1.6 }} />
            </View>
          ) : (
            <>
              <Button title="Publish listing" onPress={publish} disabled={!canNext} loading={busy} />
              <Button title="Save as draft" variant="secondary" onPress={saveDraft} disabled={busy} />
            </>
          )}
        </>
      }
    >
      <Notice tone="field">
        {savedInfo?.savedAt
          ? t('Saved {time} by {name} · step {n} of 4', { time: formatTime(savedInfo.savedAt), name: firstName(savedInfo.savedBy), n: savedInfo.step })
          : 'Saved automatically. You can stop and come back.'}
      </Notice>

      {step === 1 ? (
        <>
          <Text style={[type.title, styles.ink]}>What are you selling?</Text>
          <FieldLabel>Crop</FieldLabel>
          <ChoiceGrid columns={2} value={crop} onChange={setCrop} options={CROPS.map((c) => ({ id: c.id, label: c.label }))} />
          {crop === 'other' ? <Field label="Which crop?" value={otherCrop} onChangeText={setOtherCrop} autoCapitalize="words" /> : null}
          <FieldLabel style={{ marginTop: 4 }}>Grade</FieldLabel>
          <ChoiceGrid columns={3} value={grade} onChange={setGrade} options={GRADES.map((g) => ({ id: g.id, label: g.label }))} />
          <Text style={[type.caption, styles.muted]}>{GRADE_HELP[grade]}</Text>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <Text style={[type.title, styles.ink]}>How much?</Text>
          <Field
            label="Quantity"
            value={qtyText}
            onChangeText={(v) => {
              setQtyText(v.replace(/\D/g, ''));
              setQtyConfirmed(false);
            }}
            keyboardType="number-pad"
            suffix="kg"
          />
          <ChoiceGrid
            columns={0}
            value={QTY_PRESETS.includes(qty) ? String(qty) : null}
            onChange={(v) => {
              setQtyText(v);
              setQtyConfirmed(false);
            }}
            options={QTY_PRESETS.map((q) => ({ id: String(q), label: t('{kg} kg', { kg: q }) }))}
          />
          {unusualQty ? (
            <>
              <Notice tone="time" title="Check this quantity">
                {t('You entered {kg} kg. Your other listings were {range} kg. A wrong quantity can lead to a dispute at collection.', {
                  kg: qty,
                  range: pastMin === pastMax ? pastMax : `${pastMin}–${pastMax}`,
                })}
              </Notice>
              <View style={styles.pair}>
                <Button title={t('Keep {kg} kg', { kg: qty })} variant="secondary" onPress={() => setQtyConfirmed(true)} style={{ flex: 1 }} />
                <Button title={t('Change to {kg} kg', { kg: suggestedQty })} onPress={() => setQtyText(String(suggestedQty))} style={{ flex: 1.4 }} />
              </View>
            </>
          ) : null}
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Text style={[type.title, styles.ink]}>When and where</Text>
          <FieldLabel>Harvested</FieldLabel>
          <ChoiceGrid columns={2} value={harvest} onChange={setHarvest} options={HARVEST_OPTIONS} />
          <Text style={[type.caption, styles.muted]}>{formatDay(harvestFromChoice(harvest))}</Text>
          <Field label="Collect from" value={collectFrom} onChangeText={setCollectFrom} />
          <FieldLabel>Collection window</FieldLabel>
          <ChoiceGrid columns={0} value={windowId} onChange={setWindowId} options={COLLECTION_WINDOWS} />
          <Notice title="Buyers see the harvest date">
            {t('Most buyers search for produce harvested within 3 days. {crop} harvested {day} appear in those results until {until}.', {
              crop: cropLabel(cropId),
              day: formatDay(harvestFromChoice(harvest)).split(',')[0],
              until: formatDay(addDays(harvestFromChoice(harvest), 3)).split(',')[0],
            })}
          </Notice>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <Card>
            <View style={styles.between}>
              <Text style={[type.heading, styles.ink]}>{subtitle}</Text>
              <Chip label="Not published" />
            </View>
            <Divider />
            <LineItem label="Quantity" value={`${qty} kg`} />
            <LineItem label="Harvested" value={formatDay(harvestFromChoice(harvest))} />
            <LineItem label="Collect from" value={collectFrom} />
            <LineItem label="Collection window" value={COLLECTION_WINDOWS.find((w) => w.id === windowId)?.label} />
          </Card>

          <Field label="You are asking" value={priceText} onChangeText={(v) => setPriceText(v.replace(/\D/g, ''))} keyboardType="number-pad" suffix="Rs / kg" />
          {guide ? (
            <Inset>
              <Text style={[type.caption, styles.ink]}>
                {[
                  t('Guidance: {low}–{high}/kg this week', { low: formatLKR(guide.low), high: guide.high }),
                  price
                    ? price > guide.high
                      ? t('your price is above the range')
                      : price < guide.low
                        ? t('your price is below the range')
                        : t('your price is inside the range')
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <Text style={[type.caption, styles.muted, { marginTop: 2 }]}>
                Dambulla market average. Guidance only — buyers may offer more or less.
              </Text>
            </Inset>
          ) : null}

          {price ? (
            <Card>
              <Text style={[type.label, styles.muted]}>{t('If you sell all {kg} kg at {price}', { kg: qty, price: formatLKR(price) })}</Text>
              <LineItem label="Total" amount={whole.gross} />
              <LineItem label="Platform fee (3%)" amount={whole.fee} deduction />
              <Divider />
              <MoneyFigure label="You would receive" amount={whole.net} size="medium" />
            </Card>
          ) : null}

          {id ? <Button title="Delete this draft" variant="danger" onPress={discard} disabled={busy} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  pair: { flexDirection: 'row', gap: 10 },
  muted: { color: color.muted },
  ink: { color: color.ink },
  bold: { fontFamily: font.semibold },
});
