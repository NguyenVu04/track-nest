// import { createClient } from "@connectrpc/connect";
// import Constants from "expo-constants";

import fetch from "cross-fetch"; // polyfill for RN

import Constants from "expo-constants";

import { LocationHistoryRequest } from "@/proto/tracker_pb";
import { TrackerControllerClient } from "@/proto/TrackerServiceClientPb";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

global.fetch = global.fetch || fetch;

// import { TrackerController as TrackerService } from "@/proto/generated/proto/tracker_pb";
// import { createGrpcWebTransport } from "@connectrpc/connect-web";

// const authInterceptor = (next) => async (req) => {
//   const token =
//     "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJiZTl1LTJpS3d6Vkd3V09XUVNRc3pGNFBaaUV1X0RoZm8zbjE5T291bVBnIn0.eyJleHAiOjE3Njc2NTgwNTUsImlhdCI6MTc2NzYyMjA1NSwianRpIjoib25ydHJvOjMzMGUyMjEyLWY3MGYtOTY5MC05Mzc0LThmNmQyNTEwZWI1ZiIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9yZWFsbXMvdHJhY2tuZXN0LXVzZXIiLCJhdWQiOlsicmVhbG0tbWFuYWdlbWVudCIsImFjY291bnQiXSwic3ViIjoiZjhmNzM1YjQtNTQ5Yy00ZDhjLTllMTAtMTVmOGMxOThiNzFiIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidHJhY2tuZXN0Iiwic2lkIjoiMTEzZDgxNjEtZjYwZS0yNTkxLTk0ZTMtYWY3NGI1MTE4M2I3IiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIvKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJkZWZhdWx0LXJvbGVzLXRyYWNrbmVzdC11c2VyIiwidW1hX2F1dGhvcml6YXRpb24iLCJVU0VSIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsInZpZXctcmVhbG0iLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsInJlYWxtLWFkbWluIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXJlYWxtcyIsInZpZXctYXV0aG9yaXphdGlvbiIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS11c2VycyIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIiwicXVlcnktZ3JvdXBzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJKb2huIERvZSIsInByZWZlcnJlZF91c2VybmFtZSI6ImFkbWluIiwiZ2l2ZW5fbmFtZSI6IkpvaG4iLCJsb2NhbGUiOiJlbiIsImZhbWlseV9uYW1lIjoiRG9lIiwiZW1haWwiOiJhZG1pbkBnbWFpbC5jb20ifQ.O7ejekNwSdViksavdH8V44UW9ScmCMuxIFTLs2QC-oTmly8PKiQ4VQx5gHzAuzm2peR76Xbb8HopB75L6pVzCrAUz4UksPzlPiHILHHNyMTY635vdO0QlGWDDvng7rMcPXu9H2jquEX6u4JmLNfvwTrcdd_k52ZcCixJkqF5X31v8tLy0mY6ejPNy70-r8hKN1nQ3OhnUWXNzXqoVj9ahQneGMzlyP45z9bicvopwbsVpnt8pFpdAUeiGbhHG-vldJSToXAgDsj0boIJGhMkmwvwtu6HLkOyvDkkZmXoFk7mqhtTW94Sl7YNlkgFFQLneivtoAUuvyqb07kX-m8bBg";

//   if (token) {
//     req.header.set("Authorization", `Bearer ${token}`);
//   }

//   return await next(req);
// };

// const getBaseUrl = () => {
//   const hostUri = Constants.expoConfig?.hostUri; // Lấy IP dev server
//   if (!hostUri) return "http://localhost:8800"; // Fallback cho production/simulator

//   const ip = hostUri.split(":")[0];
//   return `http://${ip}:8800`;
// };

// const transport = createGrpcWebTransport({
//   baseUrl: getBaseUrl(),
//   interceptors: [authInterceptor],
//   useBinaryFormat: true,
// });

// const client = createClient(TrackerService, transport);

// export const TrackerServiceClient = client;

const jwt =
  "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJiZTl1LTJpS3d6Vkd3V09XUVNRc3pGNFBaaUV1X0RoZm8zbjE5T291bVBnIn0.eyJleHAiOjE3Njc2NzA1MTgsImlhdCI6MTc2NzYzNDUxOCwianRpIjoib25ydHJvOjMwNmY2OGZhLWNhYTYtNDBlOS05MDRjLWVmZjJiN2I0YWVmNSIsImlzcyI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9yZWFsbXMvdHJhY2tuZXN0LXVzZXIiLCJhdWQiOlsicmVhbG0tbWFuYWdlbWVudCIsImFjY291bnQiXSwic3ViIjoiZjhmNzM1YjQtNTQ5Yy00ZDhjLTllMTAtMTVmOGMxOThiNzFiIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoidHJhY2tuZXN0Iiwic2lkIjoiYmQ0N2Y5MGQtYTE3NC1kNWZkLWMwNmYtNDAyNjcyZThjZWJlIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIvKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJkZWZhdWx0LXJvbGVzLXRyYWNrbmVzdC11c2VyIiwidW1hX2F1dGhvcml6YXRpb24iLCJVU0VSIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJ2aWV3LWlkZW50aXR5LXByb3ZpZGVycyIsInZpZXctcmVhbG0iLCJtYW5hZ2UtaWRlbnRpdHktcHJvdmlkZXJzIiwiaW1wZXJzb25hdGlvbiIsInJlYWxtLWFkbWluIiwiY3JlYXRlLWNsaWVudCIsIm1hbmFnZS11c2VycyIsInF1ZXJ5LXJlYWxtcyIsInZpZXctYXV0aG9yaXphdGlvbiIsInF1ZXJ5LWNsaWVudHMiLCJxdWVyeS11c2VycyIsIm1hbmFnZS1ldmVudHMiLCJtYW5hZ2UtcmVhbG0iLCJ2aWV3LWV2ZW50cyIsInZpZXctdXNlcnMiLCJ2aWV3LWNsaWVudHMiLCJtYW5hZ2UtYXV0aG9yaXphdGlvbiIsIm1hbmFnZS1jbGllbnRzIiwicXVlcnktZ3JvdXBzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJKb2huIERvZSIsInByZWZlcnJlZF91c2VybmFtZSI6ImFkbWluIiwiZ2l2ZW5fbmFtZSI6IkpvaG4iLCJsb2NhbGUiOiJlbiIsImZhbWlseV9uYW1lIjoiRG9lIiwiZW1haWwiOiJhZG1pbkBnbWFpbC5jb20ifQ.YoV68NnN1wmjU7f9Si12g7zcCOe7JB_pBvRZFlcwKIH9uW1A2ce7ZpVQ6BekgpCoPLCQNZpKU0Vp2MxLSRhNERNEaMYQFcMCz6X2cUjfOJeZbwhfH8aElBoOSDmd9zMcsyayPktvLAkZ699nC0PRM8dXioW8PEWacb5ju_A1EhBvtVcqd8cMjAnr_j99V_FCggoGEuUx-ckdemon4VH2Fy4Hhn2QpLdpSBcH8mCJFvatRpMAszWEsWuXPZuQeJsH83pdq8Qtkg-lB2tDqzcIP2tP_hGZx83hxNtzggZqb17LoMAPmrlXIQzs24frr0pGln6PvIYFawGsUsmWU8fV5A";
const metadata = {
  Authorization: `Bearer ${jwt}`,
};

const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri; // Lấy IP dev server
  if (!hostUri) return "http://localhost:8800"; // Fallback cho production/simulator

  const ip = hostUri.split(":")[0];
  return `http://${ip}:8800`;
};

// 👇 replace localhost if running on real device
const client = new TrackerControllerClient(
  getBaseUrl(),
  null,
  { format: "text" } // 👈 IMPORTANT
);
export const startLastLocationsStream = (setState: any) => {
  const req = new Empty();

  const stream = client.getTargetsLastLocations(req, metadata);
  console.log("Creating Stream for last locations");

  stream.on("data", (msg: any) => {
    const obj = msg.toObject();
    console.log(obj);
    console.log("Received location data");
    setState((prevLocations: any[]) => [...prevLocations, obj]);
  });

  stream.on("metadata", (metadata: any) => {
    console.log("stream metadata", metadata);
  });

  stream.on("error", (err: any) => {
    console.log("stream error", err);
  });

  stream.on("status", (status: any) => {
    console.log("stream status", status);
  });

  stream.on("end", () => {
    console.log("stream ended");
  });
};

export const fetchHistoryForTarget = (targetId: string) => {
  const req = new LocationHistoryRequest();
  console.log("Fetching history for target:", targetId);
  req.setTargetuserid(targetId);

  const stream = client.getTargetLocationHistory(req, metadata);

  stream.on("data", (msg: any) => {
    const obj = msg.toObject();
    console.log(obj);
  });

  stream.on("error", (err: any) => {
    console.log("history stream error", err);
  });

  stream.on("status", (status: any) => {
    console.log("history stream status", status);
  });

  stream.on("end", () => {
    console.log("history stream ended");
  });
};
