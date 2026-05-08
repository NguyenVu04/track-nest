import type { Metadata } from "next";
import { DashboardClientContent } from "./DashboardClientContent";

import { getMetadataMessages } from "@/utils/metadata";

export async function generateMetadata() {
  const messages = await getMetadataMessages();
  return {
    title: `${messages.auth.appName} | ${messages.nav.dashboard}`,
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardClientContent>{children}</DashboardClientContent>;
}
