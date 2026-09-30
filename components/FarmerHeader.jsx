// App bar + owner strip, for every farmer screen. The bar only rounds its
// corners when no strip sits under it.
import { useAuth } from '../lib/auth';
import AppBar from './AppBar';
import OwnerStrip from './OwnerStrip';

export default function FarmerHeader({ below, ...appBar }) {
  const { profile } = useAuth();
  const strip = !!(profile?.operatorName && profile?.fullName);
  return (
    <>
      <AppBar {...appBar} attached={strip || !!below} />
      {below}
      <OwnerStrip />
    </>
  );
}
