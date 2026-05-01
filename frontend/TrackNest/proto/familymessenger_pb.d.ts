import * as jspb from 'google-protobuf'

import * as google_rpc_status_pb from './google/rpc/status_pb'; // proto import: "google/rpc/status.proto"


export class SendMessageRequest extends jspb.Message {
  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): SendMessageRequest;

  getMessageContent(): string;
  setMessageContent(value: string): SendMessageRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendMessageRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SendMessageRequest): SendMessageRequest.AsObject;
  static serializeBinaryToWriter(message: SendMessageRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendMessageRequest;
  static deserializeBinaryFromReader(message: SendMessageRequest, reader: jspb.BinaryReader): SendMessageRequest;
}

export namespace SendMessageRequest {
  export type AsObject = {
    familyCircleId: string;
    messageContent: string;
  };
}

export class SendMessageResponse extends jspb.Message {
  getMessageId(): string;
  setMessageId(value: string): SendMessageResponse;

  getSentAtMs(): number;
  setSentAtMs(value: number): SendMessageResponse;

  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): SendMessageResponse;
  hasStatus(): boolean;
  clearStatus(): SendMessageResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendMessageResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SendMessageResponse): SendMessageResponse.AsObject;
  static serializeBinaryToWriter(message: SendMessageResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendMessageResponse;
  static deserializeBinaryFromReader(message: SendMessageResponse, reader: jspb.BinaryReader): SendMessageResponse;
}

export namespace SendMessageResponse {
  export type AsObject = {
    messageId: string;
    sentAtMs: number;
    status?: google_rpc_status_pb.Status.AsObject;
  };
}

export class ListMessagesRequest extends jspb.Message {
  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): ListMessagesRequest;

  getPageSize(): number;
  setPageSize(value: number): ListMessagesRequest;

  getPageToken(): string;
  setPageToken(value: string): ListMessagesRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListMessagesRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ListMessagesRequest): ListMessagesRequest.AsObject;
  static serializeBinaryToWriter(message: ListMessagesRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListMessagesRequest;
  static deserializeBinaryFromReader(message: ListMessagesRequest, reader: jspb.BinaryReader): ListMessagesRequest;
}

export namespace ListMessagesRequest {
  export type AsObject = {
    familyCircleId: string;
    pageSize: number;
    pageToken: string;
  };
}

export class ListMessagesResponse extends jspb.Message {
  getMessagesList(): Array<Message>;
  setMessagesList(value: Array<Message>): ListMessagesResponse;
  clearMessagesList(): ListMessagesResponse;
  addMessages(value?: Message, index?: number): Message;

  getNextPageToken(): string;
  setNextPageToken(value: string): ListMessagesResponse;

  getStatus(): google_rpc_status_pb.Status | undefined;
  setStatus(value?: google_rpc_status_pb.Status): ListMessagesResponse;
  hasStatus(): boolean;
  clearStatus(): ListMessagesResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListMessagesResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ListMessagesResponse): ListMessagesResponse.AsObject;
  static serializeBinaryToWriter(message: ListMessagesResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListMessagesResponse;
  static deserializeBinaryFromReader(message: ListMessagesResponse, reader: jspb.BinaryReader): ListMessagesResponse;
}

export namespace ListMessagesResponse {
  export type AsObject = {
    messagesList: Array<Message.AsObject>;
    nextPageToken: string;
    status?: google_rpc_status_pb.Status.AsObject;
  };
}

export class Message extends jspb.Message {
  getMessageId(): string;
  setMessageId(value: string): Message;

  getSenderId(): string;
  setSenderId(value: string): Message;

  getMessageContent(): string;
  setMessageContent(value: string): Message;

  getSentAtMs(): number;
  setSentAtMs(value: number): Message;

  getSenderName(): string;
  setSenderName(value: string): Message;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Message.AsObject;
  static toObject(includeInstance: boolean, msg: Message): Message.AsObject;
  static serializeBinaryToWriter(message: Message, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Message;
  static deserializeBinaryFromReader(message: Message, reader: jspb.BinaryReader): Message;
}

export namespace Message {
  export type AsObject = {
    messageId: string;
    senderId: string;
    messageContent: string;
    sentAtMs: number;
    senderName: string;
  };
}

export class ReceiveMessageStreamRequest extends jspb.Message {
  getFamilyCircleId(): string;
  setFamilyCircleId(value: string): ReceiveMessageStreamRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ReceiveMessageStreamRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ReceiveMessageStreamRequest): ReceiveMessageStreamRequest.AsObject;
  static serializeBinaryToWriter(message: ReceiveMessageStreamRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ReceiveMessageStreamRequest;
  static deserializeBinaryFromReader(message: ReceiveMessageStreamRequest, reader: jspb.BinaryReader): ReceiveMessageStreamRequest;
}

export namespace ReceiveMessageStreamRequest {
  export type AsObject = {
    familyCircleId: string;
  };
}

