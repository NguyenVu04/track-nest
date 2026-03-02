"use client";

import dynamic from "next/dynamic";
import { PageTransition } from "@/components/animations/PageTransition";
import { LoadingDashboard } from "@/components/loading/LoadingDashboard";

const DashboardSummary = dynamic(
  () =>
    import("@/components/dashboard/DashboardSummary").then((mod) => ({
      default: mod.DashboardSummary,
    })),
  {
    loading: () => <LoadingDashboard />,
    ssr: false,
  },
);

export default function DashboardPage() {
  return (
    <PageTransition>
      <div className="flex-1 overflow-auto">
        <DashboardSummary />
      </div>
    </PageTransition>
  );
}
