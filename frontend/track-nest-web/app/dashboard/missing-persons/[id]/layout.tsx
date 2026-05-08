import type { Metadata } from "next";

import { getMetadataMessages } from "@/utils/metadata";

export async function generateMetadata() {
  const messages = await getMetadataMessages();
  return {
    title: `${messages.auth.appName} | ${messages.missingPersons.detailTitle}`,
  };
}

export default function MissingPersonDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
