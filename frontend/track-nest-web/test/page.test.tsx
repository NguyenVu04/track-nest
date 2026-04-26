import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LandingPage from "@/app/page";

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

jest.mock("framer-motion", () => {
  const ReactActual = jest.requireActual<typeof React>("react");

  const MOTION_PROPS = new Set([
    "initial", "animate", "exit", "variants", "custom", "transition",
    "whileHover", "whileTap", "whileFocus", "whileDrag", "whileInView",
    "style", "onAnimationStart", "onAnimationComplete",
    "layout", "layoutId", "drag", "dragConstraints",
  ]);

  function makeMotionComponent(tag: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function MotionEl({ children, ...props }: any) {
      const filtered: Record<string, unknown> = {};
      for (const key of Object.keys(props)) {
        if (!MOTION_PROPS.has(key)) filtered[key] = props[key];
      }
      return ReactActual.createElement(tag, filtered, children);
    };
  }

  const motion = new Proxy({} as Record<string, ReturnType<typeof makeMotionComponent>>, {
    get(_t, prop: string) { return makeMotionComponent(prop); },
  });

  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => ReactActual.createElement(ReactActual.Fragment, null, children),
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: () => 0,
    useInView: () => true,
  };
});

jest.mock("next/link", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockLink = ({ href, children, ...rest }: any) =>
    React.createElement("a", { href, ...rest }, children);
  MockLink.displayName = "Link";
  return MockLink;
});

describe("LandingPage", () => {
  it("renders the hero heading", () => {
    render(<LandingPage />);
    expect(screen.getByText("Keep Your")).toBeInTheDocument();
    expect(screen.getByText("Loved Ones")).toBeInTheDocument();
    expect(screen.getByText("Close")).toBeInTheDocument();
  });

  it("renders the navbar with TrackNest logo text", () => {
    render(<LandingPage />);
    expect(screen.getAllByText("TrackNest").length).toBeGreaterThan(0);
  });

  it("renders Login link and Get Started when not authenticated", () => {
    render(<LandingPage />);
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getAllByText(/Get Started/i).length).toBeGreaterThan(0);
  });

  it("renders key feature titles", () => {
    render(<LandingPage />);
    expect(screen.getAllByText("Live Tracking").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Instant SOS").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Family Circles").length).toBeGreaterThan(0);
  });

  it("renders the stats bar values", () => {
    render(<LandingPage />);
    expect(screen.getByText("2M+")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
  });

  it("renders the CTA section", () => {
    render(<LandingPage />);
    expect(screen.getByText("Create Your Free Circle")).toBeInTheDocument();
  });

  it("renders footer with copyright notice", () => {
    render(<LandingPage />);
    expect(screen.getByText(/© 2024 TrackNest Sanctuary/i)).toBeInTheDocument();
  });
});
