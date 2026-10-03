// Is there a route to the internet right now? Used by the splash to show the
// offline screen before any task is attempted (NFR-09).
//
// Two independent endpoints are tried at once and EITHER answering counts as
// online, so one slow or blocked host (Google has been slow on some Sri Lankan
// routes) does not wrongly put the app offline. No native module needed.
const PROBES = ['https://clients3.google.com/generate_204', 'https://cp.cloudflare.com/generate_204'];

function probe(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { method: 'GET', cache: 'no-store', signal: controller.signal })
    .then((res) => {
      if (res.status === 204 || res.ok) return true;
      throw new Error(`status ${res.status}`);
    })
    .finally(() => clearTimeout(timer));
}

export async function checkOnline(timeoutMs = 5000) {
  try {
    return await Promise.any(PROBES.map((url) => probe(url, timeoutMs)));
  } catch {
    return false; // every probe failed or timed out
  }
}
