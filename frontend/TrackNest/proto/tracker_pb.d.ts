import * as jspb from 'google-protobuf'

import * as google_rpc_status_pb from './google/rpc/status_pb'; // proto import: "google/rpc/status.proto"


export class StreamFamilyMemberLocationsRequest extends jspb.Message {
  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): StreamFamilyMemberLocationsRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamFamilyMemberLocationsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: StreamFamilyMemberLocationsRequest): StreamFamilyMemberLocationsRequest.AsObject;
  static serializeBinaryToWriter(message: StreamFamilyMemberLocationsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StreamFamilyMemberLocationsRequest;
  static deserializeBinaryFromReader(message: StreamFamilyMemberLocationsRequest, reader: jspb.BinaryReader): StreamFamilyMemberLocationsRequest;
}

export namespace StreamFamilyMemberLocationsRequest {
  export type AsObject = {
    familyCircleId: string;
  };
}

export class FamilyMemberLocation extends jspb.Message {
  getMemberId(): string;
  setMemberId(value: string): FamilyMemberLocation;

  getMemberUsername(): string;
  setMemberUsername(value: string): FamilyMemberLocation;

  getMemberAvatarUrl(): string;
  setMemberAvatarUrl(value: string): FamilyMemberLocation;
  hasMemberAvatarUrl(): boolean;
  clearMemberAvatarUrl(): FamilyMemberLocation;

  getLatitudeDeg(): number;
  setLatitudeDeg(value: number): FamilyMemberLocation;

  getLongitudeDeg(): number;
  setLongitudeDeg(value: number): FamilyMemberLocation;

  getAccuracyMeter(): number;
  setAccuracyMeter(value: number): FamilyMemberLocation;

  getVelocityMps(): number;
  setVelocityMps(value: number): FamilyMemberLocation;

  getTimestampMs(): number;
  setTimestampMs(value: number): FamilyMemberLocation;

  getOnline(): boolean;
  setOnline(value: boolean): FamilyMemberLocation;

  getLastActiveMs(): number;
  setLastActiveMs(value: number): FamilyMemberLocation;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FamilyMemberLocation.AsObject;
  static toObject(includeInstance: boolean, msg: FamilyMemberLocation): FamilyMemberLocation.AsObject;
  static serializeBinaryToWriter(message: FamilyMemberLocation, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FamilyMemberLocation;
  static deserializeBinaryFromReader(message: FamilyMemberLocation, reader: jspb.BinaryReader): FamilyMemberLocation;
}

export namespace FamilyMemberLocation {
  export type AsObject = {
    memberId: string;
    memberUsername: string;
    memberAvatarUrl?: string;
    latitudeDeg: number;
    longitudeDeg: number;
    accuracyMeter: number;
    velocityMps: number;
    timestampMs: number;
    online: boolean;
    lastActiveMs: number;
  };

  export enum MemberAvatarUrlCase {
    _MEMBER_AVATAR_URL_NOT_SET = 0,
    MEMBER_AVATAR_URL = 3,
  }
}

export class ListFamilyMemberLocationHistoryRequest extends jspb.Message {
  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): ListFamilyMemberLocationHistoryRequest;

  getMemberId(): string;
  setMemberId(value: string): ListFamilyMemberLocationHistoryRequest;

  getMemberUsername(): string;
  setMemberUsername(value: string): ListFamilyMemberLocationHistoryRequest;

  getMemberAvatarUrl(): string;
  setMemberAvatarUrl(value: string): ListFamilyMemberLocationHistoryRequest;
  hasMemberAvatarUrl(): boolean;
  clearMemberAvatarUrl(): ListFamilyMemberLocationHistoryRequest;

  getCenterLatitudeDeg(): number;
  setCenterLatitudeDeg(value: number): ListFamilyMemberLocationHistoryRequest;
  hasCenterLatitudeDeg(): boolean;
  clearCenterLatitudeDeg(): ListFamilyMemberLocationHistoryRequest;

  getCenterLongitudeDeg(): number;
  setCenterLongitudeDeg(value: number): ListFamilyMemberLocationHistoryRequest;
  hasCenterLongitudeDeg(): boolean;
  clearCenterLongitudeDeg(): ListFamilyMemberLocationHistoryRequest;

  getRadiusMeter(): number;
  setRadiusMeter(value: number): ListFamilyMemberLocationHistoryRequest;
  hasRadiusMeter(): boolean;
  clearRadiusMeter(): ListFamilyMemberLocationHistoryRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListFamilyMemberLocationHistoryRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListFamilyMemberLocationHistoryRequest): ListFamilyMemberLocationHistoryRequest.AsObject;
  static serializeBinaryToWriter(message: ListFamilyMemberLocationHistoryRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListFamilyMemberLocationHistoryRequest;
  static deserializeBinaryFromReader(message: ListFamilyMemberLocationHistoryRequest, reader: jspb.BinaryReader): ListFamilyMemberLocationHistoryRequest;
}

export namespace ListFamilyMemberLocationHistoryRequest {
  export type AsObject = {
    familyCircleId: string;
    memberId: string;
    memberUsername: string;
    memberAvatarUrl?: string;
    centerLatitudeDeg?: number;
    centerLongitudeDeg?: number;
    radiusMeter?: number;
  };

  export enum MemberAvatarUrlCase {
    _MEMBER_AVATAR_URL_NOT_SET = 0,
    MEMBER_AVATAR_URL = 4,
  }

  export enum CenterLatitudeDegCase {
    _CENTER_LATITUDE_DEG_NOT_SET = 0,
    CENTER_LATITUDE_DEG = 5,
  }

  export enum CenterLongitudeDegCase {
    _CENTER_LONGITUDE_DEG_NOT_SET = 0,
    CENTER_LONGITUDE_DEG = 6,
  }

  export enum RadiusMeterCase {
    _RADIUS_METER_NOT_SET = 0,
    RADIUS_METER = 7,
  }
}

export class ListFamilyMemberLocationHistoryResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): ListFamilyMemberLocationHistoryResponse;
  hasStatus(): boolean;
  clearStatus(): ListFamilyMemberLocationHistoryResponse;

  getLocationsList(): Array<FamilyMemberLocation>;
  setLocationsList(value: Array<FamilyMemberLocation>): ListFamilyMemberLocationHistoryResponse;
  clearLocationsList(): ListFamilyMemberLocationHistoryResponse;
  addLocations(value?: FamilyMemberLocation, index?: number): FamilyMemberLocation;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListFamilyMemberLocationHistoryResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListFamilyMemberLocationHistoryResponse): ListFamilyMemberLocationHistoryResponse.AsObject;
  static serializeBinaryToWriter(message: ListFamilyMemberLocationHistoryResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListFamilyMemberLocationHistoryResponse;
  static deserializeBinaryFromReader(message: ListFamilyMemberLocationHistoryResponse, reader: jspb.BinaryReader): ListFamilyMemberLocationHistoryResponse;
}

export namespace ListFamilyMemberLocationHistoryResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    locationsList: Array<FamilyMemberLocation.AsObject>;
  };
}

export class UpdateUserLocationRequest extends jspb.Message {
  getLatitudeDeg(): number;
  setLatitudeDeg(value: number): UpdateUserLocationRequest;

  getLongitudeDeg(): number;
  setLongitudeDeg(value: number): UpdateUserLocationRequest;

  getAccuracyMeter(): number;
  setAccuracyMeter(value: number): UpdateUserLocationRequest;

  getVelocityMps(): number;
  setVelocityMps(value: number): UpdateUserLocationRequest;

  getTimestampMs(): number;
  setTimestampMs(value: number): UpdateUserLocationRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateUserLocationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateUserLocationRequest): UpdateUserLocationRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateUserLocationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateUserLocationRequest;
  static deserializeBinaryFromReader(message: UpdateUserLocationRequest, reader: jspb.BinaryReader): UpdateUserLocationRequest;
}

export namespace UpdateUserLocationRequest {
  export type AsObject = {
    latitudeDeg: number;
    longitudeDeg: number;
    accuracyMeter: number;
    velocityMps: number;
    timestampMs: number;
  };
}

export class UpdateUserLocationResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): UpdateUserLocationResponse;
  hasStatus(): boolean;
  clearStatus(): UpdateUserLocationResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateUserLocationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateUserLocationResponse): UpdateUserLocationResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateUserLocationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateUserLocationResponse;
  static deserializeBinaryFromReader(message: UpdateUserLocationResponse, reader: jspb.BinaryReader): UpdateUserLocationResponse;
}

export namespace UpdateUserLocationResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
  };
}

