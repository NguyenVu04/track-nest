import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import LandingPage from "@/app/page";

let mockIsAuthenticated = false;

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated }),
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
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement(ReactActual.Fragment, null, children),
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

beforeEach(() => {
  mockIsAuthenticated = false;
});

// ── Navbar ────────────────────────────────────────────────────────────────────

describe("Navbar", () => {
  it("renders TrackNest logo text", () => {
    render(<LandingPage />);
    expect(screen.getAllByText("TrackNest").length).toBeGreaterThan(0);
  });

  it("renders desktop navigation links", () => {
    render(<LandingPage />);
    expect(screen.getAllByText("Features").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Safety").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Platform").length).toBeGreaterThan(0);
    expect(screen.getAllByText("About").length).toBeGreaterThan(0);
  });

  it("shows Login when not authenticated", () => {
    render(<LandingPage />);
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("shows Dashboard when authenticated", () => {
    mockIsAuthenticated = true;
    render(<LandingPage />);
    // Nav link text changes to "Dashboard"; "Login" disappears from nav
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
  });

  it("renders Get Started link in desktop nav", () => {
    render(<LandingPage />);
    expect(screen.getAllByText(/Get Started/i).length).toBeGreaterThan(0);
  });

  it("Get Started links point to /login", () => {
    render(<LandingPage />);
    const links = screen.getAllByRole("link", { name: /Get Started/i });
    links.forEach((link) => expect(link).toHaveAttribute("href", "/login"));
  });
});

// ── Mobile menu ───────────────────────────────────────────────────────────────

describe("Mobile menu", () => {
  it("mobile menu content is hidden initially", () => {
    render(<LandingPage />);
    expect(screen.getAllByText(/Get Started/i)).toHaveLength(1);
  });

  it("opens mobile menu on hamburger button click", () => {
    render(<LandingPage />);
    // Hamburger is the first button in DOM order (nav); hero has "See How It Works" button
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getAllByText(/Get Started/i)).toHaveLength(2);
  });

  it("closes mobile menu on second click", () => {
    render(<LandingPage />);
    // Open
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getAllByText(/Get Started/i)).toHaveLength(2);
    // Close — re-query the button so we get the current DOM reference
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getAllByText(/Get Started/i)).toHaveLength(1);
  });

  it("shows all nav links in mobile menu when open", () => {
    render(<LandingPage />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getAllByText("Features").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Safety").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Platform").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("About").length).toBeGreaterThanOrEqual(2);
  });
});

// ── Scroll behavior ───────────────────────────────────────────────────────────

describe("Scroll behavior", () => {
  it("navbar starts with transparent background", () => {
    render(<LandingPage />);
    const nav = document.querySelector("nav")!;
    expect(nav.className).toContain("bg-transparent");
  });

  it("registers the scroll event listener on mount", () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    render(<LandingPage />);
    expect(addSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    addSpy.mockRestore();
  });

  it("invokes scroll handler when window scroll event fires", async () => {
    render(<LandingPage />);
    // Dispatching the scroll event exercises the registered handler (setScrolled call).
    // In jsdom, window.scrollY is always 0, so scrolled stays false — the class is unchanged.
    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
    });
    const nav = document.querySelector("nav")!;
    expect(nav.className).toContain("bg-transparent");
  });

  it("cleans up scroll listener on unmount", () => {
    const removeSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = render(<LandingPage />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    removeSpy.mockRestore();
  });
});

// ── Hero section ──────────────────────────────────────────────────────────────

describe("Hero section", () => {
  it("renders all three heading lines", () => {
    render(<LandingPage />);
    expect(screen.getByText("Protect Your")).toBeInTheDocument();
    expect(screen.getByText("Circle")).toBeInTheDocument();
    expect(screen.getByText("In Real Time")).toBeInTheDocument();
  });

  it("renders the badge label", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Real-time safety platform/i)).toBeInTheDocument();
  });

  it("renders the hero subtext", () => {
    render(<LandingPage />);
    expect(screen.getByText(/TrackNest connects families/i)).toBeInTheDocument();
  });

  it("renders Open the Dashboard CTA", () => {
    render(<LandingPage />);
    expect(screen.getByText("Open the Dashboard")).toBeInTheDocument();
  });

  it("renders See How It Works button", () => {
    render(<LandingPage />);
    expect(screen.getByText("See How It Works")).toBeInTheDocument();
  });

  it("renders social proof line", () => {
    render(<LandingPage />);
    expect(screen.getByText("Built for web and mobile")).toBeInTheDocument();
  });

  it("renders phone mockup SOS element", () => {
    render(<LandingPage />);
    expect(screen.getByText("SOS Emergency")).toBeInTheDocument();
  });

  it("renders family member names in phone mockup", () => {
    render(<LandingPage />);
    expect(screen.getByText("Sarah")).toBeInTheDocument();
    expect(screen.getByText("Mike")).toBeInTheDocument();
  });

  it("renders Live badge in phone mockup", () => {
    render(<LandingPage />);
    // "Live" also appears in Platform section and Stats bar — just assert presence
    expect(screen.getAllByText("Live").length).toBeGreaterThan(0);
  });

  it("renders floating All Safe notification", () => {
    render(<LandingPage />);
    expect(screen.getByText("All Safe")).toBeInTheDocument();
  });

  it("renders floating Alert notification", () => {
    render(<LandingPage />);
    expect(screen.getByText("Alert")).toBeInTheDocument();
  });
});

// ── Platform section ──────────────────────────────────────────────────────────

describe("Platform section", () => {
  it("renders section label", () => {
    render(<LandingPage />);
    expect(screen.getByText("Web and Mobile")).toBeInTheDocument();
  });

  it("renders main heading", () => {
    render(<LandingPage />);
    expect(screen.getByText("One platform, two experiences")).toBeInTheDocument();
  });

  it("renders platform description", () => {
    render(<LandingPage />);
    expect(screen.getByText(/The web app delivers dashboards/i)).toBeInTheDocument();
  });

  it("renders platform feature checklist items", () => {
    render(<LandingPage />);
    expect(
      screen.getByText(/Crime and missing-person reports with publish and review workflows/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Emergency request lifecycle with responder updates/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Guidelines library for prevention and community readiness/i),
    ).toBeInTheDocument();
  });

  it("renders TrackNest Web dashboard card", () => {
    render(<LandingPage />);
    expect(screen.getByText("TrackNest Web")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders dashboard stat labels", () => {
    render(<LandingPage />);
    expect(screen.getByText("Crime Reports")).toBeInTheDocument();
    expect(screen.getByText("Missing Persons")).toBeInTheDocument();
    // "Emergency Requests" also appears in the Features section card
    expect(screen.getAllByText("Emergency Requests").length).toBeGreaterThan(0);
  });
});

// ── Features section ──────────────────────────────────────────────────────────

describe("Features section", () => {
  it("renders section tag", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Built for real-world response/i)).toBeInTheDocument();
  });

  it("renders section heading", () => {
    render(<LandingPage />);
    expect(screen.getByText("A complete safety workflow")).toBeInTheDocument();
  });

  it("renders section description", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Web dashboards for oversight/i)).toBeInTheDocument();
  });

  it("renders Live Location Streams feature card", () => {
    render(<LandingPage />);
    expect(screen.getByText("Live Location Streams")).toBeInTheDocument();
    expect(
      screen.getByText(/Real-time location sharing across web and mobile/i),
    ).toBeInTheDocument();
  });

  it("renders Emergency Requests feature card", () => {
    render(<LandingPage />);
    // "Emergency Requests" also appears as a stat label in the Platform dashboard
    expect(screen.getAllByText("Emergency Requests").length).toBeGreaterThan(0);
    expect(screen.getByText(/Trigger SOS workflows/i)).toBeInTheDocument();
  });

  it("renders Family Circles feature card", () => {
    render(<LandingPage />);
    // "Family Circles" also appears in the footer Product column
    expect(screen.getAllByText("Family Circles").length).toBeGreaterThan(0);
    expect(screen.getByText(/Manage private circles/i)).toBeInTheDocument();
  });
});

// ── Safety section ────────────────────────────────────────────────────────────

describe("Safety section", () => {
  it("renders community powered label", () => {
    render(<LandingPage />);
    expect(screen.getByText("Community powered")).toBeInTheDocument();
  });

  it("renders Safety With Real Data heading", () => {
    render(<LandingPage />);
    // Heading uses <br/> splitting "Safety" and "With Real Data" into two text nodes;
    // query by role+name regex to avoid ambiguity with other "Safety" occurrences.
    expect(
      screen.getByRole("heading", { name: /With Real Data/i }),
    ).toBeInTheDocument();
  });

  it("renders safety description", () => {
    render(<LandingPage />);
    expect(
      screen.getByText(/TrackNest combines crime reports, missing-person workflows/i),
    ).toBeInTheDocument();
  });

  it("renders Crime Reports and Heatmaps item", () => {
    render(<LandingPage />);
    expect(screen.getByText("Crime Reports and Heatmaps")).toBeInTheDocument();
    expect(screen.getByText(/View public reports, filter by severity/i)).toBeInTheDocument();
  });

  it("renders Missing Person Response item", () => {
    render(<LandingPage />);
    expect(screen.getByText("Missing Person Response")).toBeInTheDocument();
    expect(screen.getByText(/Submit reports, manage workflows/i)).toBeInTheDocument();
  });

  it("renders Neighborhood Safety card", () => {
    render(<LandingPage />);
    expect(screen.getByText("Neighborhood Safety")).toBeInTheDocument();
    expect(screen.getByText(/Surface reports and alerts/i)).toBeInTheDocument();
  });

  it("renders Responder Console card", () => {
    render(<LandingPage />);
    expect(screen.getByText("Responder Console")).toBeInTheDocument();
  });

  it("renders Safety Guidelines Library card", () => {
    render(<LandingPage />);
    expect(screen.getByText("Safety Guidelines Library")).toBeInTheDocument();
    expect(
      screen.getByText(/Publish and browse verified guidance/i),
    ).toBeInTheDocument();
  });

  it("renders Incident Signal label", () => {
    render(<LandingPage />);
    expect(screen.getByText("Incident Signal")).toBeInTheDocument();
  });
});

// ── Stats bar ─────────────────────────────────────────────────────────────────

describe("Stats bar", () => {
  it("renders all four stat values", () => {
    render(<LandingPage />);
    expect(screen.getByText("Realtime")).toBeInTheDocument();
    expect(screen.getByText("Multi-App")).toBeInTheDocument();
    // "Live" also appears in the phone mockup badge and Platform dashboard
    expect(screen.getAllByText("Live").length).toBeGreaterThan(0);
    // "Verified" also appears in the Platform dashboard stat
    expect(screen.getAllByText("Verified").length).toBeGreaterThan(0);
  });

  it("renders all four stat labels", () => {
    render(<LandingPage />);
    expect(screen.getByText("Location Streams")).toBeInTheDocument();
    expect(screen.getByText("Web + Mobile")).toBeInTheDocument();
    expect(screen.getByText("Incident Workflows")).toBeInTheDocument();
    // "Guidelines" also appears in the Platform dashboard stat label
    expect(screen.getAllByText("Guidelines").length).toBeGreaterThan(0);
  });
});

// ── CTA section ───────────────────────────────────────────────────────────────

describe("CTA section", () => {
  it("renders Start today label", () => {
    render(<LandingPage />);
    expect(screen.getByText("Start today")).toBeInTheDocument();
  });

  it("renders CTA heading", () => {
    render(<LandingPage />);
    // Heading uses <br/> — query by role to match across the split text nodes
    expect(
      screen.getByRole("heading", { name: /Your safety network/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /is ready when you are/i }),
    ).toBeInTheDocument();
  });

  it("renders CTA description", () => {
    render(<LandingPage />);
    expect(
      screen.getByText(/Launch the web dashboard or the mobile app/i),
    ).toBeInTheDocument();
  });

  it("renders Go to Login link", () => {
    render(<LandingPage />);
    expect(screen.getByText("Go to Login")).toBeInTheDocument();
  });

  it("Go to Login link points to /login", () => {
    render(<LandingPage />);
    const link = screen.getByRole("link", { name: /Go to Login/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});

// ── Footer ────────────────────────────────────────────────────────────────────

describe("Footer", () => {
  it("renders copyright notice with 2026", () => {
    render(<LandingPage />);
    expect(screen.getByText(/© 2026 TrackNest Sanctuary/i)).toBeInTheDocument();
  });

  it("renders footer brand", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Safety tooling for real-time response/)).toBeInTheDocument();
  });

  it("renders Product column heading", () => {
    render(<LandingPage />);
    expect(screen.getByText("Product")).toBeInTheDocument();
  });

  it("renders Product column links", () => {
    render(<LandingPage />);
    expect(screen.getAllByText("Live Tracking").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Instant SOS").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Family Circles").length).toBeGreaterThan(0);
    expect(screen.getByText("Safe Zones")).toBeInTheDocument();
  });

  it("renders Resources column links", () => {
    render(<LandingPage />);
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Help Center")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("renders Company column links", () => {
    render(<LandingPage />);
    expect(screen.getByText("Company")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("Careers")).toBeInTheDocument();
    expect(screen.getByText("Partners")).toBeInTheDocument();
  });
});
