import {
  LocationHistoryRequest,
  LocationRequest,
  LocationResponse,
} from "@/proto/gen/tracker_pb";
import { TrackerControllerClient } from "@/proto/gen/tracker_pb_service";
import { grpc } from "@improbable-eng/grpc-web";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

// Configuration
const GRPC_SERVICE_URL =
  process.env.EXPO_PUBLIC_GRPC_URL || "http://localhost:8080";

/**
 * TrackerService handles gRPC communication for location tracking
 */
export class TrackerService {
  private client: TrackerControllerClient;
  private locationStream: grpc.Request | null = null;

  constructor(serviceUrl: string = GRPC_SERVICE_URL) {
    this.client = new TrackerControllerClient(serviceUrl);
  }

  /**
   * Start streaming location updates to the server
   * @returns A stream that you can write LocationRequest messages to
   */
  startLocationStream(
    onEnd?: (status?: grpc.Code, statusMessage?: string) => void
  ) {
    const stream = this.client.postLocation();

    stream.on("end", (status) => {
      console.log("Location stream ended", status);
      this.locationStream = null;
      onEnd?.(status?.code, status?.details);
    });

    stream.on("status", (status) => {
      console.log("Location stream status", status);
    });

    this.locationStream = stream as any;
    return stream;
  }

  /**
   * Send a single location update through the stream
   */
  sendLocation(
    stream: ReturnType<typeof this.client.postLocation>,
    latitude: number,
    longitude: number,
    accuracy: number = 0,
    velocity: number = 0
  ) {
    const request = new LocationRequest();
    request.setLatitude(latitude);
    request.setLongitude(longitude);
    request.setTimestamp(Math.floor(Date.now() / 1000));
    request.setAccuracy(accuracy);
    request.setVelocity(velocity);

    stream.write(request);
  }

  /**
   * End the location stream
   */
  endLocationStream(stream: ReturnType<typeof this.client.postLocation>) {
    stream.end();
    this.locationStream = null;
  }

  /**
   * Get real-time location updates for all tracked targets
   * @param onData Callback for each location update received
   * @param onEnd Callback when stream ends
   * @returns A stream that can be cancelled
   */
  getTargetsLastLocations(
    onData: (location: LocationResponse.AsObject) => void,
    onEnd?: (status?: grpc.Code, statusMessage?: string) => void,
    onError?: (error: grpc.Code, message: string) => void
  ) {
    const empty = new Empty();
    const stream = this.client.getTargetsLastLocations(empty);

    stream.on("data", (response: LocationResponse) => {
      onData(response.toObject());
    });

    stream.on("end", (status) => {
      console.log("Targets stream ended", status);
      onEnd?.(status?.code, status?.details);
    });

    stream.on("status", (status) => {
      if (status.code !== grpc.Code.OK) {
        console.error("Targets stream error", status);
        onError?.(status.code, status.details);
      }
    });

    return stream;
  }

  /**
   * Get location history for a specific target within a radius
   * @param targetUserId The user ID to get history for
   * @param longitude Center longitude
   * @param latitude Center latitude
   * @param radius Radius in meters
   * @param onData Callback for each location update received
   * @param onEnd Callback when stream ends
   * @returns A stream that can be cancelled
   */
  getTargetLocationHistory(
    targetUserId: string,
    longitude: number,
    latitude: number,
    radius: number,
    onData: (location: LocationResponse.AsObject) => void,
    onEnd?: (status?: grpc.Code, statusMessage?: string) => void,
    onError?: (error: grpc.Code, message: string) => void
  ) {
    const request = new LocationHistoryRequest();
    request.setTargetuserid(targetUserId);
    request.setLongitude(longitude);
    request.setLatitude(latitude);
    request.setRadius(radius);

    const stream = this.client.getTargetLocationHistory(request);

    stream.on("data", (response: LocationResponse) => {
      onData(response.toObject());
    });

    stream.on("end", (status) => {
      console.log("History stream ended", status);
      onEnd?.(status?.code, status?.details);
    });

    stream.on("status", (status) => {
      if (status.code !== grpc.Code.OK) {
        console.error("History stream error", status);
        onError?.(status.code, status.details);
      }
    });

    return stream;
  }
}

// Export singleton instance
export const trackerService = new TrackerService();
