// package: project.tracknest.usertracking.proto
// file: tracker.proto

import * as tracker_pb from "./tracker_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import {grpc} from "@improbable-eng/grpc-web";

type TrackerControllerpostLocation = {
  readonly methodName: string;
  readonly service: typeof TrackerController;
  readonly requestStream: true;
  readonly responseStream: false;
  readonly requestType: typeof tracker_pb.LocationRequest;
  readonly responseType: typeof google_protobuf_empty_pb.Empty;
};

type TrackerControllergetTargetsLastLocations = {
  readonly methodName: string;
  readonly service: typeof TrackerController;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof google_protobuf_empty_pb.Empty;
  readonly responseType: typeof tracker_pb.LocationResponse;
};

type TrackerControllergetTargetLocationHistory = {
  readonly methodName: string;
  readonly service: typeof TrackerController;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof tracker_pb.LocationHistoryRequest;
  readonly responseType: typeof tracker_pb.LocationResponse;
};

export class TrackerController {
  static readonly serviceName: string;
  static readonly postLocation: TrackerControllerpostLocation;
  static readonly getTargetsLastLocations: TrackerControllergetTargetsLastLocations;
  static readonly getTargetLocationHistory: TrackerControllergetTargetLocationHistory;
}

export type ServiceError = { message: string, code: number; metadata: grpc.Metadata }
export type Status = { details: string, code: number; metadata: grpc.Metadata }

interface UnaryResponse {
  cancel(): void;
}
interface ResponseStream<T> {
  cancel(): void;
  on(type: 'data', handler: (message: T) => void): ResponseStream<T>;
  on(type: 'end', handler: (status?: Status) => void): ResponseStream<T>;
  on(type: 'status', handler: (status: Status) => void): ResponseStream<T>;
}
interface RequestStream<T> {
  write(message: T): RequestStream<T>;
  end(): void;
  cancel(): void;
  on(type: 'end', handler: (status?: Status) => void): RequestStream<T>;
  on(type: 'status', handler: (status: Status) => void): RequestStream<T>;
}
interface BidirectionalStream<ReqT, ResT> {
  write(message: ReqT): BidirectionalStream<ReqT, ResT>;
  end(): void;
  cancel(): void;
  on(type: 'data', handler: (message: ResT) => void): BidirectionalStream<ReqT, ResT>;
  on(type: 'end', handler: (status?: Status) => void): BidirectionalStream<ReqT, ResT>;
  on(type: 'status', handler: (status: Status) => void): BidirectionalStream<ReqT, ResT>;
}

export class TrackerControllerClient {
  readonly serviceHost: string;

  constructor(serviceHost: string, options?: grpc.RpcOptions);
  postLocation(metadata?: grpc.Metadata): RequestStream<tracker_pb.LocationRequest>;
  getTargetsLastLocations(requestMessage: google_protobuf_empty_pb.Empty, metadata?: grpc.Metadata): ResponseStream<tracker_pb.LocationResponse>;
  getTargetLocationHistory(requestMessage: tracker_pb.LocationHistoryRequest, metadata?: grpc.Metadata): ResponseStream<tracker_pb.LocationResponse>;
}

