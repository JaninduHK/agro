// Phone + OTP sign-in and the signed-in user's profile, shared app-wide.
//
//   const { user, profile, status, sendCode, confirmCode, signOut } = useAuth();
//
// status: 'loading'   — Firebase has not resolved the session yet (splash shows)
//         'signedOut' — no session
//         'noProfile' — signed in, but registration is not finished
//         'ready'     — signed in with a completed profile
import { createContext, createElement, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut as fbSignOut,
} from '@react-native-firebase/auth';
import { auth } from '../firebase';
import { DEMO_CODE, DEMO_SIGN_IN, demoEmail, demoPassword } from './demo';
import { listenToUser } from './firestore';
import { useI18n } from './i18n';

// '077 400 0321' | '0774000321' | '+94774000321' -> '+94774000321'
// Returns null if it is not a 10-digit Sri Lankan mobile number starting 07.
export function toE164(input) {
  const digits = String(input).replace(/\D/g, '');
  if (/^07\d{8}$/.test(digits)) return `+94${digits.slice(1)}`;
  if (/^947\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

// '+94774000321' -> '077 400 0321'
export function formatPhone(e164) {
  const local = `0${String(e164 ?? '').replace(/^\+94/, '')}`;
  return local.length === 10 ? `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : String(e164 ?? '');
}

// '+94774000321' -> '077 4 •• •• 321', as shown on the Enter code screen.
export function maskPhone(e164) {
  const local = `0${String(e164).replace(/^\+94/, '')}`;
  return `${local.slice(0, 3)} ${local[3]} •• •• ${local.slice(-3)}`;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { setLanguage } = useI18n();
  const [user, setUser] = useState(undefined); // undefined = not resolved yet
  const [profile, setProfile] = useState(undefined);
  const confirmation = useRef(null);
  const appliedLanguage = useRef(null);
  // The farmer's owner strip can be closed for the session; every sign-in shows it again.
  const [ownerStripDismissed, setOwnerStripDismissed] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u ?? null)), []);

  // Keyed on the uid, not the User object: re-verifying the same number (to change
  // payout) signs the same person in again and must not blank the profile.
  const uid = user ? user.uid : user;
  useEffect(() => {
    if (!uid) {
      setProfile(uid === null ? null : undefined);
      return undefined;
    }
    setProfile(undefined);
    return listenToUser(
      uid,
      (p) => {
        setProfile(p);
        // Apply the stored language only when it changes, so an unrelated profile
        // update never undoes a switch the user just made.
        if (p?.language && p.language !== appliedLanguage.current) {
          appliedLanguage.current = p.language;
          setLanguage(p.language);
        }
      },
      () => setProfile(null),
    );
  }, [uid, setLanguage]);

  const value = useMemo(() => {
    let status = 'loading';
    if (user === null) status = 'signedOut';
    else if (user && profile !== undefined) {
      status = profile && !profile.registration ? 'ready' : 'noProfile';
    }

    return {
      user,
      profile,
      status,
      // Resolves once the SMS is sent. Throws 'auth/invalid-phone-number' for bad input.
      async sendCode(phoneInput) {
        const phone = toE164(phoneInput);
        if (!phone) {
          const err = new Error('Not a Sri Lankan mobile number');
          err.code = 'auth/invalid-phone-number';
          throw err;
        }
        if (DEMO_SIGN_IN) {
          // No SMS: remember the number; the fixed code is checked in confirmCode.
          confirmation.current = { demoPhone: phone };
          return phone;
        }
        confirmation.current = await signInWithPhoneNumber(auth, phone);
        return phone;
      },
      // Throws 'auth/invalid-verification-code' on a wrong code.
      async confirmCode(code) {
        if (!confirmation.current) throw new Error('sendCode must be called first');
        if (confirmation.current.demoPhone) {
          if (code !== DEMO_CODE) {
            const err = new Error('Wrong demo code');
            err.code = 'auth/invalid-verification-code';
            throw err;
          }
          const phone = confirmation.current.demoPhone;
          let cred;
          try {
            // First time this number is used: its account is created now.
            cred = await createUserWithEmailAndPassword(auth, demoEmail(phone), demoPassword(phone));
          } catch (e) {
            if (e?.code !== 'auth/email-already-in-use') throw e;
            cred = await signInWithEmailAndPassword(auth, demoEmail(phone), demoPassword(phone));
          }
          confirmation.current = null;
          setOwnerStripDismissed(false);
          return cred;
        }
        const cred = await confirmation.current.confirm(code);
        confirmation.current = null;
        setOwnerStripDismissed(false);
        return cred;
      },
      signOut: () => fbSignOut(auth),
      ownerStripDismissed,
      dismissOwnerStrip: () => setOwnerStripDismissed(true),
    };
  }, [user, profile, ownerStripDismissed]);

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
