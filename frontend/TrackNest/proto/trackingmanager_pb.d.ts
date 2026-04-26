import * as jspb from 'google-protobuf'

import * as google_rpc_status_pb from './google/rpc/status_pb'; // proto import: "google/rpc/status.proto"


export class CreateFamilyCircleRequest extends jspb.Message {
  getName(): string;
  setName(value: string): CreateFamilyCircleRequest;

  getFamilyRole(): string;
  setFamilyRole(value: string): CreateFamilyCircleRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateFamilyCircleRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateFamilyCircleRequest): CreateFamilyCircleRequest.AsObject;
  static serializeBinaryToWriter(message: CreateFamilyCircleRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateFamilyCircleRequest;
  static deserializeBinaryFromReader(message: CreateFamilyCircleRequest, reader: jspb.BinaryReader): CreateFamilyCircleRequest;
}

export namespace CreateFamilyCircleRequest {
  export type AsObject = {
    name: string;
    familyRole: string;
  };
}

export class CreateFamilyCircleResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): CreateFamilyCircleResponse;
  hasStatus(): boolean;
  clearStatus(): CreateFamilyCircleResponse;

  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): CreateFamilyCircleResponse;

  getCreatedAtMs(): number;
  setCreatedAtMs(value: number): CreateFamilyCircleResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateFamilyCircleResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateFamilyCircleResponse): CreateFamilyCircleResponse.AsObject;
  static serializeBinaryToWriter(message: CreateFamilyCircleResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateFamilyCircleResponse;
  static deserializeBinaryFromReader(message: CreateFamilyCircleResponse, reader: jspb.BinaryReader): CreateFamilyCircleResponse;
}

export namespace CreateFamilyCircleResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    familyCircleId: string;
    createdAtMs: number;
  };
}

export class ListFamilyCirclesRequest extends jspb.Message {
  getPageSize(): number;
  setPageSize(value: number): ListFamilyCirclesRequest;

  getPageToken(): string;
  setPageToken(value: string): ListFamilyCirclesRequest;
  hasPageToken(): boolean;
  clearPageToken(): ListFamilyCirclesRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListFamilyCirclesRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListFamilyCirclesRequest): ListFamilyCirclesRequest.AsObject;
  static serializeBinaryToWriter(message: ListFamilyCirclesRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListFamilyCirclesRequest;
  static deserializeBinaryFromReader(message: ListFamilyCirclesRequest, reader: jspb.BinaryReader): ListFamilyCirclesRequest;
}

export namespace ListFamilyCirclesRequest {
  export type AsObject = {
    pageSize: number;
    pageToken?: string;
  };

  export enum PageTokenCase {
    _PAGE_TOKEN_NOT_SET = 0,
    PAGE_TOKEN = 2,
  }
}

export class FamilyCircleInfo extends jspb.Message {
  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): FamilyCircleInfo;

  getName(): string;
  setName(value: string): FamilyCircleInfo;

  getCreatedAtMs(): number;
  setCreatedAtMs(value: number): FamilyCircleInfo;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FamilyCircleInfo.AsObject;
  static toObject(includeInstance: boolean, msg: FamilyCircleInfo): FamilyCircleInfo.AsObject;
  static serializeBinaryToWriter(message: FamilyCircleInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FamilyCircleInfo;
  static deserializeBinaryFromReader(message: FamilyCircleInfo, reader: jspb.BinaryReader): FamilyCircleInfo;
}

export namespace FamilyCircleInfo {
  export type AsObject = {
    familyCircleId: string;
    name: string;
    createdAtMs: number;
  };
}

export class ListFamilyCircleResponse extends jspb.Message {
  getFamilyCirclesList(): Array<FamilyCircleInfo>;
  setFamilyCirclesList(value: Array<FamilyCircleInfo>): ListFamilyCircleResponse;
  clearFamilyCirclesList(): ListFamilyCircleResponse;
  addFamilyCircles(value?: FamilyCircleInfo, index?: number): FamilyCircleInfo;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListFamilyCircleResponse;
  hasNextPageToken(): boolean;
  clearNextPageToken(): ListFamilyCircleResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListFamilyCircleResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListFamilyCircleResponse): ListFamilyCircleResponse.AsObject;
  static serializeBinaryToWriter(message: ListFamilyCircleResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListFamilyCircleResponse;
  static deserializeBinaryFromReader(message: ListFamilyCircleResponse, reader: jspb.BinaryReader): ListFamilyCircleResponse;
}

export namespace ListFamilyCircleResponse {
  export type AsObject = {
    familyCirclesList: Array<FamilyCircleInfo.AsObject>;
    nextPageToken?: string;
  };

  export enum NextPageTokenCase {
    _NEXT_PAGE_TOKEN_NOT_SET = 0,
    NEXT_PAGE_TOKEN = 2,
  }
}

export class DeleteFamilyCircleRequest extends jspb.Message {
  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): DeleteFamilyCircleRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteFamilyCircleRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteFamilyCircleRequest): DeleteFamilyCircleRequest.AsObject;
  static serializeBinaryToWriter(message: DeleteFamilyCircleRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteFamilyCircleRequest;
  static deserializeBinaryFromReader(message: DeleteFamilyCircleRequest, reader: jspb.BinaryReader): DeleteFamilyCircleRequest;
}

export namespace DeleteFamilyCircleRequest {
  export type AsObject = {
    familyCircleId: string;
  };
}

export class DeleteFamilyCircleResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): DeleteFamilyCircleResponse;
  hasStatus(): boolean;
  clearStatus(): DeleteFamilyCircleResponse;

  getDeletedAtMs(): number;
  setDeletedAtMs(value: number): DeleteFamilyCircleResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeleteFamilyCircleResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DeleteFamilyCircleResponse): DeleteFamilyCircleResponse.AsObject;
  static serializeBinaryToWriter(message: DeleteFamilyCircleResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeleteFamilyCircleResponse;
  static deserializeBinaryFromReader(message: DeleteFamilyCircleResponse, reader: jspb.BinaryReader): DeleteFamilyCircleResponse;
}

export namespace DeleteFamilyCircleResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    deletedAtMs: number;
  };
}

export class UpdateFamilyCircleRequest extends jspb.Message {
  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): UpdateFamilyCircleRequest;

  getName(): string;
  setName(value: string): UpdateFamilyCircleRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateFamilyCircleRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateFamilyCircleRequest): UpdateFamilyCircleRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateFamilyCircleRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateFamilyCircleRequest;
  static deserializeBinaryFromReader(message: UpdateFamilyCircleRequest, reader: jspb.BinaryReader): UpdateFamilyCircleRequest;
}

export namespace UpdateFamilyCircleRequest {
  export type AsObject = {
    familyCircleId: string;
    name: string;
  };
}

export class UpdateFamilyCircleResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): UpdateFamilyCircleResponse;
  hasStatus(): boolean;
  clearStatus(): UpdateFamilyCircleResponse;

  getUpdatedAtMs(): number;
  setUpdatedAtMs(value: number): UpdateFamilyCircleResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateFamilyCircleResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateFamilyCircleResponse): UpdateFamilyCircleResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateFamilyCircleResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateFamilyCircleResponse;
  static deserializeBinaryFromReader(message: UpdateFamilyCircleResponse, reader: jspb.BinaryReader): UpdateFamilyCircleResponse;
}

export namespace UpdateFamilyCircleResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    updatedAtMs: number;
  };
}

export class UpdateFamilyRoleRequest extends jspb.Message {
  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): UpdateFamilyRoleRequest;

  getFamilyRole(): string;
  setFamilyRole(value: string): UpdateFamilyRoleRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateFamilyRoleRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateFamilyRoleRequest): UpdateFamilyRoleRequest.AsObject;
  static serializeBinaryToWriter(message: UpdateFamilyRoleRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateFamilyRoleRequest;
  static deserializeBinaryFromReader(message: UpdateFamilyRoleRequest, reader: jspb.BinaryReader): UpdateFamilyRoleRequest;
}

export namespace UpdateFamilyRoleRequest {
  export type AsObject = {
    familyCircleId: string;
    familyRole: string;
  };
}

export class UpdateFamilyRoleResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): UpdateFamilyRoleResponse;
  hasStatus(): boolean;
  clearStatus(): UpdateFamilyRoleResponse;

  getUpdatedAtMs(): number;
  setUpdatedAtMs(value: number): UpdateFamilyRoleResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateFamilyRoleResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateFamilyRoleResponse): UpdateFamilyRoleResponse.AsObject;
  static serializeBinaryToWriter(message: UpdateFamilyRoleResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateFamilyRoleResponse;
  static deserializeBinaryFromReader(message: UpdateFamilyRoleResponse, reader: jspb.BinaryReader): UpdateFamilyRoleResponse;
}

export namespace UpdateFamilyRoleResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    updatedAtMs: number;
  };
}

export class CreateParticipationPermissionRequest extends jspb.Message {
  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): CreateParticipationPermissionRequest;

  getPreviousOtp(): string;
  setPreviousOtp(value: string): CreateParticipationPermissionRequest;
  hasPreviousOtp(): boolean;
  clearPreviousOtp(): CreateParticipationPermissionRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateParticipationPermissionRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateParticipationPermissionRequest): CreateParticipationPermissionRequest.AsObject;
  static serializeBinaryToWriter(message: CreateParticipationPermissionRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateParticipationPermissionRequest;
  static deserializeBinaryFromReader(message: CreateParticipationPermissionRequest, reader: jspb.BinaryReader): CreateParticipationPermissionRequest;
}

export namespace CreateParticipationPermissionRequest {
  export type AsObject = {
    familyCircleId: string;
    previousOtp?: string;
  };

  export enum PreviousOtpCase {
    _PREVIOUS_OTP_NOT_SET = 0,
    PREVIOUS_OTP = 2,
  }
}

export class CreateParticipationPermissionResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): CreateParticipationPermissionResponse;
  hasStatus(): boolean;
  clearStatus(): CreateParticipationPermissionResponse;

  getOtp(): string;
  setOtp(value: string): CreateParticipationPermissionResponse;

  getCreatedAtMs(): number;
  setCreatedAtMs(value: number): CreateParticipationPermissionResponse;

  getExpiredAtMs(): number;
  setExpiredAtMs(value: number): CreateParticipationPermissionResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateParticipationPermissionResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateParticipationPermissionResponse): CreateParticipationPermissionResponse.AsObject;
  static serializeBinaryToWriter(message: CreateParticipationPermissionResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateParticipationPermissionResponse;
  static deserializeBinaryFromReader(message: CreateParticipationPermissionResponse, reader: jspb.BinaryReader): CreateParticipationPermissionResponse;
}

export namespace CreateParticipationPermissionResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    otp: string;
    createdAtMs: number;
    expiredAtMs: number;
  };
}

export class ParticipateInFamilyCircleRequest extends jspb.Message {
  getOtp(): string;
  setOtp(value: string): ParticipateInFamilyCircleRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ParticipateInFamilyCircleRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ParticipateInFamilyCircleRequest): ParticipateInFamilyCircleRequest.AsObject;
  static serializeBinaryToWriter(message: ParticipateInFamilyCircleRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ParticipateInFamilyCircleRequest;
  static deserializeBinaryFromReader(message: ParticipateInFamilyCircleRequest, reader: jspb.BinaryReader): ParticipateInFamilyCircleRequest;
}

export namespace ParticipateInFamilyCircleRequest {
  export type AsObject = {
    otp: string;
  };
}

export class ParticipateInFamilyCircleResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): ParticipateInFamilyCircleResponse;
  hasStatus(): boolean;
  clearStatus(): ParticipateInFamilyCircleResponse;

  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): ParticipateInFamilyCircleResponse;

  getParticipatedAtMs(): number;
  setParticipatedAtMs(value: number): ParticipateInFamilyCircleResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ParticipateInFamilyCircleResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ParticipateInFamilyCircleResponse): ParticipateInFamilyCircleResponse.AsObject;
  static serializeBinaryToWriter(message: ParticipateInFamilyCircleResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ParticipateInFamilyCircleResponse;
  static deserializeBinaryFromReader(message: ParticipateInFamilyCircleResponse, reader: jspb.BinaryReader): ParticipateInFamilyCircleResponse;
}

export namespace ParticipateInFamilyCircleResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    familyCircleId: string;
    participatedAtMs: number;
  };
}

export class LeaveFamilyCircleRequest extends jspb.Message {
  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): LeaveFamilyCircleRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LeaveFamilyCircleRequest.AsObject;
  static toObject(includeInstance: boolean, msg: LeaveFamilyCircleRequest): LeaveFamilyCircleRequest.AsObject;
  static serializeBinaryToWriter(message: LeaveFamilyCircleRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LeaveFamilyCircleRequest;
  static deserializeBinaryFromReader(message: LeaveFamilyCircleRequest, reader: jspb.BinaryReader): LeaveFamilyCircleRequest;
}

export namespace LeaveFamilyCircleRequest {
  export type AsObject = {
    familyCircleId: string;
  };
}

export class LeaveFamilyCircleResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): LeaveFamilyCircleResponse;
  hasStatus(): boolean;
  clearStatus(): LeaveFamilyCircleResponse;

  getLeftAtMs(): number;
  setLeftAtMs(value: number): LeaveFamilyCircleResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LeaveFamilyCircleResponse.AsObject;
  static toObject(includeInstance: boolean, msg: LeaveFamilyCircleResponse): LeaveFamilyCircleResponse.AsObject;
  static serializeBinaryToWriter(message: LeaveFamilyCircleResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LeaveFamilyCircleResponse;
  static deserializeBinaryFromReader(message: LeaveFamilyCircleResponse, reader: jspb.BinaryReader): LeaveFamilyCircleResponse;
}

export namespace LeaveFamilyCircleResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    leftAtMs: number;
  };
}

export class AssignFamilyCircleAdminRequest extends jspb.Message {
  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): AssignFamilyCircleAdminRequest;

  getMemberId(): string;
  setMemberId(value: string): AssignFamilyCircleAdminRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AssignFamilyCircleAdminRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AssignFamilyCircleAdminRequest): AssignFamilyCircleAdminRequest.AsObject;
  static serializeBinaryToWriter(message: AssignFamilyCircleAdminRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AssignFamilyCircleAdminRequest;
  static deserializeBinaryFromReader(message: AssignFamilyCircleAdminRequest, reader: jspb.BinaryReader): AssignFamilyCircleAdminRequest;
}

export namespace AssignFamilyCircleAdminRequest {
  export type AsObject = {
    familyCircleId: string;
    memberId: string;
  };
}

export class AssignFamilyCircleAdminResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): AssignFamilyCircleAdminResponse;
  hasStatus(): boolean;
  clearStatus(): AssignFamilyCircleAdminResponse;

  getMemberId(): string;
  setMemberId(value: string): AssignFamilyCircleAdminResponse;

  getAssignedAtMs(): number;
  setAssignedAtMs(value: number): AssignFamilyCircleAdminResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AssignFamilyCircleAdminResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AssignFamilyCircleAdminResponse): AssignFamilyCircleAdminResponse.AsObject;
  static serializeBinaryToWriter(message: AssignFamilyCircleAdminResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AssignFamilyCircleAdminResponse;
  static deserializeBinaryFromReader(message: AssignFamilyCircleAdminResponse, reader: jspb.BinaryReader): AssignFamilyCircleAdminResponse;
}

export namespace AssignFamilyCircleAdminResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    memberId: string;
    assignedAtMs: number;
  };
}

export class RemoveMemberFromFamilyCircleRequest extends jspb.Message {
  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): RemoveMemberFromFamilyCircleRequest;

  getMemberId(): string;
  setMemberId(value: string): RemoveMemberFromFamilyCircleRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveMemberFromFamilyCircleRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveMemberFromFamilyCircleRequest): RemoveMemberFromFamilyCircleRequest.AsObject;
  static serializeBinaryToWriter(message: RemoveMemberFromFamilyCircleRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveMemberFromFamilyCircleRequest;
  static deserializeBinaryFromReader(message: RemoveMemberFromFamilyCircleRequest, reader: jspb.BinaryReader): RemoveMemberFromFamilyCircleRequest;
}

export namespace RemoveMemberFromFamilyCircleRequest {
  export type AsObject = {
    familyCircleId: string;
    memberId: string;
  };
}

export class RemoveMemberFromFamilyCircleResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): RemoveMemberFromFamilyCircleResponse;
  hasStatus(): boolean;
  clearStatus(): RemoveMemberFromFamilyCircleResponse;

  getMemberId(): string;
  setMemberId(value: string): RemoveMemberFromFamilyCircleResponse;

  getRemovedAtMs(): number;
  setRemovedAtMs(value: number): RemoveMemberFromFamilyCircleResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RemoveMemberFromFamilyCircleResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RemoveMemberFromFamilyCircleResponse): RemoveMemberFromFamilyCircleResponse.AsObject;
  static serializeBinaryToWriter(message: RemoveMemberFromFamilyCircleResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RemoveMemberFromFamilyCircleResponse;
  static deserializeBinaryFromReader(message: RemoveMemberFromFamilyCircleResponse, reader: jspb.BinaryReader): RemoveMemberFromFamilyCircleResponse;
}

export namespace RemoveMemberFromFamilyCircleResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    memberId: string;
    removedAtMs: number;
  };
}

export class ListFamilyCircleMembersRequest extends jspb.Message {
  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): ListFamilyCircleMembersRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListFamilyCircleMembersRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListFamilyCircleMembersRequest): ListFamilyCircleMembersRequest.AsObject;
  static serializeBinaryToWriter(message: ListFamilyCircleMembersRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListFamilyCircleMembersRequest;
  static deserializeBinaryFromReader(message: ListFamilyCircleMembersRequest, reader: jspb.BinaryReader): ListFamilyCircleMembersRequest;
}

export namespace ListFamilyCircleMembersRequest {
  export type AsObject = {
    familyCircleId: string;
  };
}

export class FamilyCircleMemberInfo extends jspb.Message {
  getMemberId(): string;
  setMemberId(value: string): FamilyCircleMemberInfo;

  getMemberUsername(): string;
  setMemberUsername(value: string): FamilyCircleMemberInfo;

  getMemberAvatarUrl(): string;
  setMemberAvatarUrl(value: string): FamilyCircleMemberInfo;
  hasMemberAvatarUrl(): boolean;
  clearMemberAvatarUrl(): FamilyCircleMemberInfo;

  getFamilyRole(): string;
  setFamilyRole(value: string): FamilyCircleMemberInfo;

  getIsAdmin(): boolean;
  setIsAdmin(value: boolean): FamilyCircleMemberInfo;

  getOnline(): boolean;
  setOnline(value: boolean): FamilyCircleMemberInfo;

  getLastActiveMs(): number;
  setLastActiveMs(value: number): FamilyCircleMemberInfo;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FamilyCircleMemberInfo.AsObject;
  static toObject(includeInstance: boolean, msg: FamilyCircleMemberInfo): FamilyCircleMemberInfo.AsObject;
  static serializeBinaryToWriter(message: FamilyCircleMemberInfo, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FamilyCircleMemberInfo;
  static deserializeBinaryFromReader(message: FamilyCircleMemberInfo, reader: jspb.BinaryReader): FamilyCircleMemberInfo;
}

export namespace FamilyCircleMemberInfo {
  export type AsObject = {
    memberId: string;
    memberUsername: string;
    memberAvatarUrl?: string;
    familyRole: string;
    isAdmin: boolean;
    online: boolean;
    lastActiveMs: number;
  };

  export enum MemberAvatarUrlCase {
    _MEMBER_AVATAR_URL_NOT_SET = 0,
    MEMBER_AVATAR_URL = 3,
  }
}

export class ListFamilyCircleMembersResponse extends jspb.Message {
  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): ListFamilyCircleMembersResponse;
  hasStatus(): boolean;
  clearStatus(): ListFamilyCircleMembersResponse;

  getMembersList(): Array<FamilyCircleMemberInfo>;
  setMembersList(value: Array<FamilyCircleMemberInfo>): ListFamilyCircleMembersResponse;
  clearMembersList(): ListFamilyCircleMembersResponse;
  addMembers(value?: FamilyCircleMemberInfo, index?: number): FamilyCircleMemberInfo;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListFamilyCircleMembersResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListFamilyCircleMembersResponse): ListFamilyCircleMembersResponse.AsObject;
  static serializeBinaryToWriter(message: ListFamilyCircleMembersResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListFamilyCircleMembersResponse;
  static deserializeBinaryFromReader(message: ListFamilyCircleMembersResponse, reader: jspb.BinaryReader): ListFamilyCircleMembersResponse;
}

export namespace ListFamilyCircleMembersResponse {
  export type AsObject = {
    status?: google_rpc_status_pb.Status.AsObject;
    membersList: Array<FamilyCircleMemberInfo.AsObject>;
  };
}

