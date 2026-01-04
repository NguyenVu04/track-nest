// package: project.tracknest.usertracking.proto
// file: notifier.proto

import * as notifier_pb from "./notifier_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_wrappers_pb from "google-protobuf/google/protobuf/wrappers_pb";
import {grpc} from "@improbable-eng/grpc-web";

type NotifierControllerpostMobileDevice = {
  readonly methodName: string;
  readonly service: typeof NotifierController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof notifier_pb.MobileDeviceRequest;
  readonly responseType: typeof google_protobuf_wrappers_pb.StringValue;
};

type NotifierControllerdeleteMobileDevice = {
  readonly methodName: string;
  readonly service: typeof NotifierController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof google_protobuf_wrappers_pb.StringValue;
  readonly responseType: typeof google_protobuf_empty_pb.Empty;
};

type NotifierControllergetTrackingNotifications = {
  readonly methodName: string;
  readonly service: typeof NotifierController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof google_protobuf_empty_pb.Empty;
  readonly responseType: typeof notifier_pb.TrackingNotificationResponse;
};

type NotifierControllergetRiskNotifications = {
  readonly methodName: string;
  readonly service: typeof NotifierController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof google_protobuf_empty_pb.Empty;
  readonly responseType: typeof notifier_pb.RiskNotificationResponse;
};

type NotifierControllerdeleteTrackingNotification = {
  readonly methodName: string;
  readonly service: typeof NotifierController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof google_protobuf_wrappers_pb.StringValue;
  readonly responseType: typeof google_protobuf_empty_pb.Empty;
};

type NotifierControllerdeleteRiskNotification = {
  readonly methodName: string;
  readonly service: typeof NotifierController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof google_protobuf_wrappers_pb.StringValue;
  readonly responseType: typeof google_protobuf_empty_pb.Empty;
};

type NotifierControllerdeleteTrackingNotifications = {
  readonly methodName: string;
  readonly service: typeof NotifierController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof notifier_pb.NotificationIds;
  readonly responseType: typeof google_protobuf_empty_pb.Empty;
};

type NotifierControllerdeleteRiskNotifications = {
  readonly methodName: string;
  readonly service: typeof NotifierController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof notifier_pb.NotificationIds;
  readonly responseType: typeof google_protobuf_empty_pb.Empty;
};

type NotifierControllerdeleteAllTrackingNotifications = {
  readonly methodName: string;
  readonly service: typeof NotifierController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof google_protobuf_empty_pb.Empty;
  readonly responseType: typeof google_protobuf_empty_pb.Empty;
};

type NotifierControllerdeleteAllRiskNotifications = {
  readonly methodName: string;
  readonly service: typeof NotifierController;
  readonly requestStream: false;
  readonly responseStream: false;
  readonly requestType: typeof google_protobuf_empty_pb.Empty;
  readonly responseType: typeof google_protobuf_empty_pb.Empty;
};

export class NotifierController {
  static readonly serviceName: string;
  static readonly postMobileDevice: NotifierControllerpostMobileDevice;
  static readonly deleteMobileDevice: NotifierControllerdeleteMobileDevice;
  static readonly getTrackingNotifications: NotifierControllergetTrackingNotifications;
  static readonly getRiskNotifications: NotifierControllergetRiskNotifications;
  static readonly deleteTrackingNotification: NotifierControllerdeleteTrackingNotification;
  static readonly deleteRiskNotification: NotifierControllerdeleteRiskNotification;
  static readonly deleteTrackingNotifications: NotifierControllerdeleteTrackingNotifications;
  static readonly deleteRiskNotifications: NotifierControllerdeleteRiskNotifications;
  static readonly deleteAllTrackingNotifications: NotifierControllerdeleteAllTrackingNotifications;
  static readonly deleteAllRiskNotifications: NotifierControllerdeleteAllRiskNotifications;
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

export class NotifierControllerClient {
  readonly serviceHost: string;

  constructor(serviceHost: string, options?: grpc.RpcOptions);
  postMobileDevice(
    requestMessage: notifier_pb.MobileDeviceRequest,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_wrappers_pb.StringValue|null) => void
  ): UnaryResponse;
  postMobileDevice(
    requestMessage: notifier_pb.MobileDeviceRequest,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_wrappers_pb.StringValue|null) => void
  ): UnaryResponse;
  deleteMobileDevice(
    requestMessage: google_protobuf_wrappers_pb.StringValue,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteMobileDevice(
    requestMessage: google_protobuf_wrappers_pb.StringValue,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  getTrackingNotifications(
    requestMessage: google_protobuf_empty_pb.Empty,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: notifier_pb.TrackingNotificationResponse|null) => void
  ): UnaryResponse;
  getTrackingNotifications(
    requestMessage: google_protobuf_empty_pb.Empty,
    callback: (error: ServiceError|null, responseMessage: notifier_pb.TrackingNotificationResponse|null) => void
  ): UnaryResponse;
  getRiskNotifications(
    requestMessage: google_protobuf_empty_pb.Empty,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: notifier_pb.RiskNotificationResponse|null) => void
  ): UnaryResponse;
  getRiskNotifications(
    requestMessage: google_protobuf_empty_pb.Empty,
    callback: (error: ServiceError|null, responseMessage: notifier_pb.RiskNotificationResponse|null) => void
  ): UnaryResponse;
  deleteTrackingNotification(
    requestMessage: google_protobuf_wrappers_pb.StringValue,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteTrackingNotification(
    requestMessage: google_protobuf_wrappers_pb.StringValue,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteRiskNotification(
    requestMessage: google_protobuf_wrappers_pb.StringValue,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteRiskNotification(
    requestMessage: google_protobuf_wrappers_pb.StringValue,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteTrackingNotifications(
    requestMessage: notifier_pb.NotificationIds,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteTrackingNotifications(
    requestMessage: notifier_pb.NotificationIds,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteRiskNotifications(
    requestMessage: notifier_pb.NotificationIds,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteRiskNotifications(
    requestMessage: notifier_pb.NotificationIds,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteAllTrackingNotifications(
    requestMessage: google_protobuf_empty_pb.Empty,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteAllTrackingNotifications(
    requestMessage: google_protobuf_empty_pb.Empty,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteAllRiskNotifications(
    requestMessage: google_protobuf_empty_pb.Empty,
    metadata: grpc.Metadata,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
  deleteAllRiskNotifications(
    requestMessage: google_protobuf_empty_pb.Empty,
    callback: (error: ServiceError|null, responseMessage: google_protobuf_empty_pb.Empty|null) => void
  ): UnaryResponse;
}

