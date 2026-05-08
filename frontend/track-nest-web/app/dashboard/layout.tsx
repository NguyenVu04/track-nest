import type { Metadata } from "next";
import { DashboardClientContent } from "./DashboardClientContent";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardClientContent>{children}</DashboardClientContent>;
}
