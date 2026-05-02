import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LocaleProvider, useLocale } from "@/contexts/LocaleContext";

jest.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("@/messages/en.json", () => ({ greeting: "Hello" }));
jest.mock("@/messages/vi.json", () => ({ greeting: "Xin chào" }));

const STORAGE_KEY = "tracknest_locale";

function TestConsumer() {
  const { locale, setLocale } = useLocale();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <button onClick={() => setLocale("en")}>set-en</button>
      <button onClick={() => setLocale("vi")}>set-vi</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <LocaleProvider>
      <TestConsumer />
    </LocaleProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("LocaleProvider", () => {
  it("defaults to English when localStorage is empty", () => {
    renderWithProvider();
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
  });

  it("reads saved locale from localStorage on mount", () => {
    localStorage.setItem(STORAGE_KEY, "vi");
    renderWithProvider();
    expect(screen.getByTestId("locale")).toHaveTextContent("vi");
  });

  it("preserves valid en value from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "en");
    renderWithProvider();
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
  });

  it("falls back to en for an unrecognised locale in localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "fr");
    renderWithProvider();
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
  });

  it("falls back to en for an empty string in localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "");
    renderWithProvider();
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
  });

  it("setLocale updates the displayed locale", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("set-vi"));
    expect(screen.getByTestId("locale")).toHaveTextContent("vi");
  });

  it("setLocale persists the new locale to localStorage", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("set-vi"));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("vi");
  });

  it("setLocale can switch back to en", () => {
    localStorage.setItem(STORAGE_KEY, "vi");
    renderWithProvider();
    fireEvent.click(screen.getByText("set-en"));
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("en");
  });

  it("renders children", () => {
    render(
      <LocaleProvider>
        <span data-testid="child">hello</span>
      </LocaleProvider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});

describe("useLocale", () => {
  it("exposes locale and setLocale from context", () => {
    let capturedLocale: string | undefined;
    let capturedSetLocale: ((l: "en" | "vi") => void) | undefined;

    function Capture() {
      const ctx = useLocale();
      capturedLocale = ctx.locale;
      capturedSetLocale = ctx.setLocale;
      return null;
    }

    render(
      <LocaleProvider>
        <Capture />
      </LocaleProvider>,
    );

    expect(capturedLocale).toBe("en");
    expect(typeof capturedSetLocale).toBe("function");
  });
});
