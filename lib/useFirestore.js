// Live Firestore reads for screens.
//
//   const { data, loading, fromCache, error } = useQuery(
//     () => query(col(COL.listings), where('farmerId', '==', uid)), [uid]);
//   const { data: listing } = useDocument(() => ref(COL.listings, id), [id]);
//
// `fromCache` is true while the phone is offline and showing saved data —
// that is what drives the "No internet connection" banners (NFR-09).
// Return null from the factory to skip the read (e.g. uid not known yet).
import { onSnapshot } from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';

function useSnapshot(factory, deps, map) {
  const [state, setState] = useState({ data: undefined, loading: true, fromCache: false, error: null });

  useEffect(() => {
    const target = factory();
    if (!target) {
      setState({ data: undefined, loading: false, fromCache: false, error: null });
      return undefined;
    }
    setState((s) => ({ ...s, loading: true }));
    return onSnapshot(
      target,
      { includeMetadataChanges: true },
      (snap) => setState({ data: map(snap), loading: false, fromCache: snap.metadata.fromCache, error: null }),
      (error) => setState({ data: undefined, loading: false, fromCache: false, error }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

export function useQuery(factory, deps) {
  return useSnapshot(factory, deps, (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export function useDocument(factory, deps) {
  return useSnapshot(factory, deps, (snap) => (snap.exists() ? { id: snap.id, ...snap.data() } : null));
}
