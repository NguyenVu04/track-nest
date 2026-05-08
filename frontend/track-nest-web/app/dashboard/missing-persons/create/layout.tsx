import type { Metadata } from "next";

import { getMetadataMessages } from "@/utils/metadata";

export async function generateMetadata() {
  const messages = await getMetadataMessages();
  return {
    title: `${messages.auth.appName} | ${messages.missingPersons.formNewTitle}`,
  };
}

export default function CreateMissingPersonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
