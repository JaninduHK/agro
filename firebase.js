// React Native Firebase (native SDKs), not the Firebase JS SDK.
//   - Phone auth runs natively: no reCAPTCHA web view.
//   - Firestore offline persistence is ON by default on Android and iOS, which is
//     what makes "Continue without internet" and the offline Home state true (NFR-09).
// Config comes from google-services.json at build time, so there are no keys here.
// Needs a development build — this does not run in Expo Go.
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

const app = getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
