import { useEffect, useState } from "react";
import * as Location from "expo-location";

export function useAddressFromLocation(lat?: number, lng?: number) {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!lat || !lng) {
      setAddress(null);
      return;
    }

    Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
      .then((res) => setAddress(res[0]?.formattedAddress ?? null))
      .catch(() => setAddress(null));
  }, [lat, lng]);

  return address;
}
