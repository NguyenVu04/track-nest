// ADD THIS TO YOUR app/(tabs)/map.tsx

// 1. Import the tracker hooks at the top with your other imports
import {
  useLocationStream,
  useTargetLocations,
} from "@/hooks/useTrackerService";

// 2. Inside your MapScreen component, add these hooks after your existing state:
export default function MapScreen() {
  // ... your existing code (mapRef, tracking, sharingEnabled, etc.) ...

  // ✨ ADD THESE LINES - Tracker integration
  const {
    isStreaming,
    sendLocation,
    error: streamError,
  } = useLocationStream(sharingEnabled);
  const {
    locations: realFollowers,
    isConnected,
    error: followersError,
  } = useTargetLocations(tracking);

  // 3. Add effect to stream your location to server when GPS updates
  useEffect(() => {
    if (location && isStreaming) {
      sendLocation(
        location.latitude,
        location.longitude,
        location.accuracy || 10,
        0 // velocity - can calculate from successive positions
      );
      console.log(
        "📍 Location sent to server:",
        location.latitude,
        location.longitude
      );
    }
  }, [location, isStreaming, sendLocation]);

  // 4. Handle any errors
  useEffect(() => {
    if (streamError) {
      console.error("Stream error:", streamError);
    }
    if (followersError) {
      console.error("Followers error:", followersError);
    }
  }, [streamError, followersError]);

  // 5. Transform real follower data to match your Follower type
  const transformedFollowers: Follower[] = realFollowers.map((loc) => ({
    id: loc.userid,
    name: loc.username,
    latitude: loc.latitude,
    longitude: loc.longitude,
    sharingActive: loc.connected,
    lastActive: loc.timestamp * 1000, // convert seconds to milliseconds
    // Add any other fields your Follower type needs
  }));

  // 6. Use real followers if available, otherwise fallback to mock
  const followersToRender =
    realFollowers.length > 0 ? transformedFollowers : mockFollowers;

  // ... rest of your existing component code ...
}

// THAT'S IT! Your map will now:
// ✅ Stream your location to the backend when sharingEnabled is true
// ✅ Receive and display real-time follower locations
// ✅ Automatically reconnect if connection drops
// ✅ Fallback to mock data when no real followers are available

// Optional: Add a status indicator to your MapHeader
// You can pass isConnected and isStreaming as props to show connection status
