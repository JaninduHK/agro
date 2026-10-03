// Sinhala / English, switchable from the top of every screen (NFR-04).
//
// The English text IS the key (gettext style). The Sinhala catalogue lives in
// lib/strings.si.js; anything missing from it falls back to English.
//
//   Plain text needs nothing: <Text>What do you do?</Text> and props such as
//   <Button title="Next" /> are looked up by components/Text.jsx at render.
//   Text built from values uses t() with placeholders, so the whole sentence is
//   one catalogue entry and word order can differ in Sinhala:
//     t('Ends in {time}', { time: timeLeft(offer.expiresAt) })
//
// A screen that calls t() re-renders when the language changes. Helpers outside
// React (dates, money, market labels) read the language through translate().
import { createContext, createElement, useCallback, useContext, useMemo, useState } from 'react';
import { sinhalaFont } from '../theme';
import { setCurrencyLanguage } from './money';
import SI from './strings.si';

// Short keys for the shared shell; English text for everything else.
const EN_KEYS = {
  'app.tagline': 'Farm to buyer',
  'splash.loading': 'Loading your account…',
  'nav.home': 'Home',
  'nav.listings': 'Listings',
  'nav.offers': 'Offers',
  'nav.money': 'Money',
  'nav.search': 'Search',
  'nav.orders': 'Orders',
  'nav.account': 'Account',
  'nav.jobs': 'Jobs',
  'nav.myJob': 'My job',
  'nav.earnings': 'Earnings',
  'common.next': 'Next',
  'common.back': 'Back',
  'common.continue': 'Continue',
  'common.tryAgain': 'Try again',
  'common.stepOf': 'Step {n} of {total}',
  'owner.owner': 'Account owner',
  'owner.holder': 'Holding the phone',
  'owner.rule': 'Payments go to {owner} only. {operator} can enter details but cannot receive money.',
};

let current = 'en';
export const currentLanguage = () => current;

// Module-level language for helpers outside React. Only I18nProvider calls this.
export function setCurrentLanguage(code) {
  current = code;
  setCurrencyLanguage(code);
}

function interpolate(text, vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

// Exact lookup; surrounding whitespace is kept so JSX fragments still space correctly.
export function lookup(text) {
  if (current !== 'si' || typeof text !== 'string') return text;
  if (SI[text] !== undefined) return SI[text];
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
  return m && m[2] && SI[m[2]] !== undefined ? m[1] + SI[m[2]] + m[3] : text;
}

export function translate(key, vars) {
  const english = EN_KEYS[key] ?? key;
  const text = current === 'si' ? (SI[key] ?? SI[english] ?? english) : english;
  return interpolate(text, vars);
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setState] = useState('en');

  const setLanguage = useCallback((code) => {
    setCurrentLanguage(code); // before the re-render, so helpers already see the new language
    setState(code);
  }, []);

  // `language` in the deps makes every t() consumer re-render on a switch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const t = useCallback((key, vars) => translate(key, vars), [language]);

  // Same weight, right script: Inter for English, Noto Sans Sinhala for Sinhala.
  const scriptFont = useCallback((family) => (language === 'si' ? sinhalaFont[family] ?? family : family), [language]);

  const value = useMemo(() => ({ language, setLanguage, t, scriptFont }), [language, setLanguage, t, scriptFont]);
  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}
