// S03 Offers — Ranaweera
// Ranked by what the farmer receives, highest first (F02). The net is the stored
// netToFarmer — never recomputed here.
// CRUD: read offers; status is updated on accept (via Review agreement).
import { query, where } from '@react-native-firebase/firestore';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import Card, { Divider } from '../../../components/Card';
import ChoiceGrid from '../../../components/ChoiceGrid';
import Chip from '../../../components/Chip';
import EmptyState from '../../../components/EmptyState';
import FarmerHeader from '../../../components/FarmerHeader';
import { MoneyFigure } from '../../../components/LineItem';
import Notice from '../../../components/Notice';
import Screen from '../../../components/Screen';
import { ErrorText, Loading, OfflineBanner } from '../../../components/StatusViews';
import { updateAskingPrice } from '../../../lib/actions';
import { useAuth } from '../../../lib/auth';
import { formatDay } from '../../../lib/dates';
import { COL, col } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel, guidanceFor } from '../../../lib/market';
import { calcNet, formatDeduction, formatLKR, formatPerKg } from '../../../lib/money';
import { useQuery } from '../../../lib/useFirestore';
import { color, type } from '../../../theme';

function OfferCard({ offer, rank }) {
  const { t } = useI18n();
  const top = rank === 1;
  const terms = offer.paymentTerms === '7-days' ? t('pays in 7 days') : t('pays on collection');
  return (
    <Card padding={14} style={top && styles.topCard}>
      <View style={styles.between}>
        <View style={{ flex: 1 }}>
          <Text style={[type.heading, styles.ink]}>{rank}. {offer.buyerName}</Text>
          <Text style={[type.caption, styles.muted, { marginTop: 3 }]}>
            {`${offer.buyerPurchases ? t('{n} past purchases', { n: offer.buyerPurchases }) : t('No past purchases')} · ${terms}`}
          </Text>
        </View>
        <Chip label={offer.buyerVerified ? 'Verified buyer' : 'Not verified'} tone={offer.buyerVerified ? 'done' : 'alert'} />
      </View>
      <Divider style={{ marginVertical: 8 }} />
      <Text style={[type.caption, styles.muted]}>
        {`${formatPerKg(offer.pricePerKg)} × ${offer.quantityKg} kg ${formatDeduction(offer.feeAmount)} ${t('fee')}`}
      </Text>
      <View style={[styles.between, { alignItems: 'flex-end', marginTop: 2 }]}>
        <MoneyFigure amount={offer.netToFarmer} size="medium" />
        <Button
          title="Review"
          compact
          variant={top ? 'primary' : 'secondary'}
          onPress={() => router.push(`/agreement/new?offer=${offer.id}`)}
          style={{ width: 118 }}
        />
      </View>
    </Card>
  );
}

function NoOffers({ listing }) {
  const { t } = useI18n();
  const guide = guidanceFor(listing.crop, listing.grade);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const suggested = guide && listing.askingPricePerKg > guide.mid ? guide.mid : null;

  async function lower() {
    setBusy(true);
    try {
      await updateAskingPrice(listing.id, suggested);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <EmptyState
      icon="inbox"
      title="No offers yet"
      body={t('Your {crop} was listed on {date} and seen by {n} buyers. Offers usually arrive within 2 days.', {
        crop: cropLabel(listing.crop).toLowerCase(),
        date: formatDay(listing.createdAt),
        n: listing.viewCount ?? 0,
      })}
    >
      {suggested ? (
        <>
          <Notice title="If no offer comes in 2 days">
            {t('Lowering your asking price to {price}/kg would put you at the middle of this week’s guidance range. You would receive about {amount} after fees.', {
              price: formatLKR(suggested),
              amount: formatLKR(calcNet(suggested, listing.quantityKg).net),
            })}
          </Notice>
          <ErrorText error={error} />
          <Button title="Lower asking price" onPress={lower} loading={busy} />
        </>
      ) : null}
      <Button title="Keep waiting" variant="secondary" onPress={() => router.navigate('/home')} />
    </EmptyState>
  );
}

export default function Offers() {
  const { user } = useAuth();
  const { t } = useI18n();
  const uid = user?.uid;
  const params = useLocalSearchParams();

  const offers = useQuery(() => (uid ? query(col(COL.offers), where('farmerId', '==', uid)) : null), [uid]);
  const listings = useQuery(() => (uid ? query(col(COL.listings), where('farmerId', '==', uid)) : null), [uid]);

  const live = (listings.data ?? []).filter((l) => l.status === 'live');
  const pending = (offers.data ?? []).filter((o) => o.status === 'pending');
  const withOffers = live.filter((l) => pending.some((o) => o.listingId === l.id));

  const [picked, setPicked] = useState(null);
  const listingId = picked ?? params.listing ?? withOffers[0]?.id ?? live[0]?.id;
  const listing = live.find((l) => l.id === listingId);
  const ranked = pending.filter((o) => o.listingId === listingId).sort((a, b) => b.netToFarmer - a.netToFarmer);
  const guide = listing ? guidanceFor(listing.crop, listing.grade) : null;

  const loading = offers.loading || listings.loading;

  return (
    <Screen
      gap={8}
      header={
        <FarmerHeader
          title="Offers"
          subtitle={listing ? t('{crop} {kg} kg · {n} offers', { crop: cropLabel(listing.crop), kg: listing.quantityKg, n: ranked.length }) : undefined}
        />
      }
    >
      {offers.fromCache ? <OfflineBanner detail="Offers shown were saved earlier. You cannot accept one until you are back online." /> : null}
      {loading ? <Loading /> : null}

      {live.length > 1 ? (
        <ChoiceGrid
          columns={0}
          value={listingId}
          onChange={setPicked}
          options={live.map((l) => ({ id: l.id, label: t('{crop} {kg} kg', { crop: cropLabel(l.crop), kg: l.quantityKg }) }))}
        />
      ) : null}

      {!loading && !live.length ? (
        <EmptyState icon="inbox" title="No live listings" body="Offers arrive on produce you have listed.">
          <Button title="List produce" onPress={() => router.push('/listing-new')} />
        </EmptyState>
      ) : null}

      {listing && guide ? (
        <Notice title={t('Guidance: {low}–{high}/kg', { low: formatLKR(guide.low), high: guide.high })}>
          {t('Grade {grade} {crop} · Dambulla average, not a guaranteed price', { grade: listing.grade, crop: cropLabel(listing.crop).toLowerCase() })}
        </Notice>
      ) : null}

      {ranked.length ? (
        <Text style={[type.caption, styles.ink, { paddingVertical: 8 }]}>
          {t('Sorted by what you receive — highest first')}
        </Text>
      ) : null}

      {ranked.map((o, i) => (
        <OfferCard key={o.id} offer={o} rank={i + 1} />
      ))}

      {listing && !ranked.length && !loading ? <NoOffers listing={listing} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  topCard: { borderColor: color.field, borderWidth: 2 },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
