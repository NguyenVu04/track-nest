"use client";

import { DashboardSummary } from "@/components/DashboardSummary";

export default function DashboardPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        <DashboardSummary />
      </div>
    </div>
  );
}
