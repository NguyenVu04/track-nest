import fetch from "cross-fetch"; // polyfill for RN

import type { ClientReadableStream } from "grpc-web";

import {
  ListMessagesRequest,
  ListMessagesResponse,
  Message,
  ReceiveMessageStreamRequest,
  SendMessageRequest,
  SendMessageResponse,
} from "@/proto/familymessenger_pb";
import { FamilyMessengerControllerClient } from "@/proto/FamilymessengerServiceClientPb";
import { getAuthMetadata, getGrpcUrl } from "@/utils";

global.fetch = global.fetch || fetch;

let _client: FamilyMessengerControllerClient | null = null;

async function getClient(): Promise<FamilyMessengerControllerClient> {
  if (!_client) {
    const url = await getGrpcUrl();

    console.log("Family Messenger gRPC URL:", url);

    _client = new FamilyMessengerControllerClient(url, null, { format: "text" });
  }
  return _client;
}

export const sendFamilyMessage = async (
  familyCircleId: string,
  messageContent: string,
): Promise<SendMessageResponse.AsObject> => {
  const request = new SendMessageRequest();
  request.setFamilyCircleId(familyCircleId);
  request.setMessageContent(messageContent);

  const metadata = await getAuthMetadata();

  try {
    const response = await (await getClient()).sendMessage(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to send family message:", error);
    throw error;
  }
};

export const listFamilyMessages = async (
  familyCircleId: string,
  pageSize: number,
  pageToken?: string,
): Promise<ListMessagesResponse.AsObject> => {
  const request = new ListMessagesRequest();
  request.setFamilyCircleId(familyCircleId);
  request.setPageSize(pageSize);
  if (pageToken) {
    request.setPageToken(pageToken);
  }

  const metadata = await getAuthMetadata();

  try {
    const response = await (await getClient()).listMessages(request, metadata);
    return response.toObject();
  } catch (error) {
    console.error("Failed to list family messages:", error);
    throw error;
  }
};

export const streamFamilyMessages = async (
  familyCircleId: string,
  onData: (message: Message.AsObject) => void,
  onError?: (err: Error) => void,
  onEnd?: () => void,
): Promise<ClientReadableStream<Message>> => {
  const request = new ReceiveMessageStreamRequest();
  request.setFamilyCircleId(familyCircleId);

  const metadata = await getAuthMetadata();
  const stream = (await getClient()).receiveMessageStream(request, metadata);

  stream.on("data", (msg: Message) => {
    onData(msg.toObject());
  });

  stream.on("error", (err: Error) => {
    console.error("Family message stream error:", err);
    onError?.(err);
  });

  stream.on("end", () => {
    onEnd?.();
  });

  return stream;
};
