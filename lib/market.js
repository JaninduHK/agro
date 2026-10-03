// Crops, grades and this week's price guidance (Dambulla market average).
// Labels are English catalogue keys; cropLabel()/listingTitle() return them in
// the current language.
// Guidance is static for the prototype; in production it would come from a
// `guidance` collection updated daily. Guidance only — never a guaranteed price.

import { translate } from './i18n';

export const CROPS = [
  { id: 'beans',   label: 'Beans',   guidance: { A: [170, 205], B: [150, 180], C: [120, 150] } },
  { id: 'tomato',  label: 'Tomato',  guidance: { A: [140, 175], B: [120, 155], C: [95, 125] } },
  { id: 'carrot',  label: 'Carrot',  guidance: { A: [210, 250], B: [180, 220], C: [150, 185] } },
  { id: 'leeks',   label: 'Leeks',   guidance: { A: [190, 230], B: [165, 200], C: [135, 170] } },
  { id: 'cabbage', label: 'Cabbage', guidance: { A: [90, 120],  B: [75, 100],  C: [60, 85] } },
  { id: 'other',   label: 'Other crop', guidance: null },
];

export const GRADES = [
  { id: 'A', label: 'Grade A', detail: 'clean, even size, no damage' },
  { id: 'B', label: 'Grade B', detail: 'minor marks, mixed size' },
  { id: 'C', label: 'Grade C', detail: 'visible damage, for processing' },
];

export const GRADE_HELP = {
  A: 'Grade A: clean, even size, no damage. Buyers pay more for Grade A and can reject produce that does not match.',
  B: 'Grade B: minor marks and mixed sizes. Most shops and hotels buy Grade B.',
  C: 'Grade C: visible damage. Bought for processing at a lower price.',
};

export const COLLECTION_WINDOWS = [
  { id: 'wed-fri', label: 'Wed–Fri this week' },
  { id: 'today', label: 'Today only' },
  { id: 'within-3-days', label: 'Within 3 days' },
];

// Flat delivery fee to the buyer's area. Placeholder until distance pricing exists.
export const DELIVERY_FEE = 230;

// Transporter fee for a bulk agreement: Rs 12/kg, minimum Rs 1,500.
export const transportFee = (kg) => Math.max(1500, Math.round(kg * 12));

export const cropLabel = (id) =>
  translate(CROPS.find((c) => c.id === id)?.label ?? (id ? id[0].toUpperCase() + id.slice(1) : ''));

export function guidanceFor(cropId, grade) {
  const range = CROPS.find((c) => c.id === cropId)?.guidance?.[grade];
  return range ? { low: range[0], high: range[1], mid: Math.round((range[0] + range[1]) / 2) } : null;
}

// 'Beans · Grade A · 200 kg'
export function listingTitle(l, { withQty = true } = {}) {
  const parts = [cropLabel(l.crop)];
  if (l.grade) parts.push(translate('Grade {grade}', { grade: l.grade }));
  if (withQty && l.quantityKg) parts.push(translate('{kg} kg', { kg: l.quantityKg }));
  return parts.join(' · ');
}
