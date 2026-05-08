import type { Metadata } from "next";

import { getMetadataMessages } from "@/utils/metadata";

export async function generateMetadata() {
  const messages = await getMetadataMessages();
  return {
    title: `${messages.auth.appName} | ${messages.guidelines.createPageTitle}`,
  };
}

export default function CreateGuidelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
