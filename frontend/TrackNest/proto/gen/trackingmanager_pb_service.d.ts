// package: project.tracknest.usertracking.proto
// file: trackingmanager.proto

import * as trackingmanager_pb from "./trackingmanager_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_wrappers_pb from "google-protobuf/google/protobuf/wrappers_pb";
import {grpc} from "@improbable-eng/grpc-web";

type TrackingManagerControllerpostConnection = {
  readonly methodName: string;
  readonly service: typeof TrackingManagerController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof trackingmanager_pb.ConnectionRequest;
  readonly responseType: typeof google_protobuf_empty_pb.Empty;
};

type TrackingManagerControllerdeleteTracker = {
  readonly methodName: string;
  readonly service: typeof TrackingManagerController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof google_protobuf_wrappers_pb.StringValue;
  readonly responseType: typeof google_protobuf_empty_pb.Empty;
};

type TrackingManagerControllerdeleteTarget = {
  readonly methodName: string;
  readonly service: typeof TrackingManagerController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof google_protobuf_wrappers_pb.StringValue;
  readonly responseType: typeof google_protobuf_empty_pb.Empty;
};

type TrackingManagerControllerpostTrackingPermission = {
  readonly methodName: string;
  readonly service: typeof TrackingManagerController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof google_protobuf_empty_pb.Empty;
  readonly responseType: typeof trackingmanager_pb.PermissionResponse;
};

type TrackingManagerControllerdeleteTrackingPermission = {
  readonly methodName: string;
  readonly service: typeof TrackingManagerController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof google_protobuf_wrappers_pb.StringValue;
  readonly responseType: typeof google_protobuf_empty_pb.Empty;
};

type TrackingManagerControllergetUserTargets = {
  readonly methodName: string;
  readonly service: typeof TrackingManagerController;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof google_protobuf_empty_pb.Empty;
  readonly responseType: typeof trackingmanager_pb.TargetResponse;
};

type TrackingManagerControllergetUserTrackers = {
  readonly methodName: string;
  readonly service: typeof TrackingManagerController;
  readonly requestStream: false;
  readonly responseStream: true;
  readonly requestType: typeof google_protobuf_empty_pb.Empty;
  readonly responseType: typeof trackingmanager_pb.TrackerResponse;
};

type TrackingManagerControllerputTrackingStatus = {
  readonly methodName: string;
  readonly service: typeof TrackingManagerController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof google_protobuf_wrappers_pb.BoolValue;
  readonly responseType: typeof google_protobuf_empty_pb.Empty;
};

export class TrackingManagerController {
  static readonly serviceName: string;
  static readonly postConnection: TrackingManagerControllerpostConnection;
  static readonly deleteTracker: TrackingManagerControllerdeleteTracker;
  static readonly deleteTarget: TrackingManagerControllerdeleteTarget;
  static readonly postTrackingPermission: TrackingManagerControllerpostTrackingPermission;
  static readonly deleteTrackingPermission: TrackingManagerControllerdeleteTrackingPermission;
  static readonly getUserTargets: TrackingManagerControllergetUserTargets;
  static readonly getUserTrackers: TrackingManagerControllergetUserTrackers;
  static readonly putTrackingStatus: TrackingManagerControllerputTrackingStatus;
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

export class TrackingManagerControllerClient {
  readonly serviceHost: string;

  constructor(serviceHost: string, options?: grpc.RpcOptions);
  postConnection(
    requestMessage: trackingmanager_pb.ConnectionRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  postConnection(
    requestMessage: trackingmanager_pb.ConnectionRequest,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteTracker(
    requestMessage: google_protobuf_wrappers_pb.StringValue,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteTracker(
    requestMessage: google_protobuf_wrappers_pb.StringValue,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteTarget(
    requestMessage: google_protobuf_wrappers_pb.StringValue,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteTarget(
    requestMessage: google_protobuf_wrappers_pb.StringValue,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  postTrackingPermission(
    requestMessage: google_protobuf_empty_pb.Empty,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: trackingmanager_pb.PermissionResponse|null) => void
  ): UnaryResponse;
  postTrackingPermission(
    requestMessage: google_protobuf_empty_pb.Empty,
    callback: (error: ServiceError|null, responseMessage: trackingmanager_pb.PermissionResponse|null) => void
  ): UnaryResponse;
  deleteTrackingPermission(
    requestMessage: google_protobuf_wrappers_pb.StringValue,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteTrackingPermission(
    requestMessage: google_protobuf_wrappers_pb.StringValue,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  getUserTargets(requestMessage: google_protobuf_empty_pb.Empty, metadata?: grpc.Metadata): ResponseStream<trackingmanager_pb.TargetResponse>;
  getUserTrackers(requestMessage: google_protobuf_empty_pb.Empty, metadata?: grpc.Metadata): ResponseStream<trackingmanager_pb.TrackerResponse>;
  putTrackingStatus(
    requestMessage: google_protobuf_wrappers_pb.BoolValue,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  putTrackingStatus(
    requestMessage: google_protobuf_wrappers_pb.BoolValue,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
}

