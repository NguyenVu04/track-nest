import "@testing-library/jest-dom";

// jest.mock is hoisted before imports; var declarations are hoisted with
// undefined so the getter closures below can safely reference them.
// eslint-disable-next-line no-var
var capturedOnConnect: (() => void) | undefined;
// eslint-disable-next-line no-var
var capturedOnStompError: ((frame: { headers: Record<string, string> }) => void) | undefined;
// eslint-disable-next-line no-var
var capturedWebSocketFactory: (() => unknown) | undefined;
// eslint-disable-next-line no-var
var mockConnected = false;

const mockActivate = jest.fn(() => capturedOnConnect?.());
const mockDeactivate = jest.fn();
const mockClientSubscribe = jest.fn(() => ({ id: "sub-1", unsubscribe: jest.fn() }));

jest.mock("@stomp/stompjs", () => ({
  Client: jest.fn().mockImplementation((config: {
    onConnect: () => void;
    onStompError: (frame: { headers: Record<string, string> }) => void;
    webSocketFactory: () => unknown;
  }) => {
    capturedOnConnect = config.onConnect;
    capturedOnStompError = config.onStompError;
    capturedWebSocketFactory = config.webSocketFactory;
    return {
      get activate() { return mockActivate; },
      get deactivate() { return mockDeactivate; },
      get subscribe() { return mockClientSubscribe; },
      get connected() { return mockConnected; },
    };
  }),
}));

jest.mock("sockjs-client", () => jest.fn(() => ({})));

// Import after mocks are registered
import stompService from "@/services/stompService";

beforeEach(() => {
  // Disconnect first so the deactivate call doesn't pollute mock counts
  stompService.disconnect();
  jest.clearAllMocks();
  mockConnected = false;
  capturedOnConnect = undefined;
  capturedOnStompError = undefined;
  capturedWebSocketFactory = undefined;
});

describe("stompService.connect", () => {
  it("resolves when onConnect fires", async () => {
    await expect(stompService.connect("my-token")).resolves.toBeUndefined();
  });

  it("calls client.activate", async () => {
    await stompService.connect("my-token");
    expect(mockActivate).toHaveBeenCalledTimes(1);
  });

  it("rejects when onStompError fires with a message header", async () => {
    mockActivate.mockImplementationOnce(() => {
      capturedOnStompError?.({ headers: { message: "Auth failed" } });
    });

    await expect(stompService.connect("my-token")).rejects.toThrow("Auth failed");
  });

  it("rejects with a fallback message when no message header present", async () => {
    mockActivate.mockImplementationOnce(() => {
      capturedOnStompError?.({ headers: {} });
    });

    await expect(stompService.connect("my-token")).rejects.toThrow(
      "STOMP connection error",
    );
  });

  it("encodes the token in the SockJS URL", async () => {
    const SockJS = require("sockjs-client") as jest.Mock;
    await stompService.connect("tok en+special");
    // webSocketFactory is called to get the SockJS instance
    capturedWebSocketFactory?.();
    expect(SockJS).toHaveBeenCalledWith(
      expect.stringContaining("tok%20en%2Bspecial"),
    );
  });

  it("includes access_token query param in the SockJS URL", async () => {
    const SockJS = require("sockjs-client") as jest.Mock;
    await stompService.connect("abc123");
    capturedWebSocketFactory?.();
    expect(SockJS).toHaveBeenCalledWith(
      expect.stringContaining("access_token=abc123"),
    );
  });
});

describe("stompService.subscribe", () => {
  it("returns null when client is not connected (client is null)", () => {
    expect(stompService.subscribe("/queue/test", jest.fn())).toBeNull();
  });

  it("returns null when client exists but connected is false", async () => {
    await stompService.connect("token");
    mockConnected = false;
    expect(stompService.subscribe("/queue/test", jest.fn())).toBeNull();
  });

  it("calls client.subscribe and returns a subscription when connected", async () => {
    await stompService.connect("token");
    mockConnected = true;

    const cb = jest.fn();
    const sub = stompService.subscribe("/queue/test", cb);

    expect(mockClientSubscribe).toHaveBeenCalledWith("/queue/test", cb);
    expect(sub).toEqual(expect.objectContaining({ id: "sub-1" }));
  });
});

describe("stompService.disconnect", () => {
  it("calls client.deactivate when a client exists", async () => {
    await stompService.connect("token");
    stompService.disconnect();
    expect(mockDeactivate).toHaveBeenCalledTimes(1);
  });

  it("does not throw when called with no active client", () => {
    expect(() => stompService.disconnect()).not.toThrow();
  });

  it("resets to disconnected state — subscribe returns null afterwards", async () => {
    await stompService.connect("token");
    mockConnected = true;
    stompService.disconnect();
    expect(stompService.subscribe("/queue/test", jest.fn())).toBeNull();
  });
});

describe("stompService.isConnected", () => {
  it("returns false when no client exists", () => {
    expect(stompService.isConnected()).toBe(false);
  });

  it("returns false when client.connected is false", async () => {
    await stompService.connect("token");
    mockConnected = false;
    expect(stompService.isConnected()).toBe(false);
  });

  it("returns true when client.connected is true", async () => {
    await stompService.connect("token");
    mockConnected = true;
    expect(stompService.isConnected()).toBe(true);
  });
});
