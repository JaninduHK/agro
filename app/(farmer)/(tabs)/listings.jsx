// S06 My listings — Ranaweera
// CRUD: read listings, update asking price, delete listing (and drafts).
import { query, where } from '@react-native-firebase/firestore';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import Card, { Divider } from '../../../components/Card';
import Chip from '../../../components/Chip';
import EmptyState from '../../../components/EmptyState';
import FarmerHeader from '../../../components/FarmerHeader';
import Field from '../../../components/Field';
import { MoneyFigure } from '../../../components/LineItem';
import Notice from '../../../components/Notice';
import Screen from '../../../components/Screen';
import { ErrorText, Loading, OfflineBanner } from '../../../components/StatusViews';
import TopTabs from '../../../components/TopTabs';
import { deleteListing, updateAskingPrice } from '../../../lib/actions';
import { useAuth } from '../../../lib/auth';
import { daysAgo, formatShortDay, formatTime, timeLeft } from '../../../lib/dates';
import { COL, col } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel, guidanceFor, listingTitle } from '../../../lib/market';
import { formatLKR, formatPerKg } from '../../../lib/money';
import { useQuery } from '../../../lib/useFirestore';
import { color, font, type } from '../../../theme';

const firstName = (n = '') => n.split(' ')[0];

function PriceEditor({ listing, onDone }) {
  const [price, setPrice] = useState(String(listing.askingPricePerKg ?? ''));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const n = Number(price);

  async function save() {
    setBusy(true);
    try {
      await updateAskingPrice(listing.id, n);
      onDone();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 10, marginTop: 12 }}>
      <Field label="New asking price" value={price} onChangeText={setPrice} keyboardType="number-pad" suffix="Rs / kg" />
      <ErrorText error={error} />
      <View style={styles.pair}>
        <Button title="Cancel" variant="secondary" compact onPress={onDone} style={{ flex: 1 }} />
        <Button title="Save price" compact onPress={save} disabled={!(n > 0)} loading={busy} style={{ flex: 1.4 }} />
      </View>
    </View>
  );
}

function LiveCard({ listing, offers }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const pending = offers.filter((o) => o.status === 'pending').sort((a, b) => b.netToFarmer - a.netToFarmer);
  const best = pending[0];
  const guide = guidanceFor(listing.crop, listing.grade);
  const left = best ? timeLeft(best.expiresAt) : null;

  function remove() {
    Alert.alert(t('Remove this listing?'), t('Buyers will no longer see it. Offers already sent are cancelled.'), [
      { text: t('Keep it'), style: 'cancel' },
      { text: t('Remove'), style: 'destructive', onPress: () => deleteListing(listing.id) },
    ]);
  }

  return (
    <Card>
      <View style={styles.between}>
        <View style={{ flex: 1 }}>
          <Text style={[type.heading, styles.ink]}>{listingTitle(listing)}</Text>
          <Text style={[type.caption, styles.muted, { marginTop: 3 }]}>
            {t('Asked {price} · harvested {date}', { price: formatPerKg(listing.askingPricePerKg), date: formatShortDay(listing.harvestDate) })}
          </Text>
        </View>
        <Chip label="Live" tone="done" />
      </View>
      <Divider />
      {best ? (
        <>
          <Text style={[type.caption, styles.ink, styles.bold]}>
            {pending.length === 1
              ? t('1 offer · best {price}', { price: formatPerKg(best.pricePerKg) })
              : t('{n} offers · best {price}', { n: pending.length, price: formatPerKg(best.pricePerKg) })}
          </Text>
          <MoneyFigure label="Best offer pays you" amount={best.netToFarmer} size="medium" style={{ marginTop: 8 }} />
          <Text style={[type.caption, styles.muted, { marginTop: 4 }]}>
            {left
              ? t('Seen by {n} buyers · best offer ends in {time}', { n: listing.viewCount ?? 0, time: left })
              : t('Seen by {n} buyers', { n: listing.viewCount ?? 0 })}
          </Text>
          <View style={[styles.pair, { marginTop: 12 }]}>
            <Button title="See offers" compact onPress={() => router.push(`/offers?listing=${listing.id}`)} style={{ flex: 1.4 }} />
            <Button title="Edit" variant="secondary" compact onPress={() => setEditing(true)} style={{ flex: 1 }} />
          </View>
        </>
      ) : (
        <>
          <Text style={[type.caption, styles.muted]}>{t('No offers yet · listed {when}', { when: daysAgo(listing.createdAt) })}</Text>
          {guide ? (
            <Text style={[type.caption, styles.ink, { marginTop: 6 }]}>
              {`${t('Guidance {low}–{high}/kg', { low: formatLKR(guide.low), high: guide.high })} — ${
                listing.askingPricePerKg > guide.high
                  ? t('your price is above the range.')
                  : listing.askingPricePerKg < guide.low
                    ? t('your price is below the range.')
                    : t('your price is inside the range.')
              }`}
            </Text>
          ) : null}
          {!editing ? (
            <View style={[styles.pair, { marginTop: 12 }]}>
              <Button title="Lower price" variant="secondary" compact onPress={() => setEditing(true)} style={{ flex: 1 }} />
              <Button title="Remove" variant="danger" compact onPress={remove} style={{ flex: 1 }} />
            </View>
          ) : null}
        </>
      )}
      {editing ? <PriceEditor listing={listing} onDone={() => setEditing(false)} /> : null}
    </Card>
  );
}

function DraftCard({ listing }) {
  const { t } = useI18n();
  function remove() {
    Alert.alert(t('Delete this draft?'), t('What was entered so far will be lost.'), [
      { text: t('Keep it'), style: 'cancel' },
      { text: t('Delete'), style: 'destructive', onPress: () => deleteListing(listing.id) },
    ]);
  }
  return (
    <Card>
      <View style={styles.between}>
        <View style={{ flex: 1 }}>
          <Text style={[type.heading, styles.ink]}>{t('{what} — not finished', { what: listing.crop ? cropLabel(listing.crop) : t('New listing') })}</Text>
          <Text style={[type.caption, styles.muted, { marginTop: 3 }]}>
            {[
              t('Step {n} of {total}', { n: listing.draftStep ?? 1, total: 4 }),
              listing.savedAt
                ? listing.savedBy
                  ? t('saved {time} by {name}', { time: formatTime(listing.savedAt), name: firstName(listing.savedBy) })
                  : t('saved {time}', { time: formatTime(listing.savedAt) })
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        <Chip label="Draft" />
      </View>
      <View style={[styles.pair, { marginTop: 12 }]}>
        <Button title="Continue this draft" compact onPress={() => router.push(`/listing-new?draft=${listing.id}`)} style={{ flex: 1.6 }} />
        <Button title="Delete" variant="danger" compact onPress={remove} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

function SoldCard({ listing }) {
  const { t } = useI18n();
  return (
    <Card>
      <View style={styles.between}>
        <View style={{ flex: 1 }}>
          <Text style={[type.heading, styles.ink]}>{listingTitle(listing)}</Text>
          <Text style={[type.caption, styles.muted, { marginTop: 3 }]}>
            {t('Harvested {date} · asked {price}', { date: formatShortDay(listing.harvestDate), price: formatPerKg(listing.askingPricePerKg) })}
          </Text>
        </View>
        <Chip label="Sold" tone="done" />
      </View>
    </Card>
  );
}

export default function MyListings() {
  const { user } = useAuth();
  const { t } = useI18n();
  const uid = user?.uid;
  const [tab, setTab] = useState('live');

  const listings = useQuery(() => (uid ? query(col(COL.listings), where('farmerId', '==', uid)) : null), [uid]);
  const offers = useQuery(() => (uid ? query(col(COL.offers), where('farmerId', '==', uid)) : null), [uid]);

  const all = (listings.data ?? []).sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  const groups = {
    live: all.filter((l) => l.status === 'live'),
    sold: all.filter((l) => l.status === 'sold'),
    draft: all.filter((l) => l.status === 'draft'),
  };
  const shown = groups[tab];

  return (
    <Screen
      header={
        <FarmerHeader
          title="My listings"
          below={
            <TopTabs
              value={tab}
              onChange={setTab}
              tabs={[
                { id: 'live', label: t('Live ({n})', { n: groups.live.length }) },
                { id: 'sold', label: t('Sold ({n})', { n: groups.sold.length }) },
                { id: 'draft', label: t('Drafts ({n})', { n: groups.draft.length }) },
              ]}
            />
          }
        />
      }
    >
      {listings.fromCache ? <OfflineBanner /> : null}
      {listings.loading ? <Loading /> : null}

      {!listings.loading && !all.length ? (
        <EmptyState
          icon="package"
          title="You have no listings yet"
          body="List what you have ready to sell. Buyers see your crop, grade, quantity and harvest date, and send you offers."
        >
          <Notice title="Beans guidance this week: Rs 170–205/kg">Dambulla market average · guidance only</Notice>
          <Button title="List produce" onPress={() => router.push('/listing-new')} />
        </EmptyState>
      ) : null}

      {all.length && !shown.length ? (
        <Text style={[type.body, styles.muted, { textAlign: 'center', paddingVertical: 24 }]}>
          {tab === 'live' ? 'Nothing live right now.' : tab === 'sold' ? 'Nothing sold yet.' : 'No drafts.'}
        </Text>
      ) : null}

      {shown.map((l) =>
        tab === 'live' ? (
          <LiveCard key={l.id} listing={l} offers={(offers.data ?? []).filter((o) => o.listingId === l.id)} />
        ) : tab === 'draft' ? (
          <DraftCard key={l.id} listing={l} />
        ) : (
          <SoldCard key={l.id} listing={l} />
        ),
      )}

      {all.length ? (
        <Button title="List new produce" variant="secondary" onPress={() => router.push('/listing-new')} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  pair: { flexDirection: 'row', gap: 10 },
  muted: { color: color.muted },
  ink: { color: color.ink },
  bold: { fontFamily: font.semibold },
});
