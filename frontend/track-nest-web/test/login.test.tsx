import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// var declarations are hoisted before jest.mock factories run.
// Wrap in arrow functions so they're resolved at call-time, not at factory time.
// eslint-disable-next-line no-var
var mockInitKeycloak: jest.Mock;
// eslint-disable-next-line no-var
var mockLoginWithKeycloak: jest.Mock;

jest.mock("@/services/authService", () => ({
  authService: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initKeycloak: (...args: any[]) => mockInitKeycloak(...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loginWithKeycloak: (...args: any[]) => mockLoginWithKeycloak(...args),
    getUserInfo: jest.fn().mockResolvedValue(null),
    getUserRoles: jest.fn().mockReturnValue([]),
    logout: jest.fn().mockResolvedValue(undefined),
    getAccessToken: jest.fn().mockReturnValue(null),
    refreshToken: jest.fn().mockResolvedValue(undefined),
  },
}));

// eslint-disable-next-line no-var
var mockIsAuthenticated: boolean;

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated }),
}));

// eslint-disable-next-line no-var
var mockPush: jest.Mock;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
}));

import LoginPage from "@/app/login/page";
import { LoginContent } from "@/app/login/LoginContent";

beforeEach(() => {
  mockInitKeycloak = jest.fn().mockResolvedValue(false);
  mockLoginWithKeycloak = jest.fn().mockResolvedValue(undefined);
  mockIsAuthenticated = false;
  mockPush = jest.fn();
});

// ── LoginPage ────────────────────────────────────────────────────────────────

describe("LoginPage", () => {
  it("renders without crashing", () => {
    render(<LoginPage />);
    expect(document.body).toBeTruthy();
  });

  it("renders something in the container", () => {
    const { container } = render(<LoginPage />);
    expect(container.firstChild).toBeTruthy();
  });
});

// ── LoginContent ─────────────────────────────────────────────────────────────

describe("LoginContent", () => {
  it("shows loading spinner while keycloak initialises", () => {
    mockInitKeycloak = jest.fn().mockImplementation(() => new Promise(() => {}));
    render(<LoginContent />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("shows initialising session text while loading", () => {
    mockInitKeycloak = jest.fn().mockImplementation(() => new Promise(() => {}));
    render(<LoginContent />);
    expect(screen.getByText("initialisingSession")).toBeInTheDocument();
  });

  it("shows app name after keycloak init returns unauthenticated", async () => {
    render(<LoginContent />);
    await waitFor(() => {
      expect(screen.getByText("appName")).toBeInTheDocument();
    });
  });

  it("renders sign-in button after init", async () => {
    render(<LoginContent />);
    await waitFor(() => {
      expect(screen.getByText("signIn")).toBeInTheDocument();
    });
  });

  it("renders tagline text after init", async () => {
    render(<LoginContent />);
    await waitFor(() => {
      expect(screen.getByText("tagline")).toBeInTheDocument();
    });
  });

  it("renders three feature pills after init", async () => {
    render(<LoginContent />);
    await waitFor(() => {
      expect(screen.getByText("featureCrimeReports")).toBeInTheDocument();
      expect(screen.getByText("featureMissingPersons")).toBeInTheDocument();
      expect(screen.getByText("featureSafeZones")).toBeInTheDocument();
    });
  });

  it("renders securedBy text after init", async () => {
    render(<LoginContent />);
    await waitFor(() => {
      expect(screen.getByText("securedBy")).toBeInTheDocument();
    });
  });

  it("redirects to dashboard when already authenticated via context", async () => {
    mockIsAuthenticated = true;
    render(<LoginContent />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard/missing-persons");
    });
  });

  it("redirects to dashboard when keycloak init returns authenticated", async () => {
    mockInitKeycloak = jest.fn().mockResolvedValue(true);
    render(<LoginContent />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard/missing-persons");
    });
  });

  it("calls loginWithKeycloak when sign-in button is clicked", async () => {
    render(<LoginContent />);
    await waitFor(() => screen.getByText("signIn"));
    fireEvent.click(screen.getByText("signIn"));
    expect(mockLoginWithKeycloak).toHaveBeenCalledTimes(1);
  });

  it("shows error toast when keycloak redirect fails", async () => {
    mockLoginWithKeycloak = jest.fn().mockRejectedValueOnce(new Error("redirect failed"));
    const { toast } = require("sonner");

    render(<LoginContent />);
    await waitFor(() => screen.getByText("signIn"));
    fireEvent.click(screen.getByText("signIn"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
