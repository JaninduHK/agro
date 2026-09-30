// Every rupee figure in the app goes through this file. Nobody formats money
// inline in a screen: the same numbers appear on six screens and must not drift.
//
// Money is stored as whole rupees (integers). The fee is rounded to the nearest
// rupee once, here, and the net is gross minus that rounded fee — so
// gross === fee + net always holds.

export const FEE_PERCENT = 3;

// 'Rs' in English, 'රු.' in Sinhala. Set by I18nProvider; kept as a setter so this
// file stays free of React imports (the Node seed script uses calcNet).
let prefix = 'Rs';
export function setCurrencyLanguage(language) {
  prefix = language === 'si' ? 'රු.' : 'Rs';
}

// 37250 -> 'Rs 37,250'. Grouping is done by hand so output is identical on every
// device regardless of the phone's locale settings.
export function formatLKR(amount) {
  const n = Math.round(Number(amount) || 0);
  const digits = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return n < 0 ? `− ${prefix} ${digits}` : `${prefix} ${digits}`;
}

// A deduction as the prototype shows it: 1150 -> '− Rs 1,150'
export function formatDeduction(amount) {
  return formatLKR(-Math.abs(amount));
}

// 192 -> 'Rs 192/kg'
export function formatPerKg(pricePerKg) {
  return `${formatLKR(pricePerKg)}/kg`;
}

export function calcFee(gross, feePercent = FEE_PERCENT) {
  return Math.round((gross * feePercent) / 100);
}

// Returns every figure an offer or agreement stores, so screens never recompute.
//   calcNet(192, 200) -> { gross: 38400, fee: 1152, net: 37248 }
export function calcNet(pricePerKg, kg, feePercent = FEE_PERCENT) {
  const gross = Math.round(pricePerKg * kg);
  const fee = calcFee(gross, feePercent);
  return { gross, fee, net: gross - fee };
}
