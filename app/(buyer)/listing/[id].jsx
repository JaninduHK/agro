// S09 Listing detail and checkout — Ranaweera
// CRUD: create order (and read it on the tracking screen). Payment is simulated:
// the order is recorded with the buyer's money held by the platform.
// A buyer taking the whole lot can make an offer instead — that is what reaches
// the farmer's Offers screen.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import AppBar from '../../../components/AppBar';
import Button from '../../../components/Button';
import Card, { Divider } from '../../../components/Card';
import ChoiceGrid from '../../../components/ChoiceGrid';
import Chip from '../../../components/Chip';
import Field, { FieldLabel } from '../../../components/Field';
import { LineItem } from '../../../components/LineItem';
import Notice from '../../../components/Notice';
import Screen from '../../../components/Screen';
import Stepper from '../../../components/Stepper';
import { ErrorText, Loading, OfflineBanner } from '../../../components/StatusViews';
import { countListingView, makeOffer, placeOrder } from '../../../lib/actions';
import { charge } from '../../../lib/payments';
import { useAuth } from '../../../lib/auth';
import { formatDay, formatFullDate, formatMonthYear } from '../../../lib/dates';
import { COL, ref } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { DELIVERY_FEE, GRADES, cropLabel } from '../../../lib/market';
import { calcNet, formatLKR, formatPerKg } from '../../../lib/money';
import { useDocument } from '../../../lib/useFirestore';
import { color, type } from '../../../theme';

const METHODS = [
  { id: 'frimi', label: 'FriMi' },
  { id: 'ezcash', label: 'eZ Cash' },
  { id: 'bank', label: 'Bank transfer' },
];
const METHOD_LABEL = { frimi: 'FriMi', ezcash: 'eZ Cash', bank: 'bank transfer' };
const TERMS = [
  { id: 'on-collection', label: 'Pay on collection' },
  { id: '7-days', label: 'Pay in 7 days' },
];

function WholeLotOffer({ listing, onClose }) {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const [price, setPrice] = useState(String(listing.askingPricePerKg ?? ''));
  const [terms, setTerms] = useState('on-collection');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const n = Number(price) || 0;
  const { gross, net } = calcNet(n, listing.quantityKg);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      await makeOffer({ user, profile, listing, pricePerKg: n, paymentTerms: terms });
      setSent(true);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Notice tone="field" title="Offer sent">
        {t('{farmer} sees your offer of {price} for all {kg} kg. It stays open for 24 hours.', { farmer: listing.farmerName, price: formatPerKg(n), kg: listing.quantityKg })}
      </Notice>
    );
  }

  return (
    <Card>
      <Text style={[type.heading, styles.ink]}>{t('Offer for all {kg} kg', { kg: listing.quantityKg })}</Text>
      <Field label="Your price" value={price} onChangeText={(v) => setPrice(v.replace(/\D/g, ''))} keyboardType="number-pad" suffix={t('Rs / kg')} style={{ marginTop: 10 }} />
      <FieldLabel style={{ marginTop: 10, marginBottom: 6 }}>Payment</FieldLabel>
      <ChoiceGrid columns={0} value={terms} onChange={setTerms} options={TERMS} />
      <LineItem label="You pay" amount={gross} style={{ marginTop: 10 }} />
      <LineItem label="Farmer receives after fees" amount={net} />
      <ErrorText error={error} />
      <View style={[styles.pair, { marginTop: 12 }]}>
        <Button title="Cancel" variant="secondary" compact onPress={onClose} style={{ flex: 1 }} />
        <Button title="Send offer" compact disabled={!(n > 0)} loading={busy} onPress={send} style={{ flex: 1.4 }} />
      </View>
    </Card>
  );
}

export default function ListingDetail() {
  const { id } = useLocalSearchParams();
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const listing = useDocument(() => ref(COL.listings, id), [id]);
  const farmerId = listing.data?.farmerId;
  const farmer = useDocument(() => (farmerId ? ref(COL.users, farmerId) : null), [farmerId]);
  const [qtyWanted, setQty] = useState(10);
  const [method, setMethod] = useState('frimi');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [offering, setOffering] = useState(false);

  useEffect(() => {
    countListingView(id);
  }, [id]);

  const l = listing.data;

  const header = (
    <AppBar
      title={l ? t('{crop} · Grade {grade}', { crop: cropLabel(l.crop), grade: l.grade }) : t('Produce')}
      subtitle={l ? `${l.farmerName}, ${l.farmerVillage}` : undefined}
      onBack={router.back}
    />
  );

  if (listing.loading) return <Screen header={header}><Loading /></Screen>;
  if (!l || l.status !== 'live') {
    return (
      <Screen header={header}>
        <Notice tone="alert" title="This produce is no longer available">It may have sold. Search again for similar produce.</Notice>
        <Button title="Back to search" onPress={router.back} />
      </Screen>
    );
  }

  const f = farmer.data;
  const qty = Math.min(qtyWanted, l.quantityKg); // never more than is available
  const goods = qty * l.askingPricePerKg;
  const total = goods + DELIVERY_FEE;
  const grade = GRADES.find((g) => g.id === l.grade);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const payment = await charge(method, total);
      const orderId = await placeOrder({ user, profile, listing: l, quantityKg: qty, paymentMethod: method, payment });
      router.replace(payment.ok ? `/order/${orderId}` : `/payment/${orderId}`);
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }

  return (
    <Screen
      header={header}
      gap={12}
      footer={
        <>
          <ErrorText error={error} />
          <Button title={t('Pay {amount} with {method}', { amount: formatLKR(total), method: t(METHOD_LABEL[method]) })} onPress={pay} loading={busy} disabled={listing.fromCache} />
          <Text style={[type.caption, styles.muted, { textAlign: 'center' }]}>
            {t('Paid through {method} · we never see or store your card number', { method: t(METHOD_LABEL[method]) })}
          </Text>
        </>
      }
    >
      {listing.fromCache ? <OfflineBanner detail="Saved information. Paying needs internet." /> : null}

      <Card>
        <View style={styles.between}>
          <Text style={[type.title, styles.ink, { flex: 1 }]}>{l.farmerName}</Text>
          {l.farmerVerified ? <Chip label="Verified farmer" tone="done" /> : <Chip label="Not verified" tone="alert" />}
        </View>
        <Text style={[type.caption, styles.muted, { marginTop: 3 }]}>
          {f?.createdAt ? t('{place} · selling since {when}', { place: l.farmerVillage, when: formatMonthYear(f.createdAt) }) : l.farmerVillage}
        </Text>
        {f?.ratingCount ? (
          <Text style={[type.body, styles.ink, { marginTop: 8 }]}>
            {t('{rating} from {n} buyers', { rating: f.rating?.toFixed(1), n: f.ratingCount })}
          </Text>
        ) : null}
        {f?.verifiedBy ? (
          <Text style={[type.caption, styles.muted, { marginTop: 4 }]}>
            {t('Identity checked in person — {who}, {date}.', { who: t(f.verifiedBy), date: formatFullDate(f.verifiedAt) })}
          </Text>
        ) : null}
      </Card>

      <Card>
        <LineItem label="Harvested" value={formatDay(l.harvestDate)} />
        <LineItem label="Grade" value={`${l.grade} — ${t(grade?.detail ?? '')}`} />
        <LineItem label="Available" value={`${l.quantityKg} kg`} />
        <LineItem label="Price" value={formatPerKg(l.askingPricePerKg)} />
        <LineItem label="Collection area" value={t('{place} · delivers to {to}', { place: l.farmerVillage, to: profile?.village ?? t('you') })} />
      </Card>

      <Card>
        <Text style={[type.label, styles.muted]}>Your order</Text>
        <View style={[styles.between, { marginTop: 8 }]}>
          <Text style={[type.body, styles.ink]}>Quantity</Text>
          <Stepper value={qty} onChange={setQty} min={1} max={l.quantityKg} step={qty >= 10 ? 5 : 1} />
        </View>
        <Divider />
        <LineItem label={`${t('{crop} {kg} kg', { crop: cropLabel(l.crop), kg: qty })} × ${formatLKR(l.askingPricePerKg)}`} amount={goods} />
        <LineItem label={t('Delivery to {to}', { to: profile?.village ?? t('you') })} amount={DELIVERY_FEE} />
        <Divider />
        <View style={styles.between}>
          <Text style={[type.heading, styles.ink]}>Total</Text>
          <Text style={[type.display, styles.ink, { fontSize: 26, lineHeight: 32 }]}>{formatLKR(total)}</Text>
        </View>
      </Card>

      <Notice tone="field" title="Your money is held until you confirm">
        {t('{farmer} is paid only after the {crop} arrives and you accept it. If the order is late, damaged or short, report it within 2 hours of arrival and you are refunded.', {
          farmer: l.farmerName.split(' ')[0],
          crop: cropLabel(l.crop).toLowerCase(),
        })}
      </Notice>

      <FieldLabel>Pay with</FieldLabel>
      <ChoiceGrid columns={0} value={method} onChange={setMethod} options={METHODS} />

      <Divider />
      {offering ? (
        <WholeLotOffer listing={l} onClose={() => setOffering(false)} />
      ) : (
        <Button title={t('Buying all {kg} kg? Make an offer', { kg: l.quantityKg })} variant="secondary" onPress={() => setOffering(true)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  pair: { flexDirection: 'row', gap: 10 },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
