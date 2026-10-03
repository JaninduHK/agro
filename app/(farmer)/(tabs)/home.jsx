// S00 Farmer home — Sahanya
// One thing at the top: whatever needs the farmer's decision now (a weight to
// confirm, a paid order to accept, then the best offer), otherwise the next
// scheduled event. Offline, it shows what is saved and says what cannot be done.
import { query, where } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Button from '../../../components/Button';
import Card, { Divider, Inset } from '../../../components/Card';
import Chip from '../../../components/Chip';
import FarmerHeader from '../../../components/FarmerHeader';
import { LineItem, MoneyFigure } from '../../../components/LineItem';
import Row from '../../../components/Row';
import Screen from '../../../components/Screen';
import { Loading, OfflineBanner } from '../../../components/StatusViews';
import Text from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { formatDay, formatDayTime, formatShortDay, formatTime, greeting, timeLeft } from '../../../lib/dates';
import { COL, col } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel, guidanceFor, listingTitle } from '../../../lib/market';
import { formatLKR, formatPerKg } from '../../../lib/money';
import { useQuery } from '../../../lib/useFirestore';
import { color, font, type } from '../../../theme';

const millis = (ts) => ts?.toMillis?.() ?? 0;

export default function FarmerHome() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const uid = user?.uid;
  const mine = (name) => () => (uid ? query(col(name), where('farmerId', '==', uid)) : null);

  const offers = useQuery(mine(COL.offers), [uid]);
  const listings = useQuery(mine(COL.listings), [uid]);
  const agreements = useQuery(mine(COL.agreements), [uid]);
  const orders = useQuery(mine(COL.orders), [uid]);

  const offline = offers.fromCache || listings.fromCache || agreements.fromCache;
  const loading = offers.loading || listings.loading || agreements.loading;

  const pending = (offers.data ?? []).filter((o) => o.status === 'pending').sort((a, b) => b.netToFarmer - a.netToFarmer);
  const best = pending[0];
  const bestListing = best && (listings.data ?? []).find((l) => l.id === best.listingId);
  const offersOnBest = best ? pending.filter((o) => o.listingId === best.listingId).length : 0;

  const allAgreements = agreements.data ?? [];
  const weighing = allAgreements.find((a) => a.status === 'weight-pending');
  const upcoming = allAgreements.filter((a) => a.status === 'agreed').sort((a, b) => millis(a.collectionTime) - millis(b.collectionTime))[0];
  const paid = allAgreements.filter((a) => a.status === 'paid').sort((a, b) => millis(b.paidAt) - millis(a.paidAt));
  const live = (listings.data ?? []).filter((l) => l.status === 'live');

  // Paid retail orders waiting for the farmer, and ones on their way.
  const allOrders = (orders.data ?? []).filter((o) => o.paymentStatus !== 'failed');
  const newOrder = allOrders.filter((o) => o.status === 'placed').sort((a, b) => millis(a.createdAt) - millis(b.createdAt))[0];
  const moving = allOrders.filter((o) => ['accepted', 'in-transit', 'delivered', 'problem'].includes(o.status));

  const left = best ? timeLeft(best.expiresAt) : null;
  const guide = best && bestListing ? guidanceFor(bestListing.crop, bestListing.grade) : null;
  const decision = weighing ? 'weight' : newOrder ? 'order' : best && bestListing ? 'offer' : null;

  return (
    <Screen header={<FarmerHeader eyebrow={greeting()} title={profile?.fullName ?? ''} onProfile={() => router.push('/profile')} tone={offline ? 'alert' : 'default'} />}>
      {offline ? <OfflineBanner /> : null}
      {loading && !offline ? <Loading label="Checking for new offers…" /> : null}

      {decision === 'weight' ? (
        <Card>
          <View style={styles.between}>
            <Text style={[type.label, styles.muted]}>Check the weight</Text>
            <Chip label="Happening now" tone="time" />
          </View>
          <Text style={[type.title, styles.ink, { marginTop: 10 }]}>
            {t('{kg} kg recorded', { kg: weighing.actualWeightKg })}
          </Text>
          <Text style={[type.body, styles.muted, { marginTop: 2 }]}>
            {t('{crop} · agreed {kg} kg · {name}, {time}', {
              crop: cropLabel(weighing.crop),
              kg: weighing.agreedQuantityKg,
              name: weighing.transporterName ?? t('transporter'),
              time: formatTime(weighing.weightRecordedAt),
            })}
          </Text>
          <Divider />
          <MoneyFigure label="You would receive" amount={weighing.finalNet} />
          <Button title="Check and confirm" onPress={() => router.push(`/collection/${weighing.id}`)} style={{ marginTop: 14 }} />
        </Card>
      ) : null}

      {decision === 'order' ? (
        <Card>
          <View style={styles.between}>
            <Text style={[type.label, styles.muted]}>New order — already paid</Text>
            <Chip label="Needs your answer" />
          </View>
          <Text style={[type.title, styles.ink, { marginTop: 10 }]}>{newOrder.buyerName}</Text>
          <Text style={[type.body, styles.muted, { marginTop: 2 }]}>
            {t('{crop} {kg} kg · deliver to {place}', { crop: cropLabel(newOrder.crop), kg: newOrder.quantityKg, place: newOrder.deliverTo ?? '' })}
          </Text>
          <Divider />
          <MoneyFigure label="You receive" amount={newOrder.netToFarmer} />
          <Button title="See the order" onPress={() => router.push(`/sale/${newOrder.id}`)} style={{ marginTop: 14 }} />
        </Card>
      ) : null}

      {decision === 'offer' ? (
        <Card>
          <View style={styles.between}>
            <Text style={[type.label, styles.muted]}>{offline ? 'Saved · may have changed' : 'New offer'}</Text>
            {left ? <Chip label={t('Ends in {time}', { time: left })} tone="time" /> : null}
          </View>
          <Text style={[type.title, styles.ink, { marginTop: 10 }]}>{best.buyerName}</Text>
          <Text style={[type.body, styles.muted, { marginTop: 2 }]}>
            {listingTitle(bestListing)} · {formatPerKg(best.pricePerKg)}
          </Text>
          <Divider style={{ marginVertical: 14 }} />
          <LineItem label="Offer total" amount={best.grossTotal} />
          <LineItem label="Platform fee" amount={best.feeAmount} deduction />
          <Divider />
          <MoneyFigure label="You receive" amount={best.netToFarmer} />
          {guide ? (
            <Inset style={{ marginTop: 14 }}>
              <Text style={[type.caption, styles.ink, styles.bold]}>
                {t('Guidance: {low}–{high}/kg for Grade {grade} {crop} this week', {
                  low: formatLKR(guide.low),
                  high: guide.high,
                  grade: bestListing.grade,
                  crop: cropLabel(bestListing.crop).toLowerCase(),
                })}
              </Text>
              <Text style={[type.caption, styles.muted, { marginTop: 2 }]}>
                Dambulla market average. Guidance only — not a guaranteed price.
              </Text>
            </Inset>
          ) : null}
          <View style={{ gap: 10, marginTop: 14 }}>
            {offline ? (
              <>
                <Text style={[type.caption, styles.ink]}>
                  {best.expiresAt
                    ? t('You cannot accept an offer while offline. Nothing is lost — the offer is still held for you until {time}.', { time: formatTime(best.expiresAt) })
                    : t('You cannot accept an offer while offline. Nothing is lost — the offer is still held for you.')}
                </Text>
                <Button title="Accept offer — needs internet" disabled />
              </>
            ) : (
              <Button title="Accept offer" onPress={() => router.push(`/agreement/new?offer=${best.id}`)} />
            )}
            {offersOnBest > 1 ? (
              <Button
                title={t('Compare {n} offers', { n: offersOnBest })}
                variant="secondary"
                onPress={() => router.push(`/offers?listing=${best.listingId}`)}
              />
            ) : null}
          </View>
        </Card>
      ) : null}

      {!decision && !loading ? (
        <Card>
          <Text style={[type.label, styles.muted]}>{upcoming ? 'Next scheduled' : 'Today'}</Text>
          {upcoming ? (
            <>
              <Text style={[type.title, styles.ink, { marginTop: 10 }]}>
                {t('Lorry collects your {crop}', { crop: cropLabel(upcoming.crop).toLowerCase() })}
              </Text>
              <Text style={[type.heading, styles.ink, { marginTop: 2 }]}>{formatDayTime(upcoming.collectionTime)}</Text>
              <Text style={[type.body, styles.muted, { marginTop: 2 }]}>
                {t('{name} · {kg} kg', { name: upcoming.transporterName ?? t('Transporter being booked'), kg: upcoming.agreedQuantityKg })}
              </Text>
              <Divider />
            </>
          ) : null}
          <Text style={[type.body, styles.ink, { marginTop: upcoming ? 0 : 8 }]}>Nothing needs your decision today.</Text>
          <Text style={[type.caption, styles.muted, { marginTop: 2 }]}>
            {live.length ? 'Your listing is live. Offers usually arrive within 2 days.' : 'List what you have ready and buyers will send offers.'}
          </Text>
          <Button title="List new produce" onPress={() => router.push('/listing-new')} style={{ marginTop: 14 }} />
        </Card>
      ) : null}

      <Text style={[type.label, styles.muted, { marginTop: 2 }]}>Also happening</Text>

      {live.map((l) => (
        <Row
          key={l.id}
          title={t('{crop} {kg} kg · listed', { crop: cropLabel(l.crop), kg: l.quantityKg })}
          subtitle={`${formatShortDay(l.createdAt)} · ${
            l.offerCount ? t('{n} offers', { n: l.offerCount }) : t('{n} views · no offers yet', { n: l.viewCount ?? 0 })
          }`}
          right={<Chip label={offline ? 'Saved' : 'Live'} tone={offline ? 'neutral' : 'done'} />}
          onPress={() => router.push('/listings')}
        />
      ))}
      {moving.map((o) => (
        <Row
          key={o.id}
          title={t('{crop} {kg} kg to {buyer}', { crop: cropLabel(o.crop), kg: o.quantityKg, buyer: o.buyerName })}
          subtitle={`${o.id} · ${o.transporterName ?? t('transporter being booked')}`}
          right={
            <Chip
              label={o.status === 'problem' ? 'Problem reported' : o.status === 'delivered' ? 'Delivered' : o.status === 'in-transit' ? 'On the way' : 'Accepted'}
              tone={o.status === 'problem' ? 'alert' : 'done'}
            />
          }
          onPress={() => router.push(`/sale/${o.id}`)}
        />
      ))}
      {upcoming && decision ? (
        <Row
          title="Lorry booked"
          subtitle={`${formatDayTime(upcoming.collectionTime)} · ${upcoming.transporterName ?? t('being assigned')}`}
          right={<Chip label={upcoming.transporterId ? 'Booked' : 'Pending'} tone={upcoming.transporterId ? 'done' : 'neutral'} />}
          onPress={() => router.push(`/collection/${upcoming.id}`)}
        />
      ) : null}
      {paid.slice(0, 2).map((a) => (
        <Row
          key={a.id}
          title={t('{amount} received', { amount: formatLKR(a.finalNet ?? a.netToFarmer) })}
          subtitle={`${t('{crop} {kg} kg', { crop: cropLabel(a.crop), kg: a.actualWeightKg ?? a.agreedQuantityKg })} · ${formatDay(a.paidAt)}`}
          right={<Chip label={offline ? 'Saved' : 'Paid'} tone={offline ? 'neutral' : 'done'} />}
          onPress={() => router.push(`/collection/${a.id}`)}
        />
      ))}
      {!live.length && !paid.length && !upcoming && !moving.length && !loading ? (
        <Text style={[type.caption, styles.muted]}>Nothing else yet. Listings and payments appear here.</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  muted: { color: color.muted },
  ink: { color: color.ink },
  bold: { fontFamily: font.semibold },
});
