// S13 Confirm collection — Karanayaka
// /collect/<jobId>. CRUD: create the collection record — time-stamped photos
// (FR-10) and the weight actually collected — on the shared agreement. The
// farmer then confirms that weight on their Collection & payout screen.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import AppBar from '../../../components/AppBar';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import Field from '../../../components/Field';
import Notice from '../../../components/Notice';
import Screen from '../../../components/Screen';
import { ErrorText, Loading } from '../../../components/StatusViews';
import Text from '../../../components/Text';
import { recordWeight } from '../../../lib/actions';
import { useAuth } from '../../../lib/auth';
import { formatTime } from '../../../lib/dates';
import { COL, ref } from '../../../lib/firestore';
import { useI18n } from '../../../lib/i18n';
import { cropLabel } from '../../../lib/market';
import { calcNet, formatLKR } from '../../../lib/money';
import { takePhoto, uploadPhoto } from '../../../lib/photos';
import { useDocument } from '../../../lib/useFirestore';
import { color, font, radius, type } from '../../../theme';

const firstName = (n = '') => n.split(' ')[0];

function StepTitle({ n, children }) {
  const { t } = useI18n();
  return <Text style={[type.heading, { color: color.ink }]}>{`${n} · ${t(children)}`}</Text>;
}

export default function ConfirmCollection() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const job = useDocument(() => ref(COL.jobs, id), [id]);
  const agreementId = job.data?.agreementId;
  const agreement = useDocument(() => (agreementId ? ref(COL.agreements, agreementId) : null), [agreementId]);

  const [photos, setPhotos] = useState([]);
  const [weight, setWeight] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const j = job.data;
  const a = agreement.data;
  const header = (
    <AppBar
      title="Confirm collection"
      subtitle={a ? `${a.farmerName} · ${j?.fromLocation}` : j ? `${j.fromLocation} → ${j.toLocation}` : undefined}
      onBack={router.back}
    />
  );

  if (job.loading || agreement.loading) return <Screen header={header}><Loading /></Screen>;
  if (!j) return <Screen header={header}><Notice tone="alert" title="Job not found">{t('There is no job {id}.', { id })}</Notice></Screen>;
  if (!a) {
    return (
      <Screen header={header}>
        <Notice title="No weight record for this job">
          This job is not linked to a farmer’s agreement, so there is no weight for the farmer to confirm. Mark it delivered from Jobs.
        </Notice>
      </Screen>
    );
  }

  const recorded = a.actualWeightKg != null && a.weightRecordedBy === user?.uid;
  const kg = Number(weight) || 0;
  const diff = kg - a.agreedQuantityKg;
  const paid = kg ? calcNet(a.agreedPricePerKg, kg, a.feePercent) : null;
  const farmer = firstName(a.farmerName);

  async function addPhoto() {
    try {
      const uri = await takePhoto();
      if (uri) setPhotos((p) => [...p, { uri, at: new Date() }]);
    } catch (e) {
      setError(e);
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const paths = [];
      for (const p of photos) paths.push(await uploadPhoto(`collections/${a.id}`, p.uri));
      await recordWeight({ user, job: j, agreement: a, weightKg: kg, photoPaths: paths });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const confirmation =
    a.weightConfirmed === 'confirmed'
      ? t('{name} has confirmed this weight.', { name: farmer })
      : a.weightConfirmed === 'disputed'
        ? t('{name} has questioned this weight — it is being checked.', { name: farmer })
        : t('{name} is asked to confirm it in their app before payment.', { name: farmer });

  return (
    <Screen
      header={header}
      gap={12}
      footer={
        recorded ? (
          <Button title="Back to jobs" onPress={() => router.navigate('/jobs')} />
        ) : (
          <>
            <ErrorText error={error} />
            <Button title="Save weight and photos" onPress={save} disabled={!photos.length || !kg} loading={busy} />
          </>
        )
      }
    >
      <Card>
        <View style={styles.between}>
          <View style={{ flex: 1 }}>
            <Text style={[type.heading, styles.ink]}>{j.fromLocation} → {j.toLocation}</Text>
            <Text style={[type.caption, styles.muted, { marginTop: 3 }]}>
              {t('{crop} · agreed {kg} kg · {id}', { crop: cropLabel(a.crop), kg: a.agreedQuantityKg, id: a.id })}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[type.title, styles.ink]}>{formatLKR(j.feeToTransporter)}</Text>
            <Text style={[type.caption, styles.muted]}>you earn</Text>
          </View>
        </View>
      </Card>

      {recorded ? (
        <>
          <Notice tone="field" title={t('{kg} kg recorded', { kg: a.actualWeightKg })}>
            {`${t('{n} photos saved at {time}.', { n: a.weightPhotos?.length ?? 0, time: formatTime(a.weightRecordedAt) })} ${confirmation}`}
          </Notice>
        </>
      ) : (
        <>
          <Card style={{ gap: 10 }}>
            <StepTitle n={1}>Photograph the load</StepTitle>
            {photos.length ? (
              <View style={styles.photos}>
                {photos.map((p) => (
                  <Image key={p.uri} source={{ uri: p.uri }} style={styles.photo} />
                ))}
              </View>
            ) : null}
            <Button title={photos.length ? 'Take another photo' : 'Take photo'} variant="secondary" onPress={addPhoto} />
            <Text style={[type.caption, styles.muted]}>
              {photos.length
                ? t('{n} taken at {name}’s gate, {time}. Photos are time-stamped and cannot be changed later.', {
                    n: photos.length,
                    name: farmer,
                    time: formatTime(photos[photos.length - 1].at),
                  })
                : t('At least one photo of the load on the scale.')}
            </Text>
          </Card>

          <Card style={{ gap: 10 }}>
            <StepTitle n={2}>Weight actually collected</StepTitle>
            <Field value={weight} onChangeText={(v) => setWeight(v.replace(/\D/g, ''))} keyboardType="number-pad" suffix="kg" inputStyle={styles.big} />
            {kg && diff !== 0 ? (
              <Text style={[type.label, { color: diff < 0 ? color.harvestText : color.ink }]}>
                {diff < 0 ? t('{kg} kg less than agreed', { kg: -diff }) : t('{kg} kg more than agreed', { kg: diff })}
              </Text>
            ) : null}
            {paid ? (
              <Text style={[type.caption, styles.ink]}>
                {t('{name} is paid for {kg} kg ({amount} after fee). They confirm this weight before payment.', {
                  name: farmer,
                  kg,
                  amount: formatLKR(paid.net),
                })}
              </Text>
            ) : null}
          </Card>

          <Card style={{ gap: 6 }}>
            <StepTitle n={3}>Farmer confirms</StepTitle>
            <Text style={[type.caption, styles.muted]}>
              {t('{name} sees the weight and your photos in their app and confirms it there. Nothing is paid until they do.', { name: a.farmerName })}
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photo: { width: 72, height: 72, borderRadius: radius.input - 4, backgroundColor: color.line },
  big: { fontSize: 24, fontFamily: font.semibold },
  muted: { color: color.muted },
  ink: { color: color.ink },
});
