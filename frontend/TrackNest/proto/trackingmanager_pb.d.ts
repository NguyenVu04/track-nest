import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb'; // proto import: "google/protobuf/wrappers.proto"


export class ConnectionRequest extends jspb.Message {
  getPermissionid(): string;
  setPermissionid(value: string): ConnectionRequest;

  getOtp(): string;
  setOtp(value: string): ConnectionRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ConnectionRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ConnectionRequest): ConnectionRequest.AsObject;
  static serializeBinaryToWriter(message: ConnectionRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ConnectionRequest;
  static deserializeBinaryFromReader(message: ConnectionRequest, reader: jspb.BinaryReader): ConnectionRequest;
}

export namespace ConnectionRequest {
  export type AsObject = {
    permissionid: string;
    otp: string;
  };
}

export class PermissionResponse extends jspb.Message {
  getId(): string;
  setId(value: string): PermissionResponse;

  getOtp(): string;
  setOtp(value: string): PermissionResponse;

  getCreatedat(): number;
  setCreatedat(value: number): PermissionResponse;

  getExpiredat(): number;
  setExpiredat(value: number): PermissionResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PermissionResponse.AsObject;
  static toObject(includeInstance: boolean, msg: PermissionResponse): PermissionResponse.AsObject;
  static serializeBinaryToWriter(message: PermissionResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PermissionResponse;
  static deserializeBinaryFromReader(message: PermissionResponse, reader: jspb.BinaryReader): PermissionResponse;
}

export namespace PermissionResponse {
  export type AsObject = {
    id: string;
    otp: string;
    createdat: number;
    expiredat: number;
  };
}

export class TargetResponse extends jspb.Message {
  getId(): string;
  setId(value: string): TargetResponse;

  getUserid(): string;
  setUserid(value: string): TargetResponse;

  getUsername(): string;
  setUsername(value: string): TargetResponse;

  getOnline(): boolean;
  setOnline(value: boolean): TargetResponse;

  getLastactive(): number;
  setLastactive(value: number): TargetResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TargetResponse.AsObject;
  static toObject(includeInstance: boolean, msg: TargetResponse): TargetResponse.AsObject;
  static serializeBinaryToWriter(message: TargetResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TargetResponse;
  static deserializeBinaryFromReader(message: TargetResponse, reader: jspb.BinaryReader): TargetResponse;
}

export namespace TargetResponse {
  export type AsObject = {
    id: string;
    userid: string;
    username: string;
    online: boolean;
    lastactive: number;
  };
}

export class TrackerResponse extends jspb.Message {
  getId(): string;
  setId(value: string): TrackerResponse;

  getUserid(): string;
  setUserid(value: string): TrackerResponse;

  getUsername(): string;
  setUsername(value: string): TrackerResponse;

  getOnline(): boolean;
  setOnline(value: boolean): TrackerResponse;

  getLastactive(): number;
  setLastactive(value: number): TrackerResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TrackerResponse.AsObject;
  static toObject(includeInstance: boolean, msg: TrackerResponse): TrackerResponse.AsObject;
  static serializeBinaryToWriter(message: TrackerResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TrackerResponse;
  static deserializeBinaryFromReader(message: TrackerResponse, reader: jspb.BinaryReader): TrackerResponse;
}

export namespace TrackerResponse {
  export type AsObject = {
    id: string;
    userid: string;
    username: string;
    online: boolean;
    lastactive: number;
  };
}

