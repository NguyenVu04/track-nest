import * as jspb from 'google-protobuf'

import * as google_rpc_status_pb from './google/rpc/status_pb'; // proto import: "google/rpc/status.proto"


export class RegisterMobileDeviceRequest extends jspb.Message {
  getDevicetoken(): string;
  setDevicetoken(value: string): RegisterMobileDeviceRequest;

  getPlatform(): string;
  setPlatform(value: string): RegisterMobileDeviceRequest;

  getLanguagecode(): string;
  setLanguagecode(value: string): RegisterMobileDeviceRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterMobileDeviceRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterMobileDeviceRequest): RegisterMobileDeviceRequest.AsObject;
  static serializeBinaryToWriter(message: RegisterMobileDeviceRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterMobileDeviceRequest;
  static deserializeBinaryFromReader(message: RegisterMobileDeviceRequest, reader: jspb.BinaryReader): RegisterMobileDeviceRequest;
}

export namespace RegisterMobileDeviceRequest {
  export type AsObject = {
    devicetoken: string;
    platform: string;
    languagecode: string;
  };
}

export class RegisterMobileDeviceResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): RegisterMobileDeviceResponse;
  hasStatus(): boolean;
  clearStatus(): RegisterMobileDeviceResponse;

  getId(): string;
  setId(value: string): RegisterMobileDeviceResponse;

  getCreatedAtMs(): number;
  setCreatedAtMs(value: number): RegisterMobileDeviceResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterMobileDeviceResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterMobileDeviceResponse): RegisterMobileDeviceResponse.AsObject;
  static serializeBinaryToWriter(message: RegisterMobileDeviceResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterMobileDeviceResponse;
  static deserializeBinaryFromReader(message: RegisterMobileDeviceResponse, reader: jspb.BinaryReader): RegisterMobileDeviceResponse;
}

export namespace RegisterMobileDeviceResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    id: string;
    createdAtMs: number;
  };
}

export class UnregisterMobileDeviceRequest extends jspb.Message {
  getId(): string;
  setId(value: string): UnregisterMobileDeviceRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnregisterMobileDeviceRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UnregisterMobileDeviceRequest): UnregisterMobileDeviceRequest.AsObject;
  static serializeBinaryToWriter(message: UnregisterMobileDeviceRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnregisterMobileDeviceRequest;
  static deserializeBinaryFromReader(message: UnregisterMobileDeviceRequest, reader: jspb.BinaryReader): UnregisterMobileDeviceRequest;
}

export namespace UnregisterMobileDeviceRequest {
  export type AsObject = {
    id: string;
  };
}

export class UnregisterMobileDeviceResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): UnregisterMobileDeviceResponse;
  hasStatus(): boolean;
  clearStatus(): UnregisterMobileDeviceResponse;

  getDeletedAtMs(): number;
  setDeletedAtMs(value: number): UnregisterMobileDeviceResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UnregisterMobileDeviceResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UnregisterMobileDeviceResponse): UnregisterMobileDeviceResponse.AsObject;
  static serializeBinaryToWriter(message: UnregisterMobileDeviceResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UnregisterMobileDeviceResponse;
  static deserializeBinaryFromReader(message: UnregisterMobileDeviceResponse, reader: jspb.BinaryReader): UnregisterMobileDeviceResponse;
}

export namespace UnregisterMobileDeviceResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    deletedAtMs: number;
  };
}

export class ListTrackingNotificationsRequest extends jspb.Message {
  getPageSize(): number;
  setPageSize(value: number): ListTrackingNotificationsRequest;

  getPageToken(): string;
  setPageToken(value: string): ListTrackingNotificationsRequest;
  hasPageToken(): boolean;
  clearPageToken(): ListTrackingNotificationsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListTrackingNotificationsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListTrackingNotificationsRequest): ListTrackingNotificationsRequest.AsObject;
  static serializeBinaryToWriter(message: ListTrackingNotificationsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListTrackingNotificationsRequest;
  static deserializeBinaryFromReader(message: ListTrackingNotificationsRequest, reader: jspb.BinaryReader): ListTrackingNotificationsRequest;
}

export namespace ListTrackingNotificationsRequest {
  export type AsObject = {
    pageSize: number;
    pageToken?: string;
  };

  export enum PageTokenCase {
    _PAGE_TOKEN_NOT_SET = 0,
    PAGE_TOKEN = 2,
  }
}

export class ListTrackingNotificationsResponse extends jspb.Message {
  getTrackingNotificationsList(): Array<TrackingNotificationResponse>;
  setTrackingNotificationsList(value: Array<TrackingNotificationResponse>): ListTrackingNotificationsResponse;
  clearTrackingNotificationsList(): ListTrackingNotificationsResponse;
  addTrackingNotifications(value?: TrackingNotificationResponse, index?: number): TrackingNotificationResponse;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListTrackingNotificationsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListTrackingNotificationsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListTrackingNotificationsResponse): ListTrackingNotificationsResponse.AsObject;
  static serializeBinaryToWriter(message: ListTrackingNotificationsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListTrackingNotificationsResponse;
  static deserializeBinaryFromReader(message: ListTrackingNotificationsResponse, reader: jspb.BinaryReader): ListTrackingNotificationsResponse;
}

export namespace ListTrackingNotificationsResponse {
  export type AsObject = {
    trackingNotificationsList: Array<TrackingNotificationResponse.AsObject>;
    nextPageToken: string;
  };
}

export class TrackingNotificationResponse extends jspb.Message {
  getId(): string;
  setId(value: string): TrackingNotificationResponse;

  getMemberId(): string;
  setMemberId(value: string): TrackingNotificationResponse;

  getMemberUsername(): string;
  setMemberUsername(value: string): TrackingNotificationResponse;

  getMemberAvatarUrl(): string;
  setMemberAvatarUrl(value: string): TrackingNotificationResponse;

  getCreatedAtMs(): number;
  setCreatedAtMs(value: number): TrackingNotificationResponse;

  getTitle(): string;
  setTitle(value: string): TrackingNotificationResponse;

  getContent(): string;
  setContent(value: string): TrackingNotificationResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TrackingNotificationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: TrackingNotificationResponse): TrackingNotificationResponse.AsObject;
  static serializeBinaryToWriter(message: TrackingNotificationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TrackingNotificationResponse;
  static deserializeBinaryFromReader(message: TrackingNotificationResponse, reader: jspb.BinaryReader): TrackingNotificationResponse;
}

export namespace TrackingNotificationResponse {
  export type AsObject = {
    id: string;
    memberId: string;
    memberUsername: string;
    memberAvatarUrl: string;
    createdAtMs: number;
    title: string;
    content: string;
  };
}

export class ListRiskNotificationsRequest extends jspb.Message {
  getPageSize(): number;
  setPageSize(value: number): ListRiskNotificationsRequest;

  getPageToken(): string;
  setPageToken(value: string): ListRiskNotificationsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListRiskNotificationsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListRiskNotificationsRequest): ListRiskNotificationsRequest.AsObject;
  static serializeBinaryToWriter(message: ListRiskNotificationsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListRiskNotificationsRequest;
  static deserializeBinaryFromReader(message: ListRiskNotificationsRequest, reader: jspb.BinaryReader): ListRiskNotificationsRequest;
}

export namespace ListRiskNotificationsRequest {
  export type AsObject = {
    pageSize: number;
    pageToken: string;
  };
}

export class ListRiskNotificationsResponse extends jspb.Message {
  getRiskNotificationsList(): Array<RiskNotificationResponse>;
  setRiskNotificationsList(value: Array<RiskNotificationResponse>): ListRiskNotificationsResponse;
  clearRiskNotificationsList(): ListRiskNotificationsResponse;
  addRiskNotifications(value?: RiskNotificationResponse, index?: number): RiskNotificationResponse;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListRiskNotificationsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListRiskNotificationsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListRiskNotificationsResponse): ListRiskNotificationsResponse.AsObject;
  static serializeBinaryToWriter(message: ListRiskNotificationsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListRiskNotificationsResponse;
  static deserializeBinaryFromReader(message: ListRiskNotificationsResponse, reader: jspb.BinaryReader): ListRiskNotificationsResponse;
}

export namespace ListRiskNotificationsResponse {
  export type AsObject = {
    riskNotificationsList: Array<RiskNotificationResponse.AsObject>;
    nextPageToken: string;
  };
}

export class RiskNotificationResponse extends jspb.Message {
  getId(): string;
  setId(value: string): RiskNotificationResponse;

  getMemberId(): string;
  setMemberId(value: string): RiskNotificationResponse;

  getMemberUsername(): string;
  setMemberUsername(value: string): RiskNotificationResponse;

  getMemberAvatarUrl(): string;
  setMemberAvatarUrl(value: string): RiskNotificationResponse;

  getCreatedAtMs(): number;
  setCreatedAtMs(value: number): RiskNotificationResponse;

  getTitle(): string;
  setTitle(value: string): RiskNotificationResponse;

  getContent(): string;
  setContent(value: string): RiskNotificationResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RiskNotificationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RiskNotificationResponse): RiskNotificationResponse.AsObject;
  static serializeBinaryToWriter(message: RiskNotificationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RiskNotificationResponse;
  static deserializeBinaryFromReader(message: RiskNotificationResponse, reader: jspb.BinaryReader): RiskNotificationResponse;
}

export namespace RiskNotificationResponse {
  export type AsObject = {
    id: string;
    memberId: string;
    memberUsername: string;
    memberAvatarUrl: string;
    createdAtMs: number;
    title: string;
    content: string;
  };
}

export class DeleteTrackingNotificationRequest extends jspb.Message {
  getId(): string;
  setId(value: string): DeleteTrackingNotificationRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteTrackingNotificationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteTrackingNotificationRequest): DeleteTrackingNotificationRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteTrackingNotificationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteTrackingNotificationRequest;
  static deserializeBinaryFromReader(message: DeleteTrackingNotificationRequest, reader: jspb.BinaryReader): DeleteTrackingNotificationRequest;
}

export namespace DeleteTrackingNotificationRequest {
  export type AsObject = {
    id: string;
  };
}

export class DeleteTrackingNotificationResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): DeleteTrackingNotificationResponse;
  hasStatus(): boolean;
  clearStatus(): DeleteTrackingNotificationResponse;

  getDeletedAtMs(): number;
  setDeletedAtMs(value: number): DeleteTrackingNotificationResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteTrackingNotificationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteTrackingNotificationResponse): DeleteTrackingNotificationResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteTrackingNotificationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteTrackingNotificationResponse;
  static deserializeBinaryFromReader(message: DeleteTrackingNotificationResponse, reader: jspb.BinaryReader): DeleteTrackingNotificationResponse;
}

export namespace DeleteTrackingNotificationResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    deletedAtMs: number;
  };
}

export class DeleteRiskNotificationRequest extends jspb.Message {
  getId(): string;
  setId(value: string): DeleteRiskNotificationRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteRiskNotificationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteRiskNotificationRequest): DeleteRiskNotificationRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteRiskNotificationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteRiskNotificationRequest;
  static deserializeBinaryFromReader(message: DeleteRiskNotificationRequest, reader: jspb.BinaryReader): DeleteRiskNotificationRequest;
}

export namespace DeleteRiskNotificationRequest {
  export type AsObject = {
    id: string;
  };
}

export class DeleteRiskNotificationResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): DeleteRiskNotificationResponse;
  hasStatus(): boolean;
  clearStatus(): DeleteRiskNotificationResponse;

  getDeletedAtMs(): number;
  setDeletedAtMs(value: number): DeleteRiskNotificationResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteRiskNotificationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteRiskNotificationResponse): DeleteRiskNotificationResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteRiskNotificationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteRiskNotificationResponse;
  static deserializeBinaryFromReader(message: DeleteRiskNotificationResponse, reader: jspb.BinaryReader): DeleteRiskNotificationResponse;
}

export namespace DeleteRiskNotificationResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    deletedAtMs: number;
  };
}

export class DeleteTrackingNotificationsRequest extends jspb.Message {
  getIdsList(): Array<string>;
  setIdsList(value: Array<string>): DeleteTrackingNotificationsRequest;
  clearIdsList(): DeleteTrackingNotificationsRequest;
  addIds(value: string, index?: number): DeleteTrackingNotificationsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteTrackingNotificationsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteTrackingNotificationsRequest): DeleteTrackingNotificationsRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteTrackingNotificationsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteTrackingNotificationsRequest;
  static deserializeBinaryFromReader(message: DeleteTrackingNotificationsRequest, reader: jspb.BinaryReader): DeleteTrackingNotificationsRequest;
}

export namespace DeleteTrackingNotificationsRequest {
  export type AsObject = {
    idsList: Array<string>;
  };
}

export class DeleteTrackingNotificationsResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): DeleteTrackingNotificationsResponse;
  hasStatus(): boolean;
  clearStatus(): DeleteTrackingNotificationsResponse;

  getDeletedAtMs(): number;
  setDeletedAtMs(value: number): DeleteTrackingNotificationsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteTrackingNotificationsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteTrackingNotificationsResponse): DeleteTrackingNotificationsResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteTrackingNotificationsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteTrackingNotificationsResponse;
  static deserializeBinaryFromReader(message: DeleteTrackingNotificationsResponse, reader: jspb.BinaryReader): DeleteTrackingNotificationsResponse;
}

export namespace DeleteTrackingNotificationsResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    deletedAtMs: number;
  };
}

export class DeleteRiskNotificationsRequest extends jspb.Message {
  getIdsList(): Array<string>;
  setIdsList(value: Array<string>): DeleteRiskNotificationsRequest;
  clearIdsList(): DeleteRiskNotificationsRequest;
  addIds(value: string, index?: number): DeleteRiskNotificationsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteRiskNotificationsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteRiskNotificationsRequest): DeleteRiskNotificationsRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteRiskNotificationsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteRiskNotificationsRequest;
  static deserializeBinaryFromReader(message: DeleteRiskNotificationsRequest, reader: jspb.BinaryReader): DeleteRiskNotificationsRequest;
}

export namespace DeleteRiskNotificationsRequest {
  export type AsObject = {
    idsList: Array<string>;
  };
}

export class DeleteRiskNotificationsResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): DeleteRiskNotificationsResponse;
  hasStatus(): boolean;
  clearStatus(): DeleteRiskNotificationsResponse;

  getDeletedAtMs(): number;
  setDeletedAtMs(value: number): DeleteRiskNotificationsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteRiskNotificationsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteRiskNotificationsResponse): DeleteRiskNotificationsResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteRiskNotificationsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteRiskNotificationsResponse;
  static deserializeBinaryFromReader(message: DeleteRiskNotificationsResponse, reader: jspb.BinaryReader): DeleteRiskNotificationsResponse;
}

export namespace DeleteRiskNotificationsResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    deletedAtMs: number;
  };
}

export class ClearTrackingNotificationsRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClearTrackingNotificationsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ClearTrackingNotificationsRequest): ClearTrackingNotificationsRequest.AsObject;
  static serializeBinaryToWriter(message: ClearTrackingNotificationsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClearTrackingNotificationsRequest;
  static deserializeBinaryFromReader(message: ClearTrackingNotificationsRequest, reader: jspb.BinaryReader): ClearTrackingNotificationsRequest;
}

export namespace ClearTrackingNotificationsRequest {
  export type AsObject = {
  };
}

export class ClearTrackingNotificationsResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): ClearTrackingNotificationsResponse;
  hasStatus(): boolean;
  clearStatus(): ClearTrackingNotificationsResponse;

  getClearedAtMs(): number;
  setClearedAtMs(value: number): ClearTrackingNotificationsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClearTrackingNotificationsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ClearTrackingNotificationsResponse): ClearTrackingNotificationsResponse.AsObject;
  static serializeBinaryToWriter(message: ClearTrackingNotificationsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClearTrackingNotificationsResponse;
  static deserializeBinaryFromReader(message: ClearTrackingNotificationsResponse, reader: jspb.BinaryReader): ClearTrackingNotificationsResponse;
}

export namespace ClearTrackingNotificationsResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    clearedAtMs: number;
  };
}

export class ClearRiskNotificationsRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClearRiskNotificationsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ClearRiskNotificationsRequest): ClearRiskNotificationsRequest.AsObject;
  static serializeBinaryToWriter(message: ClearRiskNotificationsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClearRiskNotificationsRequest;
  static deserializeBinaryFromReader(message: ClearRiskNotificationsRequest, reader: jspb.BinaryReader): ClearRiskNotificationsRequest;
}

export namespace ClearRiskNotificationsRequest {
  export type AsObject = {
  };
}

export class ClearRiskNotificationsResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): ClearRiskNotificationsResponse;
  hasStatus(): boolean;
  clearStatus(): ClearRiskNotificationsResponse;

  getClearedAtMs(): number;
  setClearedAtMs(value: number): ClearRiskNotificationsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ClearRiskNotificationsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ClearRiskNotificationsResponse): ClearRiskNotificationsResponse.AsObject;
  static serializeBinaryToWriter(message: ClearRiskNotificationsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ClearRiskNotificationsResponse;
  static deserializeBinaryFromReader(message: ClearRiskNotificationsResponse, reader: jspb.BinaryReader): ClearRiskNotificationsResponse;
}

export namespace ClearRiskNotificationsResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    clearedAtMs: number;
  };
}

export class CountTrackingNotificationsRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CountTrackingNotificationsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CountTrackingNotificationsRequest): CountTrackingNotificationsRequest.AsObject;
  static serializeBinaryToWriter(message: CountTrackingNotificationsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CountTrackingNotificationsRequest;
  static deserializeBinaryFromReader(message: CountTrackingNotificationsRequest, reader: jspb.BinaryReader): CountTrackingNotificationsRequest;
}

export namespace CountTrackingNotificationsRequest {
  export type AsObject = {
  };
}

export class CountTrackingNotificationsResponse extends jspb.Message {
  getTotalCount(): number;
  setTotalCount(value: number): CountTrackingNotificationsResponse;

  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): CountTrackingNotificationsResponse;
  hasStatus(): boolean;
  clearStatus(): CountTrackingNotificationsResponse;

  getCountedAtMs(): number;
  setCountedAtMs(value: number): CountTrackingNotificationsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CountTrackingNotificationsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CountTrackingNotificationsResponse): CountTrackingNotificationsResponse.AsObject;
  static serializeBinaryToWriter(message: CountTrackingNotificationsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CountTrackingNotificationsResponse;
  static deserializeBinaryFromReader(message: CountTrackingNotificationsResponse, reader: jspb.BinaryReader): CountTrackingNotificationsResponse;
}

export namespace CountTrackingNotificationsResponse {
  export type AsObject = {
    totalCount: number;
    status?: google_rpc_status_pb.Status.AsObject;
    countedAtMs: number;
  };
}

export class CountRiskNotificationsRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CountRiskNotificationsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CountRiskNotificationsRequest): CountRiskNotificationsRequest.AsObject;
  static serializeBinaryToWriter(message: CountRiskNotificationsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CountRiskNotificationsRequest;
  static deserializeBinaryFromReader(message: CountRiskNotificationsRequest, reader: jspb.BinaryReader): CountRiskNotificationsRequest;
}

export namespace CountRiskNotificationsRequest {
  export type AsObject = {
  };
}

export class CountRiskNotificationsResponse extends jspb.Message {
  getTotalCount(): number;
  setTotalCount(value: number): CountRiskNotificationsResponse;

  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): CountRiskNotificationsResponse;
  hasStatus(): boolean;
  clearStatus(): CountRiskNotificationsResponse;

  getCountedAtMs(): number;
  setCountedAtMs(value: number): CountRiskNotificationsResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CountRiskNotificationsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CountRiskNotificationsResponse): CountRiskNotificationsResponse.AsObject;
  static serializeBinaryToWriter(message: CountRiskNotificationsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CountRiskNotificationsResponse;
  static deserializeBinaryFromReader(message: CountRiskNotificationsResponse, reader: jspb.BinaryReader): CountRiskNotificationsResponse;
}

export namespace CountRiskNotificationsResponse {
  export type AsObject = {
    totalCount: number;
    status?: google_rpc_status_pb.Status.AsObject;
    countedAtMs: number;
  };
}

