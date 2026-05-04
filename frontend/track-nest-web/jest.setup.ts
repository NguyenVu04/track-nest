import "@testing-library/jest-dom";

// ── next-intl ──────────────────────────────────────────────────────────────
// Tests assert on the translation **key**, so flows are not coupled to copy.
// Variable substitutions are serialised so we can still match per-row strings.
// IMPORTANT: `t` must be a stable reference. If useTranslations() returns a new
// function on every call, components that include `t` in a useEffect dependency
// array will re-run the effect on every render, overwriting optimistic state
// updates with fresh mock data and causing post-action DOM assertions to fail.
jest.mock("next-intl", () => {
  const stableT = (key: string, vars?: Record<string, unknown>): string =>
    vars ? `${key}:${JSON.stringify(vars)}` : key;
  return {
    useTranslations: () => stableT,
    useLocale: () => "en",
  };
});

// ── next/navigation ────────────────────────────────────────────────────────
// jest.mock factories cannot reference out-of-scope vars unless prefixed `mock*`,
// so we build the router fresh inside the factory.
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// ── sonner toast ───────────────────────────────────────────────────────────
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    message: jest.fn(),
  },
  Toaster: () => null,
}));

// ── framer-motion: render plain elements, no animation runtime ────────────
jest.mock("framer-motion", () => {
  const React = jest.requireActual("react") as typeof import("react");
  const FRAMER_ONLY_PROPS = [
    "initial",
    "animate",
    "exit",
    "transition",
    "whileHover",
    "whileTap",
    "whileInView",
    "variants",
    "layout",
    "layoutId",
  ];
  const cache = new Map<string, React.ComponentType<Record<string, unknown>>>();
  const passthrough = (tag: string) => {
    const cached = cache.get(tag);
    if (cached) return cached;
    const Component = React.forwardRef<HTMLElement, Record<string, unknown>>(
      function Motion({ children, ...rest }, ref) {
        const cleaned = { ...rest } as Record<string, unknown>;
        FRAMER_ONLY_PROPS.forEach((k) => delete cleaned[k]);
        return React.createElement(tag, { ...cleaned, ref }, children);
      },
    );
    Component.displayName = `motion.${tag}`;
    cache.set(tag, Component as React.ComponentType<Record<string, unknown>>);
    return Component;
  };
  const motion = new Proxy({}, { get: (_t, prop: string) => passthrough(prop) });
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});
