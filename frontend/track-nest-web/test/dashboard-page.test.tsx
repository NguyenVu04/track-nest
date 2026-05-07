import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("@/components/dashboard/DashboardSummary", () => ({
  DashboardSummary: () => <div data-testid="dashboard-summary" />,
}));

jest.mock("@/components/loading/LoadingDashboard", () => ({
  LoadingDashboard: () => <div data-testid="loading-dashboard" />,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const DashboardPage = (require("@/app/dashboard/page") as { default: React.ComponentType }).default;

describe("DashboardPage", () => {
  it("renders without crashing", () => {
    const { container } = render(<DashboardPage />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders the page wrapper div", () => {
    render(<DashboardPage />);
    expect(document.querySelector("div")).toBeInTheDocument();
  });

  it("renders DashboardSummary", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("dashboard-summary")).toBeInTheDocument();
  });
});
