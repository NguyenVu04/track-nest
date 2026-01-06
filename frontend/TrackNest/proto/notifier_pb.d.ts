import * as jspb from 'google-protobuf'

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as google_protobuf_wrappers_pb from 'google-protobuf/google/protobuf/wrappers_pb'; // proto import: "google/protobuf/wrappers.proto"


export class NotificationIds extends jspb.Message {
  getIdsList(): Array<string>;
  setIdsList(value: Array<string>): NotificationIds;
  clearIdsList(): NotificationIds;
  addIds(value: string, index?: number): NotificationIds;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): NotificationIds.AsObject;
  static toObject(includeInstance: boolean, msg: NotificationIds): NotificationIds.AsObject;
  static serializeBinaryToWriter(message: NotificationIds, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): NotificationIds;
  static deserializeBinaryFromReader(message: NotificationIds, reader: jspb.BinaryReader): NotificationIds;
}

export namespace NotificationIds {
  export type AsObject = {
    idsList: Array<string>;
  };
}

export class MobileDeviceRequest extends jspb.Message {
  getDevicetoken(): string;
  setDevicetoken(value: string): MobileDeviceRequest;

  getLanguagecode(): string;
  setLanguagecode(value: string): MobileDeviceRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MobileDeviceRequest.AsObject;
  static toObject(includeInstance: boolean, msg: MobileDeviceRequest): MobileDeviceRequest.AsObject;
  static serializeBinaryToWriter(message: MobileDeviceRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MobileDeviceRequest;
  static deserializeBinaryFromReader(message: MobileDeviceRequest, reader: jspb.BinaryReader): MobileDeviceRequest;
}

export namespace MobileDeviceRequest {
  export type AsObject = {
    devicetoken: string;
    languagecode: string;
  };
}

export class TrackingNotificationResponse extends jspb.Message {
  getId(): string;
  setId(value: string): TrackingNotificationResponse;

  getTrackerid(): string;
  setTrackerid(value: string): TrackingNotificationResponse;

  getTrackerusername(): string;
  setTrackerusername(value: string): TrackingNotificationResponse;

  getTargetid(): string;
  setTargetid(value: string): TrackingNotificationResponse;

  getTargetusername(): string;
  setTargetusername(value: string): TrackingNotificationResponse;

  getCreatedat(): number;
  setCreatedat(value: number): TrackingNotificationResponse;

  getTitle(): string;
  setTitle(value: string): TrackingNotificationResponse;

  getContent(): string;
  setContent(value: string): TrackingNotificationResponse;

  getSeen(): boolean;
  setSeen(value: boolean): TrackingNotificationResponse;

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
    trackerid: string;
    trackerusername: string;
    targetid: string;
    targetusername: string;
    createdat: number;
    title: string;
    content: string;
    seen: boolean;
  };
}

export class RiskNotificationResponse extends jspb.Message {
  getId(): string;
  setId(value: string): RiskNotificationResponse;

  getTargetid(): string;
  setTargetid(value: string): RiskNotificationResponse;

  getTargetusername(): string;
  setTargetusername(value: string): RiskNotificationResponse;

  getCreatedat(): number;
  setCreatedat(value: number): RiskNotificationResponse;

  getTitle(): string;
  setTitle(value: string): RiskNotificationResponse;

  getContent(): string;
  setContent(value: string): RiskNotificationResponse;

  getSeen(): boolean;
  setSeen(value: boolean): RiskNotificationResponse;

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
    targetid: string;
    targetusername: string;
    createdat: number;
    title: string;
    content: string;
    seen: boolean;
  };
}

