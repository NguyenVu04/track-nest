// package: project.tracknest.usertracking.proto
// file: trackingmanager.proto

import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_wrappers_pb from "google-protobuf/google/protobuf/wrappers_pb";

export class ConnectionRequest extends jspb.Message {
  getPermissionid(): string;
  setPermissionid(value: string): void;

  getOtp(): string;
  setOtp(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ConnectionRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ConnectionRequest): ConnectionRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ConnectionRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ConnectionRequest;
  static deserializeBinaryFromReader(message: ConnectionRequest, reader: jspb.BinaryReader): ConnectionRequest;
}

export namespace ConnectionRequest {
  export type AsObject = {
    permissionid: string,
    otp: string,
  }
}

export class PermissionResponse extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getOtp(): string;
  setOtp(value: string): void;

  getCreatedat(): number;
  setCreatedat(value: number): void;

  getExpiredat(): number;
  setExpiredat(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PermissionResponse.AsObject;
  static toObject(includeInstance: boolean, msg: PermissionResponse): PermissionResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PermissionResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PermissionResponse;
  static deserializeBinaryFromReader(message: PermissionResponse, reader: jspb.BinaryReader): PermissionResponse;
}

export namespace PermissionResponse {
  export type AsObject = {
    id: string,
    otp: string,
    createdat: number,
    expiredat: number,
  }
}

export class TargetResponse extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getUserid(): string;
  setUserid(value: string): void;

  getUsername(): string;
  setUsername(value: string): void;

  getOnline(): boolean;
  setOnline(value: boolean): void;

  getLastactive(): number;
  setLastactive(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TargetResponse.AsObject;
  static toObject(includeInstance: boolean, msg: TargetResponse): TargetResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TargetResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TargetResponse;
  static deserializeBinaryFromReader(message: TargetResponse, reader: jspb.BinaryReader): TargetResponse;
}

export namespace TargetResponse {
  export type AsObject = {
    id: string,
    userid: string,
    username: string,
    online: boolean,
    lastactive: number,
  }
}

export class TrackerResponse extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getUserid(): string;
  setUserid(value: string): void;

  getUsername(): string;
  setUsername(value: string): void;

  getOnline(): boolean;
  setOnline(value: boolean): void;

  getLastactive(): number;
  setLastactive(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TrackerResponse.AsObject;
  static toObject(includeInstance: boolean, msg: TrackerResponse): TrackerResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TrackerResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TrackerResponse;
  static deserializeBinaryFromReader(message: TrackerResponse, reader: jspb.BinaryReader): TrackerResponse;
}

export namespace TrackerResponse {
  export type AsObject = {
    id: string,
    userid: string,
    username: string,
    online: boolean,
    lastactive: number,
  }
}

