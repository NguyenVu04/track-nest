import { getMetadataMessages } from "@/utils/metadata";

export async function generateMetadata() {
  const messages = await getMetadataMessages();
  return {
    title: `${messages.auth.appName} | ${messages.nav.guidelines}`,
  };
}

export default function GuidelinesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
