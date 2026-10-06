// App bar + owner strip, for every farmer screen. The bar only rounds its
// corners when no strip sits under it.
import AppBar from './AppBar';
import OwnerStrip, { useOwnerStripVisible } from './OwnerStrip';

export default function FarmerHeader({ below, ...appBar }) {
  const strip = useOwnerStripVisible();
  return (
    <>
      <AppBar {...appBar} attached={strip || !!below} />
      {below}
      <OwnerStrip />
    </>
  );
}
