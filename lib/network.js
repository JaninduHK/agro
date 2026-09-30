// Is there a route to the internet right now? Used by the splash to show
// "Cannot reach the market" before any task is attempted (NFR-09).
// A plain request to Google's 204 endpoint — no native module needed.
const PROBE = 'https://clients3.google.com/generate_204';

export async function checkOnline(timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(PROBE, { method: 'GET', cache: 'no-store', signal: controller.signal });
    return res.status === 204 || res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
