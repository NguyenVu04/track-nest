# Tracker Proto Integration Guide

## Regenerating Proto Files

Run from project root:

```bash
npx protoc -I ./proto ./proto/*.proto \
  --plugin=protoc-gen-js="D:/QuangVinh/HCMUT/FINAL-YEAR/DACN/track-nest/frontend/TrackNest/node_modules/.bin/protoc-gen-js.cmd" \
  --js_out="import_style=commonjs,binary:./proto/gen" \
  --plugin=protoc-gen-ts="D:/QuangVinh/HCMUT/FINAL-YEAR/DACN/track-nest/frontend/TrackNest/node_modules/.bin/protoc-gen-ts.cmd" \
  --ts_out=service=grpc-web:./proto/gen
```

## Quick Usage

### 1. Configure Backend URL

Create `.env` in project root:

```env
EXPO_PUBLIC_GRPC_URL=http://your-backend:8080
```

### 2. Stream Your Location

```typescript
import { useLocationStream } from "@/hooks/useTrackerService";

const { isStreaming, sendLocation } = useLocationStream(true);

// Send location update
sendLocation(latitude, longitude, accuracy, velocity);
```

### 3. Receive Follower Locations

```typescript
import { useTargetLocations } from "@/hooks/useTrackerService";

const { locations } = useTargetLocations(true);
// locations = array of { userid, username, latitude, longitude, connected, ... }
```

### 4. Integration Example

See `components/TrackerExample.tsx` for a complete working example.

In your map screen:

```typescript
import {
  useLocationStream,
  useTargetLocations,
} from "@/hooks/useTrackerService";

export default function MapScreen() {
  const { sendLocation } = useLocationStream(sharingEnabled);
  const { locations: followers } = useTargetLocations(tracking);

  // Stream location when GPS updates
  useEffect(() => {
    if (location) {
      sendLocation(location.latitude, location.longitude);
    }
  }, [location]);

  // Render followers on map
  return (
    <MapView>
      {followers.map((f) => (
        <Marker
          key={f.userid}
          coordinate={{ latitude: f.latitude, longitude: f.longitude }}
        />
      ))}
    </MapView>
  );
}
```

## Files Created

- `services/trackerService.ts` - gRPC service wrapper
- `hooks/useTrackerService.ts` - React hooks for tracker integration
- `components/TrackerExample.tsx` - Working example component
- `proto/gen/tracker_pb.*` - Generated message types
- `proto/gen/tracker_pb_service.*` - Generated service client
