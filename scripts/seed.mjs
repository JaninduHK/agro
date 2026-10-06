// Seeds every collection with the prototype's own data, so screenshots match the
// prototype and the usability-test tasks' numbers are real.
//
//   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npm run seed
//
// Creates Auth users with FIXED uids for the test phone numbers, so signing in as
// one of them (with the test code set in the Firebase console) lands on the seeded
// profile. Safe to re-run: every document is overwritten, not duplicated.
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { demoEmail, demoPassword } from '../lib/demo.js';
import { calcNet } from '../lib/money.js';

initializeApp({ credential: applicationDefault() });
const auth = getAuth();
const db = getFirestore();

// 2026 dates: harvested Tue 8 Sep, collected Wed 16 Sep, paid Fri 18 Sep.
const at = (iso) => Timestamp.fromDate(new Date(`${iso}+05:30`));
const hoursFromNow = (h) => Timestamp.fromMillis(Date.now() + h * 3600e3);

const people = {
  sunil:   { uid: 'seed-farmer-sunil',     phone: '+94774000321' },
  ranjith: { uid: 'seed-buyer-ranjith',    phone: '+94775550142' },
  suri:    { uid: 'seed-buyer-suri',       phone: '+94775550143' },
  lanka:   { uid: 'seed-buyer-lanka',      phone: '+94775550144' },
  nimal:   { uid: 'seed-transport-nimal',  phone: '+94711234567' },
  traders: { uid: 'seed-buyer-nimaltraders', phone: '+94775550145' },
};

// Each seeded account can sign in both ways: by SMS code (phone provider) and by
// demo sign-in (email + password derived from the number, see lib/demo.js).
async function ensureAuthUser({ uid, phone }) {
  const identity = { phoneNumber: phone, email: demoEmail(phone), password: demoPassword(phone) };
  try {
    await auth.getUser(uid);
    await auth.updateUser(uid, identity);
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
    await auth.createUser({ uid, ...identity });
  }
}

function user(p, fields) {
  return {
    phone: p.phone,
    language: 'en',
    verified: true,
    verifiedBy: 'Field officer, Matale',
    verifiedAt: at('2024-03-12T10:00:00'),
    operatorName: null,
    operatorPhone: null,
    operatorRelation: null,
    createdAt: at('2024-03-12T10:00:00'),
    ...fields,
    roles: [fields.role],
  };
}

const LISTING = 'seed-listing-beans';
const offer = (id, buyer, buyerName, buyerVerified, buyerPurchases, pricePerKg, paymentTerms) => {
  const { gross, fee, net } = calcNet(pricePerKg, 200);
  return [id, {
    listingId: LISTING, farmerId: people.sunil.uid, buyerId: buyer.uid, buyerName, buyerVerified, buyerPurchases,
    pricePerKg, quantityKg: 200, paymentTerms, grossTotal: gross, feeAmount: fee, netToFarmer: net,
    expiresAt: hoursFromNow(4), status: 'pending', createdAt: at('2026-09-09T08:00:00'),
  }];
};

const agreed = calcNet(192, 200);
const collected = calcNet(192, 197);

function paidAgreement({ buyer, buyerName, crop, grade, kg, gross, fee, paidAt }) {
  return {
    offerId: null, listingId: null,
    farmerId: people.sunil.uid, buyerId: buyer.uid, transporterId: people.nimal.uid,
    farmerName: 'Sunil Perera', buyerName, transporterName: 'Nimal Jayasinghe',
    crop, grade, paymentTerms: 'on-collection',
    agreedPricePerKg: Math.round((gross / kg) * 100) / 100, agreedQuantityKg: kg, feePercent: 3,
    grossTotal: gross, feeAmount: fee, netToFarmer: gross - fee,
    collectionTime: paidAt, transportPaidBy: 'buyer',
    actualWeightKg: kg, weightPhotos: [], weightRecordedBy: people.nimal.uid,
    weightRecordedAt: paidAt, weightConfirmed: 'confirmed',
    finalTotal: gross, finalFee: fee, finalNet: gross - fee,
    status: 'paid', paidAt, createdAt: paidAt,
  };
}
const orderLine = calcNet(192, 10);

const docs = {
  users: {
    [people.sunil.uid]: user(people.sunil, {
      role: 'farmer', fullName: 'Sunil Perera', village: 'Matale', rating: 4.8, ratingCount: 37,
      operatorName: 'Kasun Perera', operatorPhone: '+94712000887', operatorRelation: 'son',
      payout: { method: 'bank', bankName: 'Bank of Ceylon', accountLast4: '4471', accountName: 'Sunil Perera' },
    }),
    [people.ranjith.uid]: user(people.ranjith, { role: 'buyer', fullName: 'Ranjith Stores', village: 'Kandy', rating: 4.9, ratingCount: 14 }),
    [people.suri.uid]:    user(people.suri,    { role: 'buyer', fullName: 'Suri Foods', village: 'Kandy', rating: 4.7, ratingCount: 31 }),
    [people.lanka.uid]:   { ...user(people.lanka, { role: 'buyer', fullName: 'Lanka Fresh', village: 'Colombo', rating: 0, ratingCount: 0 }),
                            verified: false, verifiedBy: null, verifiedAt: null },
    [people.nimal.uid]:   user(people.nimal,   { role: 'transporter', fullName: 'Nimal Jayasinghe', village: 'Matale', rating: 4.8, ratingCount: 52 }),
    [people.traders.uid]: user(people.traders, { role: 'buyer', fullName: 'Nimal Traders', village: 'Dambulla', rating: 4.6, ratingCount: 22 }),
  },

  listings: {
    [LISTING]: {
      farmerId: people.sunil.uid, farmerName: 'Sunil Perera', farmerVillage: 'Matale', farmerVerified: true,
      crop: 'beans', grade: 'A', quantityKg: 200, harvestDate: at('2026-09-08T06:00:00'),
      collectFrom: 'Matale — home garden', collectionWindow: 'wed-fri', askingPricePerKg: 195,
      status: 'live', draftStep: null, savedBy: null, savedAt: null,
      viewCount: 3, offerCount: 3, createdAt: at('2026-09-08T18:00:00'),
    },
    'seed-listing-tomato': {
      farmerId: people.sunil.uid, farmerName: 'Sunil Perera', farmerVillage: 'Matale', farmerVerified: true,
      crop: 'tomato', grade: 'B', quantityKg: 60, harvestDate: at('2026-09-10T06:00:00'),
      collectFrom: 'Matale — home garden', collectionWindow: 'within-3-days', askingPricePerKg: 140,
      status: 'live', draftStep: null, savedBy: null, savedAt: null,
      viewCount: 0, offerCount: 0, createdAt: at('2026-09-10T18:00:00'),
    },
    'seed-listing-carrot-draft': {
      farmerId: people.sunil.uid, farmerName: 'Sunil Perera', farmerVillage: 'Matale', farmerVerified: true,
      crop: 'carrot', grade: null, quantityKg: null, harvestDate: null,
      collectFrom: null, collectionWindow: null, askingPricePerKg: null,
      status: 'draft', draftStep: 2, savedBy: 'Kasun Perera', savedAt: at('2026-09-11T11:20:00'),
      viewCount: 0, offerCount: 0, createdAt: at('2026-09-11T11:18:00'),
    },
  },

  offers: Object.fromEntries([
    offer('seed-offer-ranjith', people.ranjith, 'Ranjith Stores', true, 14, 192, '7-days'),
    offer('seed-offer-suri', people.suri, 'Suri Foods', true, 31, 180, 'on-collection'),
    offer('seed-offer-lanka', people.lanka, 'Lanka Fresh', false, 0, 178, 'on-collection'),
  ]),

  agreements: {
    'AG-2214': {
      offerId: 'seed-offer-ranjith', listingId: LISTING,
      farmerId: people.sunil.uid, buyerId: people.ranjith.uid, transporterId: people.nimal.uid,
      farmerName: 'Sunil Perera', buyerName: 'Ranjith Stores', transporterName: 'Nimal Jayasinghe',
      crop: 'beans', grade: 'A', paymentTerms: '7-days',
      agreedPricePerKg: 192, agreedQuantityKg: 200, feePercent: 3,
      grossTotal: agreed.gross, feeAmount: agreed.fee, netToFarmer: agreed.net,
      collectionTime: at('2026-09-16T07:00:00'), transportPaidBy: 'buyer',
      actualWeightKg: 197, weightPhotos: [], weightRecordedBy: people.nimal.uid,
      weightRecordedAt: at('2026-09-16T07:12:00'), weightConfirmed: 'pending',
      finalTotal: collected.gross, finalFee: collected.fee, finalNet: collected.net,
      status: 'weight-pending', paidAt: null, createdAt: at('2026-09-13T09:42:00'),
    },
    // Earlier sales, paid — the Money screen's history ("Rs 47,400 after Rs 1,466 fees")
    'AG-2201': paidAgreement({
      buyer: people.traders, buyerName: 'Nimal Traders', crop: 'rice', grade: 'A', kg: 150,
      gross: 28866, fee: 866, paidAt: at('2026-09-11T10:04:00'),
    }),
    'AG-2188': paidAgreement({
      buyer: people.suri, buyerName: 'Suri Foods', crop: 'beans', grade: 'A', kg: 100,
      gross: 20000, fee: 600, paidAt: at('2026-09-04T10:04:00'),
    }),
  },

  orders: {
    'OR-8841': {
      buyerId: people.ranjith.uid, buyerName: 'Ranjith Stores', listingId: LISTING,
      farmerId: people.sunil.uid, farmerName: 'Sunil Perera', farmerVillage: 'Matale', deliverTo: 'Kandy',
      crop: 'beans', grade: 'A', quantityKg: 10, pricePerKg: 192,
      goodsTotal: orderLine.gross, feeAmount: orderLine.fee, netToFarmer: orderLine.net,
      deliveryFee: 230, total: orderLine.gross + 230,
      paymentStatus: 'held', paymentFailure: null, reservedUntil: null, paymentMethod: 'frimi', status: 'in-transit',
      transporterId: people.nimal.uid, transporterName: 'Nimal Jayasinghe',
      inspectionEndsAt: at('2026-09-16T20:00:00'), createdAt: at('2026-09-15T10:04:00'),
    },
  },

  jobs: {
    'seed-job-ag2214': {
      agreementId: 'AG-2214', fromLocation: 'Matale', toLocation: 'Kandy', crop: 'beans', quantityKg: 200,
      farmerName: 'Sunil Perera', transporterName: 'Nimal Jayasinghe',
      windowStart: at('2026-09-16T07:00:00'), windowEnd: at('2026-09-16T11:00:00'),
      feeToTransporter: 2400, transporterId: people.nimal.uid, status: 'collected', createdAt: at('2026-09-13T10:00:00'),
    },
    // Delivery job for the retail order OR-8841 — collected, on its way to Kandy
    'seed-job-or8841': {
      agreementId: null, orderId: 'OR-8841', fromLocation: 'Matale', toLocation: 'Kandy', crop: 'beans', quantityKg: 10,
      farmerName: 'Sunil Perera', transporterName: 'Nimal Jayasinghe',
      windowStart: at('2026-09-16T07:00:00'), windowEnd: at('2026-09-16T11:00:00'),
      feeToTransporter: 230, transporterId: people.nimal.uid, status: 'collected', createdAt: at('2026-09-15T12:30:00'),
    },
    'seed-job-ukuwela': {
      agreementId: null, fromLocation: 'Ukuwela', toLocation: 'Kandy', crop: 'mixed', quantityKg: 120, farmerName: null,
      windowStart: at('2026-09-17T06:00:00'), windowEnd: at('2026-09-17T08:00:00'),
      feeToTransporter: 3200, transporterId: null, status: 'open', createdAt: at('2026-09-14T10:00:00'),
    },
    'seed-job-kurunegala': {
      agreementId: null, fromLocation: 'Matale', toLocation: 'Kurunegala', crop: 'cabbage', quantityKg: 300, farmerName: null,
      windowStart: at('2026-09-18T05:00:00'), windowEnd: at('2026-09-18T07:00:00'),
      feeToTransporter: 6000, transporterId: null, status: 'open', createdAt: at('2026-09-14T11:00:00'),
    },
  },

  problems: {
    'DP-1190': {
      orderId: 'OR-8841', reportedBy: people.ranjith.uid, farmerName: 'Sunil Perera', issueType: 'spoiled', affectedQtyKg: 2, photos: [],
      // pro rata of what the buyer paid, delivery included: 2 of 10 kg of Rs 2,150 = Rs 430
      refundRequested: Math.round(((orderLine.gross + 230) * 2) / 10),
      status: 'open', decisionDueAt: at('2026-09-14T17:42:00'), createdAt: at('2026-09-13T17:42:00'),
    },
  },
};

for (const p of Object.values(people)) await ensureAuthUser(p);

const batch = db.batch();
for (const [col, byId] of Object.entries(docs)) {
  for (const [id, data] of Object.entries(byId)) batch.set(db.collection(col).doc(id), data);
}
await batch.commit();

const count = Object.values(docs).reduce((n, byId) => n + Object.keys(byId).length, 0);
console.log(`Seeded ${count} documents and ${Object.keys(people).length} auth users.`);
console.log(`Offer net for Ranjith Stores: Rs ${docs.offers['seed-offer-ranjith'].netToFarmer}`);
