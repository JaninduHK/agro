// Collection names and the few writes more than one member needs.
// The data model is agreed in "M03 data model and setup.md" — change it there first.
import {
  collection,
  deleteField,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import { db } from '../firebase';
import { phoneOf } from './demo';

export const COL = {
  users: 'users',
  listings: 'listings',
  offers: 'offers',
  agreements: 'agreements',
  orders: 'orders',
  jobs: 'jobs',
  problems: 'problems',
};

export const col = (name) => collection(db, name);
export const ref = (name, id) => doc(db, name, id);
export const now = serverTimestamp;

// Where each role lands after sign-in. index.jsx and account switching both use it.
export const ROLE_HOME = {
  farmer: '/home',
  buyer: '/search',
  transporter: '/jobs',
};

export function listenToUser(uid, onChange, onError) {
  return onSnapshot(
    ref(COL.users, uid),
    { includeMetadataChanges: true },
    (snap) => {
      // Offline with an empty cache, a missing document proves nothing — wait for
      // the server rather than sending an existing user back to registration.
      if (!snap.exists() && snap.metadata.fromCache) return;
      onChange(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    onError,
  );
}

// Registration saves after every step so a handed-back phone can resume
// ("Step 2 of 3, saved 11.20 am by Kasun"). Step 1 creates the document, so it
// carries the fields the security rules require on create. On the last step,
// pass { registration: deleteField() } in `fields`' place via finishRegistration.
export function saveRegistrationStep(user, step, fields, savedBy = null) {
  const created = step === 1 ? { phone: phoneOf(user), verified: false, createdAt: now() } : {};
  return setDoc(
    ref(COL.users, user.uid),
    { ...created, ...fields, registration: { step, savedBy, savedAt: now() } },
    { merge: true },
  );
}

// Final step: writes payout and removes `registration`, which is what moves
// auth status from 'noProfile' to 'ready'.
export function finishRegistration(uid, fields) {
  return updateDoc(ref(COL.users, uid), { ...fields, registration: deleteField() });
}

// Profile edits the owner may make themselves (see firestore.rules: trust fields,
// phone and — without a fresh code — payout are refused).
export function updateProfile(uid, fields) {
  return updateDoc(ref(COL.users, uid), fields);
}

