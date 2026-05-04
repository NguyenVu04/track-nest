/**
 * Use cases under test:
 *  - REPORT-UC-08: View crime reports.
 *  - REPORT-UC-07: View missing person reports.
 *  - REPORT-UC-04: View guideline documents.
 */

const mockRouterPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("@/utils/reportAdapters", () => ({
  fetchReports: jest.fn(),
  fetchMissingPersons: jest.fn(),
  fetchGuides: jest.fn(),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    tabCrimeReports: "Crime Reports",
    tabMissing: "Missing",
    tabGuide: "Guide",
    emptyTitleReports: "No reports",
    emptySubtitleReports: "Create one",
    emptyTitleGuides: "No guides",
    emptySubtitleGuides: "Check back later",
    age: "Age",
    yearsOld: "yrs",
    lastSeen: "Last seen",
    category: "Category",
    createReport: "Create Report",
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children, ...p }: any) => <View {...p}>{children}</View>,
  };
});

import React from "react";
import { render, waitFor, fireEvent, act } from "@testing-library/react-native";
import ReportsScreen from "@/app/(app)/(tabs)/reports";
import {
  fetchReports,
  fetchMissingPersons,
  fetchGuides,
} from "@/utils/reportAdapters";

const mockFetchReports = fetchReports as jest.Mock;
const mockFetchMissing = fetchMissingPersons as jest.Mock;
const mockFetchGuides = fetchGuides as jest.Mock;

const crimeFixture = {
  id: "cr-1",
  title: "Pickpocket near market",
  address: "10.7760, 106.7000",
  date: "Apr 22, 2026",
  severity: "High" as const,
  description: "Wallet stolen.",
};

const missingFixture = {
  id: "mp-1",
  name: "Sarah Johnson",
  age: 28,
  description: "Blonde hair",
  lastSeen: "Apr 12, 2026",
  severity: "High" as const,
};

const guideFixture = {
  id: "g-1",
  title: "Personal Safety Tips",
  category: "General Safety",
  content: "Always be aware of your surroundings.",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchReports.mockResolvedValue({ data: [crimeFixture], total: 1, page: 1 });
  mockFetchMissing.mockResolvedValue({ data: [missingFixture], total: 1, page: 1 });
  mockFetchGuides.mockResolvedValue({ data: [guideFixture], total: 1, page: 1 });
});

describe("ReportsScreen", () => {
  describe("REPORT-UC-08 — View Crime Reports", () => {
    it("renders a crime report card after data loads", async () => {
      const { getByText } = render(<ReportsScreen />);

      await waitFor(() =>
        expect(getByText("Pickpocket near market")).toBeTruthy(),
      );
    });

    it("navigates to report-detail when a crime card is pressed", async () => {
      const { getByText } = render(<ReportsScreen />);
      await waitFor(() => expect(getByText("Pickpocket near market")).toBeTruthy());

      await act(async () => {
        fireEvent.press(getByText("Pickpocket near market"));
      });

      expect(mockRouterPush).toHaveBeenCalledWith("/report-detail?id=cr-1");
    });
  });

  describe("REPORT-UC-07 — View Missing Persons", () => {
    it("renders a missing person card after data loads", async () => {
      const { getByText } = render(<ReportsScreen />);

      await waitFor(() => expect(getByText("Sarah Johnson")).toBeTruthy());
    });

    it("navigates to missing-detail when a missing person card is pressed", async () => {
      const { getByText } = render(<ReportsScreen />);
      await waitFor(() => expect(getByText("Sarah Johnson")).toBeTruthy());

      await act(async () => {
        fireEvent.press(getByText("Sarah Johnson"));
      });

      expect(mockRouterPush).toHaveBeenCalledWith("/missing-detail?id=mp-1");
    });
  });

  describe("REPORT-UC-04 — View Guideline Documents", () => {
    it("renders a guide card after data loads", async () => {
      const { getByText } = render(<ReportsScreen />);

      await waitFor(() => expect(getByText("Personal Safety Tips")).toBeTruthy());
    });

    it("navigates to guideline-detail when a guide card is pressed", async () => {
      const { getByText } = render(<ReportsScreen />);
      await waitFor(() => expect(getByText("Personal Safety Tips")).toBeTruthy());

      await act(async () => {
        fireEvent.press(getByText("Personal Safety Tips"));
      });

      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.stringContaining("/guideline-detail?id=g-1"),
      );
    });
  });

  describe("FAB visibility", () => {
    it("shows the Create Report FAB on the Crime tab", async () => {
      const { getByText } = render(<ReportsScreen />);
      await waitFor(() => expect(getByText("Pickpocket near market")).toBeTruthy());
      expect(getByText("Create Report")).toBeTruthy();
    });
  });
});
