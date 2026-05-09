import { getMetadataMessages } from "@/utils/metadata";

export async function generateMetadata() {
  const messages = await getMetadataMessages();
  return {
    title: `${messages.auth.appName} | ${messages.nav.missingPersons}`,
  };
}

export default function MissingPersonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
