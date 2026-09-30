// S04 Review agreement — Ranaweera
//   /agreement/new?offer=<offerId>  review before accepting (every deduction listed)
//   /agreement/AG-2214              the confirmed agreement: what is fixed, what can still change
import { query, where } from '@react-native-firebase/firestore';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import Button from '../../../components/Button';
import Card, { Divider } from '../../../components/Card';
import Chip from '../../../components/Chip';
import FarmerHeader from '../../../components/FarmerHeader';
import { LineItem, MoneyFigure } from '../../../components/LineItem';
import Notice from '../../../components/Notice';
import Screen from '../../../components/Screen';
import { ErrorText, Loading, OfflineBanner } from '../../../components/StatusViews';
import Text from '../../../components/Text';
import { acceptOffer, paymentDueDate } from '../../../lib/actions';
import { useAuth } from '../../../lib/auth';
import { addDays, formatDay, formatDayTime, formatTime } from '../../../lib/dates';
import { COL, col, ref } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel } from '../../../lib/market';
import { formatDeduction, formatLKR, formatPerKg } from '../../../lib/money';
import { useDocument, useQuery } from '../../../lib/useFirestore';
import { color, type } from '../../../theme';

function tomorrowMorning() {
  const d = addDays(new Date(), 1);
  d.setHours(7, 0, 0, 0);
  return d;
}

function Review({ offerId }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const offer = useDocument(() => ref(COL.offers, offerId), [offerId]);
  const listingId = offer.data?.listingId;
  const listing = useDocument(() => (listingId ? ref(COL.listings, listingId) : null), [listingId]);
  const siblings = useQuery(
    () => (user && listingId ? query(col(COL.offers), where('farmerId', '==', user.uid), where('listingId', '==', listingId)) : null),
    [user?.uid, listingId],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (offer.loading || listing.loading) return <Loading />;
  const o = offer.data;
  const l = listing.data;
  if (!o || !l) return <Notice tone="alert" title="This offer is no longer available">It may have been withdrawn or already accepted.</Notice>;
  if (o.status !== 'pending') {
    return <Notice tone="alert" title="This offer has already been answered">{t('Its status is “{status}”.', { status: t(o.status) })}</Notice>;
  }

  const collection = tomorrowMorning();
  const paidBy = o.paymentTerms === '7-days' ? addDays(collection, 7) : collection;

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const others = (siblings.data ?? []).filter((s) => s.id !== o.id && s.status === 'pending').map((s) => s.id);
      const id = await acceptOffer({ offer: o, listing: l, otherOfferIds: others });
      router.replace(`/agreement/${id}`);
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }

  return (
    <>
      {offer.fromCache ? <OfflineBanner detail="You can read this offer, but accepting it needs internet." /> : null}
      <Card>
        <MoneyFigure
          label="You will receive"
          amount={o.netToFarmer}
          detail={
            o.paymentTerms === '7-days'
              ? t('Paid by {date} — 7 days after collection', { date: formatDay(paidBy) })
              : t('Paid on the day of collection')
          }
        />
      </Card>
      <Card>
        <LineItem label="Produce" value={t('{crop} · Grade {grade}', { crop: cropLabel(l.crop), grade: l.grade })} />
        <LineItem label="Quantity" value={`${o.quantityKg} kg`} />
        <LineItem label="Price agreed" value={`${formatLKR(o.pricePerKg)} / kg`} />
        <Divider />
        <LineItem label="Offer total" amount={o.grossTotal} />
        <LineItem label="Platform fee (3%)" amount={o.feeAmount} deduction />
        <LineItem label="Transport" value={t('Paid by buyer')} />
        <Divider />
        <LineItem label="Collected by" value={t('Booked after you accept')} />
        <LineItem label="Collection" value={formatDayTime(collection)} />
      </Card>
      <Notice title="These are all the deductions.">
        {t('No other fee is taken at collection or at payment. If the weight recorded at collection differs from {kg} kg, you are asked to agree before anything is paid.', { kg: o.quantityKg })}
      </Notice>
      <ErrorText error={error} />
      <Button title={t('Accept — {amount}', { amount: formatLKR(o.netToFarmer) })} onPress={accept} loading={busy} disabled={offer.fromCache} />
      <Button title="Go back to offers" variant="secondary" onPress={router.back} />
    </>
  );
}

function Confirmed({ id }) {
  const { t } = useI18n();
  const agreement = useDocument(() => ref(COL.agreements, id), [id]);
  if (agreement.loading) return <Loading />;
  const a = agreement.data;
  if (!a) return <Notice tone="alert" title="Agreement not found">{t('There is no agreement {id} on this account.', { id })}</Notice>;

  const due = paymentDueDate(a);
  const changeBy = addDays(a.collectionTime, -1);
  changeBy?.setHours(18, 0, 0, 0);

  function download() {
    Share.share({
      title: t('Agreement {id}', { id: a.id }),
      message: [
        t('Agreement {id} — agro', { id: a.id }),
        t('{crop} Grade {grade}, {kg} kg', { crop: cropLabel(a.crop), grade: a.grade, kg: a.agreedQuantityKg }),
        t('Seller: {farmer} · Buyer: {buyer}', { farmer: a.farmerName, buyer: a.buyerName }),
        t('Price: {price}', { price: formatPerKg(a.agreedPricePerKg) }),
        t('Offer total {total}, platform fee {fee}', { total: formatLKR(a.grossTotal), fee: formatDeduction(a.feeAmount) }),
        t('Farmer receives {net} by {date}', { net: formatLKR(a.netToFarmer), date: formatDay(due) }),
        t('Collection: {time} · transport paid by buyer', { time: formatDayTime(a.collectionTime) }),
      ].join('\n'),
    });
  }

  return (
    <>
      {agreement.fromCache ? <OfflineBanner /> : null}
      <Card>
        <Text style={[type.title, styles.ink]}>{t('Agreed with {buyer}', { buyer: a.buyerName })}</Text>
        <Text style={[type.caption, styles.muted, { marginTop: 4 }]}>
          {t('Confirmed {date}, {time} · Agreement no. {id}', { date: formatDay(a.createdAt), time: formatTime(a.createdAt), id: a.id })}
        </Text>
        <Divider />
        <MoneyFigure label="You will receive" amount={a.finalNet ?? a.netToFarmer} detail={t('Expected {date}', { date: formatDay(due) })} />
      </Card>

      <Text style={[type.label, styles.muted]}>Now fixed — cannot change</Text>
      <Card padding={14} style={{ gap: 12 }}>
        <View style={styles.between}>
          <Text style={[type.body, styles.ink, { flex: 1 }]}>
            {t('Price {price} · {kg} kg · fee {fee}', { price: formatPerKg(a.agreedPricePerKg), kg: a.agreedQuantityKg, fee: formatLKR(a.feeAmount) })}
          </Text>
          <Chip label="Fixed" tone="done" />
        </View>
        <View style={styles.between}>
          <Text style={[type.body, styles.ink, { flex: 1 }]}>Buyer pays transport</Text>
          <Chip label="Fixed" tone="done" />
        </View>
      </Card>

      <Text style={[type.label, styles.muted]}>Can still change</Text>
      <Card padding={14} style={{ gap: 12 }}>
        <View style={styles.between}>
          <View style={{ flex: 1 }}>
            <Text style={[type.body, styles.ink]}>{t('Collection time — {time}', { time: formatDayTime(a.collectionTime) })}</Text>
            <Text style={[type.caption, styles.muted, { marginTop: 2 }]}>
              {a.transporterName
                ? t('Agree a new time with {name} up to {time}', { name: a.transporterName.split(' ')[0], time: formatDayTime(changeBy) })
                : t('A transporter is being booked for this collection')}
            </Text>
          </View>
          <Chip label="Editable" />
        </View>
        <View style={styles.between}>
          <View style={{ flex: 1 }}>
            <Text style={[type.body, styles.ink]}>Final weight at collection</Text>
            <Text style={[type.caption, styles.muted, { marginTop: 2 }]}>Recorded on the day — you confirm it before payment</Text>
          </View>
          <Chip label={a.weightConfirmed === 'confirmed' ? 'Confirmed' : 'Pending'} tone={a.weightConfirmed === 'confirmed' ? 'done' : 'neutral'} />
        </View>
      </Card>

      <Button title="See collection and payout" onPress={() => router.push(`/collection/${a.id}`)} />
      <Button title="Download agreement" variant="secondary" onPress={download} />
    </>
  );
}

export default function Agreement() {
  const { id, offer } = useLocalSearchParams();
  const reviewing = id === 'new';
  return (
    <Screen header={<FarmerHeader title={reviewing ? 'Review agreement' : 'Agreement confirmed'} onBack={router.back} />}>
      {reviewing ? <Review offerId={offer} /> : <Confirmed id={id} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
