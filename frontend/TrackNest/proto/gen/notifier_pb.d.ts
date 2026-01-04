// package: project.tracknest.usertracking.proto
// file: notifier.proto

import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_wrappers_pb from "google-protobuf/google/protobuf/wrappers_pb";

export class NotificationIds extends jspb.Message {
  clearIdsList(): void;
  getIdsList(): Array<string>;
  setIdsList(value: Array<string>): void;
  addIds(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NotificationIds.AsObject;
  static toObject(includeInstance: boolean, msg: NotificationIds): NotificationIds.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: NotificationIds, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NotificationIds;
  static deserializeBinaryFromReader(message: NotificationIds, reader: jspb.BinaryReader): NotificationIds;
}

export namespace NotificationIds {
  export type AsObject = {
    idsList: Array<string>,
  }
}

export class MobileDeviceRequest extends jspb.Message {
  getDevicetoken(): string;
  setDevicetoken(value: string): void;

  getLanguagecode(): string;
  setLanguagecode(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MobileDeviceRequest.AsObject;
  static toObject(includeInstance: boolean, msg: MobileDeviceRequest): MobileDeviceRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MobileDeviceRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MobileDeviceRequest;
  static deserializeBinaryFromReader(message: MobileDeviceRequest, reader: jspb.BinaryReader): MobileDeviceRequest;
}

export namespace MobileDeviceRequest {
  export type AsObject = {
    devicetoken: string,
    languagecode: string,
  }
}

export class TrackingNotificationResponse extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getTrackerid(): string;
  setTrackerid(value: string): void;

  getTrackerusername(): string;
  setTrackerusername(value: string): void;

  getTargetid(): string;
  setTargetid(value: string): void;

  getTargetusername(): string;
  setTargetusername(value: string): void;

  getCreatedat(): number;
  setCreatedat(value: number): void;

  getTitle(): string;
  setTitle(value: string): void;

  getContent(): string;
  setContent(value: string): void;

  getSeen(): boolean;
  setSeen(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TrackingNotificationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: TrackingNotificationResponse): TrackingNotificationResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TrackingNotificationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TrackingNotificationResponse;
  static deserializeBinaryFromReader(message: TrackingNotificationResponse, reader: jspb.BinaryReader): TrackingNotificationResponse;
}

export namespace TrackingNotificationResponse {
  export type AsObject = {
    id: string,
    trackerid: string,
    trackerusername: string,
    targetid: string,
    targetusername: string,
    createdat: number,
    title: string,
    content: string,
    seen: boolean,
  }
}

export class RiskNotificationResponse extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getTargetid(): string;
  setTargetid(value: string): void;

  getTargetusername(): string;
  setTargetusername(value: string): void;

  getCreatedat(): number;
  setCreatedat(value: number): void;

  getTitle(): string;
  setTitle(value: string): void;

  getContent(): string;
  setContent(value: string): void;

  getSeen(): boolean;
  setSeen(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RiskNotificationResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RiskNotificationResponse): RiskNotificationResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RiskNotificationResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RiskNotificationResponse;
  static deserializeBinaryFromReader(message: RiskNotificationResponse, reader: jspb.BinaryReader): RiskNotificationResponse;
}

export namespace RiskNotificationResponse {
  export type AsObject = {
    id: string,
    targetid: string,
    targetusername: string,
    createdat: number,
    title: string,
    content: string,
    seen: boolean,
  }
}

