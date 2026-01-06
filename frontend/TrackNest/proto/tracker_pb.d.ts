import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb'; // proto import: "google/protobuf/wrappers.proto"


export class LocationHistoryRequest extends jspb.Message {
  getTargetuserid(): string;
  setTargetuserid(value: string): LocationHistoryRequest;

  getLongitude(): number;
  setLongitude(value: number): LocationHistoryRequest;

  getLatitude(): number;
  setLatitude(value: number): LocationHistoryRequest;

  getRadius(): number;
  setRadius(value: number): LocationHistoryRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LocationHistoryRequest.AsObject;
  static toObject(includeInstance: boolean, msg: LocationHistoryRequest): LocationHistoryRequest.AsObject;
  static serializeBinaryToWriter(message: LocationHistoryRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LocationHistoryRequest;
  static deserializeBinaryFromReader(message: LocationHistoryRequest, reader: jspb.BinaryReader): LocationHistoryRequest;
}

export namespace LocationHistoryRequest {
  export type AsObject = {
    targetuserid: string;
    longitude: number;
    latitude: number;
    radius: number;
  };
}

export class LocationRequest extends jspb.Message {
  getLatitude(): number;
  setLatitude(value: number): LocationRequest;

  getLongitude(): number;
  setLongitude(value: number): LocationRequest;

  getTimestamp(): number;
  setTimestamp(value: number): LocationRequest;

  getAccuracy(): number;
  setAccuracy(value: number): LocationRequest;

  getVelocity(): number;
  setVelocity(value: number): LocationRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LocationRequest.AsObject;
  static toObject(includeInstance: boolean, msg: LocationRequest): LocationRequest.AsObject;
  static serializeBinaryToWriter(message: LocationRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LocationRequest;
  static deserializeBinaryFromReader(message: LocationRequest, reader: jspb.BinaryReader): LocationRequest;
}

export namespace LocationRequest {
  export type AsObject = {
    latitude: number;
    longitude: number;
    timestamp: number;
    accuracy: number;
    velocity: number;
  };
}

export class LocationResponse extends jspb.Message {
  getId(): string;
  setId(value: string): LocationResponse;

  getUserid(): string;
  setUserid(value: string): LocationResponse;

  getUsername(): string;
  setUsername(value: string): LocationResponse;

  getLatitude(): number;
  setLatitude(value: number): LocationResponse;

  getLongitude(): number;
  setLongitude(value: number): LocationResponse;

  getTimestamp(): number;
  setTimestamp(value: number): LocationResponse;

  getAccuracy(): number;
  setAccuracy(value: number): LocationResponse;

  getVelocity(): number;
  setVelocity(value: number): LocationResponse;

  getConnected(): boolean;
  setConnected(value: boolean): LocationResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LocationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: LocationResponse): LocationResponse.AsObject;
  static serializeBinaryToWriter(message: LocationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LocationResponse;
  static deserializeBinaryFromReader(message: LocationResponse, reader: jspb.BinaryReader): LocationResponse;
}

export namespace LocationResponse {
  export type AsObject = {
    id: string;
    userid: string;
    username: string;
    latitude: number;
    longitude: number;
    timestamp: number;
    accuracy: number;
    velocity: number;
    connected: boolean;
  };
}

