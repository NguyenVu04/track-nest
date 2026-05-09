import { getMetadataMessages } from "@/utils/metadata";

export async function generateMetadata() {
  const messages = await getMetadataMessages();
  return {
    title: `${messages.auth.appName} | ${messages.nav.safeZones}`,
  };
}

export default function SafeZonesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
