// Demo sign-in. With DEMO_SIGN_IN on, any Sri Lankan mobile number can register or
// sign in with the fixed code below and NO SMS is sent. This exists because real
// SMS needs Firebase's paid plan and Firebase's own test numbers are limited to 10.
//
// Each number still gets a real Firebase account — the security rules need a
// signed-in identity — created behind the scenes with an email and password
// derived from the number, so the same number is the same account on every phone.
//
// This is NOT secure: anyone who knows a number can sign in as it. Set
// DEMO_SIGN_IN to false to go back to real SMS codes (needs the Blaze plan, or
// numbers added under Authentication → Phone → "Phone numbers for testing").
// Requires Authentication → Sign-in method → Email/Password to be enabled.

export const DEMO_SIGN_IN = true;
export const DEMO_CODE = '123456';

const DOMAIN = 'demo.agro.lk';

// '+94774000321' -> '94774000321@demo.agro.lk'
export const demoEmail = (e164) => `${e164.replace('+', '')}@${DOMAIN}`;
export const demoPassword = (e164) => `agro-demo-${e164.replace('+', '')}`;

// The account's phone number, however it signed in: SMS accounts carry it
// directly, demo accounts carry it in their email.
export function phoneOf(user) {
  if (user?.phoneNumber) return user.phoneNumber;
  const email = user?.email ?? '';
  return email.endsWith(`@${DOMAIN}`) ? `+${email.split('@')[0]}` : null;
}
