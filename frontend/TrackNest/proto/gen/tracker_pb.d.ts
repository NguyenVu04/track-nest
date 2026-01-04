// package: project.tracknest.usertracking.proto
// file: tracker.proto

import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_wrappers_pb from "google-protobuf/google/protobuf/wrappers_pb";

export class LocationHistoryRequest extends jspb.Message {
  getTargetuserid(): string;
  setTargetuserid(value: string): void;

  getLongitude(): number;
  setLongitude(value: number): void;

  getLatitude(): number;
  setLatitude(value: number): void;

  getRadius(): number;
  setRadius(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LocationHistoryRequest.AsObject;
  static toObject(includeInstance: boolean, msg: LocationHistoryRequest): LocationHistoryRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: LocationHistoryRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LocationHistoryRequest;
  static deserializeBinaryFromReader(message: LocationHistoryRequest, reader: jspb.BinaryReader): LocationHistoryRequest;
}

export namespace LocationHistoryRequest {
  export type AsObject = {
    targetuserid: string,
    longitude: number,
    latitude: number,
    radius: number,
  }
}

export class LocationRequest extends jspb.Message {
  getLatitude(): number;
  setLatitude(value: number): void;

  getLongitude(): number;
  setLongitude(value: number): void;

  getTimestamp(): number;
  setTimestamp(value: number): void;

  getAccuracy(): number;
  setAccuracy(value: number): void;

  getVelocity(): number;
  setVelocity(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LocationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: LocationRequest): LocationRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: LocationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LocationRequest;
  static deserializeBinaryFromReader(message: LocationRequest, reader: jspb.BinaryReader): LocationRequest;
}

export namespace LocationRequest {
  export type AsObject = {
    latitude: number,
    longitude: number,
    timestamp: number,
    accuracy: number,
    velocity: number,
  }
}

export class LocationResponse extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getUserid(): string;
  setUserid(value: string): void;

  getUsername(): string;
  setUsername(value: string): void;

  getLatitude(): number;
  setLatitude(value: number): void;

  getLongitude(): number;
  setLongitude(value: number): void;

  getTimestamp(): number;
  setTimestamp(value: number): void;

  getAccuracy(): number;
  setAccuracy(value: number): void;

  getVelocity(): number;
  setVelocity(value: number): void;

  getConnected(): boolean;
  setConnected(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LocationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: LocationResponse): LocationResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: LocationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LocationResponse;
  static deserializeBinaryFromReader(message: LocationResponse, reader: jspb.BinaryReader): LocationResponse;
}

export namespace LocationResponse {
  export type AsObject = {
    id: string,
    userid: string,
    username: string,
    latitude: number,
    longitude: number,
    timestamp: number,
    accuracy: number,
    velocity: number,
    connected: boolean,
  }
}

