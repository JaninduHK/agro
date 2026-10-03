// Simulated payment gateway — no real money moves in this prototype.
//
// Mobile wallets (FriMi, eZ Cash) behave as if the buyer's balance were
// Rs 25,000: a larger payment fails with "insufficient balance", which is how the
// Payment not completed screen is demonstrated (order 150 kg of beans or more).
// Bank transfer always succeeds but takes time to clear.

export const WALLET_BALANCE = 25000;

export const METHODS = {
  frimi: { label: 'FriMi', kind: 'wallet', detail: 'Mobile wallet · instant' },
  ezcash: { label: 'eZ Cash', kind: 'wallet', detail: 'Mobile wallet · instant' },
  bank: { label: 'Bank transfer', kind: 'bank', detail: 'Order held 4 hours while it clears' },
};

// Resolves { ok: true } or { ok: false, reason }. Never throws for a decline.
export async function charge(method, amount) {
  await new Promise((r) => setTimeout(r, 900)); // the gateway round trip
  if (METHODS[method]?.kind === 'wallet' && amount > WALLET_BALANCE) {
    return { ok: false, reason: 'insufficient balance' };
  }
  return { ok: true };
}
