// Every write that touches more than one field or document. Screens call these;
// they never assemble Firestore writes themselves. Each function's writes are
// exactly what firestore.rules allows for that role.
import {
  addDoc,
  deleteDoc,
  doc,
  increment,
  runTransaction,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';
import { db } from '../firebase';
import { addDays } from './dates';
import { COL, col, now, ref } from './firestore';
import { DELIVERY_FEE, transportFee } from './market';
import { calcNet, FEE_PERCENT } from './money';

// ---------------------------------------------------------------- ids

// Human references ('AG-2214', 'OR-8841', 'DP-1190') are document ids, so they
// must be unique: pick one, and retry inside the transaction if it is taken.
async function createWithReference(prefix, colName, build) {
  return runTransaction(db, async (tx) => {
    for (let i = 0; i < 5; i++) {
      const id = `${prefix}-${1000 + Math.floor(Math.random() * 9000)}`;
      const target = ref(colName, id);
      if ((await tx.get(target)).exists()) continue;
      await build(tx, target, id);
      return id;
    }
    throw new Error(`Could not allocate a ${prefix} reference`);
  });
}

// Tomorrow at 7.00 am — default collection slot for a new agreement.
function nextMorning() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(7, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------- listings

function farmerFields(user, profile) {
  return {
    farmerId: user.uid,
    farmerName: profile.fullName,
    farmerVillage: profile.village,
    farmerVerified: !!profile.verified,
  };
}

// Whoever holds the phone. With an operator on the account, they are the one entering.
export const savedByName = (profile) => profile.operatorName ?? profile.fullName;

// Creates or updates a draft after each step of Create listing. Returns its id.
export async function saveListingStep({ id, user, profile, step, fields }) {
  const progress = { draftStep: step, savedBy: savedByName(profile), savedAt: now() };
  if (id) {
    await updateDoc(ref(COL.listings, id), { ...fields, ...progress });
    return id;
  }
  const created = await addDoc(col(COL.listings), {
    ...farmerFields(user, profile),
    crop: null, grade: null, quantityKg: null, harvestDate: null,
    collectFrom: null, collectionWindow: null, askingPricePerKg: null,
    ...fields,
    ...progress,
    status: 'draft',
    viewCount: 0,
    offerCount: 0,
    createdAt: now(),
  });
  return created.id;
}

export function publishListing(id, fields) {
  return updateDoc(ref(COL.listings, id), {
    ...fields, status: 'live', draftStep: null, savedBy: null, savedAt: null, createdAt: now(),
  });
}

export function updateAskingPrice(id, askingPricePerKg) {
  return updateDoc(ref(COL.listings, id), { askingPricePerKg });
}

export function deleteListing(id) {
  return deleteDoc(ref(COL.listings, id));
}

export function countListingView(id) {
  return updateDoc(ref(COL.listings, id), { viewCount: increment(1) }).catch(() => {});
}

// ---------------------------------------------------------------- offers

// Buyer offers for the whole lot. netToFarmer is computed once, here.
export async function makeOffer({ user, profile, listing, pricePerKg, paymentTerms }) {
  const { gross, fee, net } = calcNet(pricePerKg, listing.quantityKg);
  await addDoc(col(COL.offers), {
    listingId: listing.id,
    farmerId: listing.farmerId,
    buyerId: user.uid,
    buyerName: profile.fullName,
    buyerVerified: !!profile.verified,
    buyerPurchases: profile.ratingCount ?? 0,
    pricePerKg,
    quantityKg: listing.quantityKg,
    paymentTerms,
    grossTotal: gross,
    feeAmount: fee,
    netToFarmer: net,
    expiresAt: addDays(new Date(), 1),
    status: 'pending',
    createdAt: now(),
  });
  await updateDoc(ref(COL.listings, listing.id), { offerCount: increment(1) }).catch(() => {});
}

// Farmer accepts: one transaction creates the agreement and its transport job,
// marks the offer accepted and the listing sold. Other offers are then rejected.
export async function acceptOffer({ offer, listing, otherOfferIds = [] }) {
  const agreementId = await createWithReference('AG', COL.agreements, async (tx, target, id) => {
    const buyer = (await tx.get(ref(COL.users, offer.buyerId))).data();
    const collectionTime = nextMorning();

    tx.set(target, {
      offerId: offer.id,
      listingId: offer.listingId,
      farmerId: offer.farmerId,
      buyerId: offer.buyerId,
      transporterId: null,
      transporterName: null,

      farmerName: listing.farmerName,
      buyerName: offer.buyerName,
      crop: listing.crop,
      grade: listing.grade,

      agreedPricePerKg: offer.pricePerKg,
      agreedQuantityKg: offer.quantityKg,
      feePercent: FEE_PERCENT,
      grossTotal: offer.grossTotal,
      feeAmount: offer.feeAmount,
      netToFarmer: offer.netToFarmer,
      paymentTerms: offer.paymentTerms,

      collectionTime,
      transportPaidBy: 'buyer',

      actualWeightKg: null,
      weightPhotos: [],
      weightRecordedBy: null,
      weightRecordedAt: null,
      weightConfirmed: 'pending',

      finalTotal: null,
      finalFee: null,
      finalNet: null,

      status: 'agreed',
      paidAt: null,
      createdAt: now(),
    });

    tx.update(ref(COL.offers, offer.id), { status: 'accepted' });
    tx.update(ref(COL.listings, offer.listingId), { status: 'sold' });

    tx.set(doc(col(COL.jobs)), {
      agreementId: id,
      fromLocation: listing.farmerVillage,
      toLocation: buyer?.village ?? '',
      farmerName: listing.farmerName,
      crop: listing.crop,
      quantityKg: offer.quantityKg,
      windowStart: collectionTime,
      windowEnd: new Date(collectionTime.getTime() + 4 * 3600e3),
      feeToTransporter: transportFee(offer.quantityKg),
      transporterId: null,
      transporterName: null,
      status: 'open',
      createdAt: now(),
    });
  });

  if (otherOfferIds.length) {
    const batch = writeBatch(db);
    otherOfferIds.forEach((id) => batch.update(ref(COL.offers, id), { status: 'rejected' }));
    await batch.commit();
  }
  return agreementId;
}

// ---------------------------------------------------------------- collection & weight

// Transporter, at the farm gate. Final figures are computed once, here.
export async function recordWeight({ user, job, agreement, weightKg, photoPaths }) {
  const { gross, fee, net } = calcNet(agreement.agreedPricePerKg, weightKg, agreement.feePercent);
  const batch = writeBatch(db);
  batch.update(ref(COL.agreements, agreement.id), {
    actualWeightKg: weightKg,
    weightPhotos: photoPaths,
    weightRecordedBy: user.uid,
    weightRecordedAt: now(),
    weightConfirmed: 'pending',
    finalTotal: gross,
    finalFee: fee,
    finalNet: net,
    status: 'weight-pending',
  });
  batch.update(ref(COL.jobs, job.id), { status: 'collected' });
  await batch.commit();
}

// Farmer agrees the recorded weight. On-collection terms pay out immediately;
// 7-day terms stay 'collected' until the payment date.
export function confirmWeight(agreement) {
  const paysNow = agreement.paymentTerms === 'on-collection';
  return updateDoc(ref(COL.agreements, agreement.id), {
    weightConfirmed: 'confirmed',
    status: paysNow ? 'paid' : 'collected',
    paidAt: paysNow ? now() : null,
  });
}

export function disputeWeight(agreement, farmerWeightKg) {
  return updateDoc(ref(COL.agreements, agreement.id), {
    weightConfirmed: 'disputed',
    farmerWeightKg,
    status: 'disputed',
  });
}

// When the money is expected: collection day for on-collection, +7 days otherwise.
export function paymentDueDate(agreement) {
  const base = agreement.weightRecordedAt ?? agreement.collectionTime;
  return agreement.paymentTerms === 'on-collection' ? base : addDays(base, 7);
}

// ---------------------------------------------------------------- jobs

export async function claimJob({ user, profile, job }) {
  const batch = writeBatch(db);
  const claim = { transporterId: user.uid, transporterName: profile.fullName };
  batch.update(ref(COL.jobs, job.id), { ...claim, status: 'accepted' });
  if (job.agreementId) batch.update(ref(COL.agreements, job.agreementId), claim);
  if (job.orderId) batch.update(ref(COL.orders, job.orderId), claim);
  await batch.commit();
}

// Retail delivery picked up at the farm. (Bulk agreements record weight instead.)
export async function markOrderCollected(job) {
  const batch = writeBatch(db);
  batch.update(ref(COL.jobs, job.id), { status: 'collected' });
  batch.update(ref(COL.orders, job.orderId), { status: 'in-transit' });
  await batch.commit();
}

// Delivered: a retail order opens the buyer's 2-hour inspection window.
export async function markDelivered(job) {
  const batch = writeBatch(db);
  batch.update(ref(COL.jobs, job.id), { status: 'delivered' });
  if (job.orderId) {
    batch.update(ref(COL.orders, job.orderId), {
      status: 'delivered',
      inspectionEndsAt: new Date(Date.now() + 2 * 3600e3),
    });
  }
  await batch.commit();
}

// ---------------------------------------------------------------- orders

// Payment is simulated (lib/payments.js). A successful charge records the money as
// held by the platform; a failed one keeps the order reserved for 30 minutes so the
// buyer can pay another way. The farmer's figures are stored, never recomputed.
export function placeOrder({ user, profile, listing, quantityKg, paymentMethod, payment }) {
  const { gross: goods, fee, net } = calcNet(listing.askingPricePerKg, quantityKg);
  return createWithReference('OR', COL.orders, async (tx, target) => {
    tx.set(target, {
      buyerId: user.uid,
      buyerName: profile.fullName,
      listingId: listing.id,
      farmerId: listing.farmerId,
      farmerName: listing.farmerName,
      farmerVillage: listing.farmerVillage,
      deliverTo: profile.village,
      crop: listing.crop,
      grade: listing.grade,
      quantityKg,
      pricePerKg: listing.askingPricePerKg,
      goodsTotal: goods,
      feeAmount: fee,
      netToFarmer: net,
      deliveryFee: DELIVERY_FEE,
      total: goods + DELIVERY_FEE,
      paymentStatus: payment.ok ? 'held' : 'failed',
      paymentFailure: payment.ok ? null : payment.reason,
      reservedUntil: payment.ok ? null : new Date(Date.now() + 30 * 60e3),
      paymentMethod,
      status: 'placed',
      transporterId: null,
      transporterName: null,
      inspectionEndsAt: null,
      createdAt: now(),
    });
  });
}

export function retryPayment(order, paymentMethod, payment) {
  return updateDoc(ref(COL.orders, order.id), {
    paymentMethod,
    paymentStatus: payment.ok ? 'held' : 'failed',
    paymentFailure: payment.ok ? null : payment.reason,
  });
}

export function cancelOrder(order) {
  return updateDoc(ref(COL.orders, order.id), {
    status: 'cancelled',
    paymentStatus: order.paymentStatus === 'held' ? 'refunded' : order.paymentStatus,
  });
}

// Farmer accepts a paid retail order: it gets a delivery job for a transporter.
export async function acceptOrder(order) {
  const pickup = nextMorning();
  const batch = writeBatch(db);
  batch.update(ref(COL.orders, order.id), { status: 'accepted' });
  batch.set(doc(col(COL.jobs)), {
    agreementId: null,
    orderId: order.id,
    fromLocation: order.farmerVillage ?? '',
    toLocation: order.deliverTo ?? '',
    farmerName: order.farmerName,
    crop: order.crop,
    quantityKg: order.quantityKg,
    windowStart: pickup,
    windowEnd: new Date(pickup.getTime() + 4 * 3600e3),
    feeToTransporter: order.deliveryFee,
    transporterId: null,
    transporterName: null,
    status: 'open',
    createdAt: now(),
  });
  await batch.commit();
}

// Farmer cannot supply it: the buyer's held money is refunded.
export function declineOrder(order) {
  return updateDoc(ref(COL.orders, order.id), { status: 'cancelled', paymentStatus: 'refunded' });
}

export function confirmOrderReceived(order) {
  return updateDoc(ref(COL.orders, order.id), { status: 'confirmed', paymentStatus: 'released' });
}

// ---------------------------------------------------------------- problems

// Refund is pro rata of what the buyer paid: 2 of 10 kg of Rs 2,150 = Rs 430.
export const refundFor = (order, affectedKg) => Math.round((order.total * affectedKg) / order.quantityKg);

export async function reportProblem({ user, order, problemId, issueType, affectedQtyKg, photoPaths }) {
  const refundRequested = refundFor(order, affectedQtyKg);
  await runTransaction(db, async (tx) => {
    tx.set(ref(COL.problems, problemId), {
      orderId: order.id,
      reportedBy: user.uid,
      farmerName: order.farmerName,
      issueType,
      affectedQtyKg,
      photos: photoPaths,
      refundRequested,
      status: 'open',
      decisionDueAt: addDays(new Date(), 1),
      createdAt: now(),
    });
    tx.update(ref(COL.orders, order.id), { status: 'problem' });
  });
}

// Problem ids are chosen before the photos upload, so the photos can live under them.
export const newProblemId = () => `DP-${1000 + Math.floor(Math.random() * 9000)}`;

// ---------------------------------------------------------------- account

// Only works within 5 minutes of a fresh sign-in code (see firestore.rules).
export function updatePayout(uid, payout) {
  return updateDoc(ref(COL.users, uid), { payout });
}
