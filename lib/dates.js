// Dates as the prototype writes them: 'Tuesday, 8 September', '7.00 am', 'Wed 13 Sep'.
// Sinhala: 'අඟහරුවාදා, සැප්තැම්බර් 8', 'පෙ.ව. 7.00'.
// Hand-rolled so every phone shows the same text whatever its locale settings.
import { currentLanguage, translate } from './i18n';

const NAMES = {
  en: {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'],
  },
  si: {
    days: ['ඉරිදා', 'සඳුදා', 'අඟහරුවාදා', 'බදාදා', 'බ්‍රහස්පතින්දා', 'සිකුරාදා', 'සෙනසුරාදා'],
    months: ['ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි', 'ජූලි',
      'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්'],
  },
};

const si = () => currentLanguage() === 'si';
const names = () => NAMES[si() ? 'si' : 'en'];

// Firestore Timestamp | Date | millis | null -> Date | null
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'number') return new Date(value);
  return null;
}

// 'Tuesday, 8 September' | 'අඟහරුවාදා, සැප්තැම්බර් 8'
export function formatDay(value) {
  const d = toDate(value);
  if (!d) return '';
  const { days, months } = names();
  return si()
    ? `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
    : `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

// '8 September' | 'සැප්තැම්බර් 8' — no weekday
export function formatDate(value) {
  const d = toDate(value);
  if (!d) return '';
  const { months } = names();
  return si() ? `${months[d.getMonth()]} ${d.getDate()}` : `${d.getDate()} ${months[d.getMonth()]}`;
}

// 'March 2024' | '2024 මාර්තු'
export function formatMonthYear(value) {
  const d = toDate(value);
  if (!d) return '';
  const { months } = names();
  return si() ? `${d.getFullYear()} ${months[d.getMonth()]}` : `${months[d.getMonth()]} ${d.getFullYear()}`;
}

// 'Tue 8 Sep' | 'අඟහරුවාදා, සැප්තැම්බර් 8' (Sinhala has no settled short forms)
export function formatShortDay(value) {
  const d = toDate(value);
  if (!d) return '';
  if (si()) return formatDay(d);
  const { days, months } = names();
  return `${days[d.getDay()].slice(0, 3)} ${d.getDate()} ${months[d.getMonth()].slice(0, 3)}`;
}

// '7.00 am' | 'පෙ.ව. 7.00'
export function formatTime(value) {
  const d = toDate(value);
  if (!d) return '';
  const h = d.getHours();
  const clock = `${h % 12 || 12}.${String(d.getMinutes()).padStart(2, '0')}`;
  if (si()) return `${h < 12 ? 'පෙ.ව.' : 'ප.ව.'} ${clock}`;
  return `${clock} ${h < 12 ? 'am' : 'pm'}`;
}

// 'Wednesday, 7.00 am'
export function formatDayTime(value) {
  const d = toDate(value);
  return d ? `${names().days[d.getDay()]}, ${formatTime(d)}` : '';
}

// 'today' | '1 day ago' | '3 days ago'
export function daysAgo(value, now = new Date()) {
  const d = toDate(value);
  if (!d) return '';
  const days = Math.floor((startOfDay(now) - startOfDay(d)) / 86400e3);
  if (days <= 0) return translate('today');
  return days === 1 ? translate('1 day ago') : translate('{n} days ago', { n: days });
}

// Time left until `value`: '4 hours', '35 minutes', or null if already past.
export function timeLeft(value, now = new Date()) {
  const d = toDate(value);
  if (!d) return null;
  const mins = Math.round((d - now) / 60e3);
  if (mins <= 0) return null;
  if (mins < 60) return translate('{n} minutes', { n: mins });
  const hours = Math.round(mins / 60);
  if (hours < 48) return hours === 1 ? translate('1 hour') : translate('{n} hours', { n: hours });
  return translate('{n} days', { n: Math.round(hours / 24) });
}

export function addDays(value, days) {
  const d = toDate(value);
  return d ? new Date(d.getTime() + days * 86400e3) : null;
}

// 'Good morning' | 'Good afternoon' | 'Good evening'
export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return translate('Good morning');
  if (h < 17) return translate('Good afternoon');
  return translate('Good evening');
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
