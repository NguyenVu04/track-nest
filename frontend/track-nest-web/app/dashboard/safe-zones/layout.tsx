import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safe Zones",
};

export default function SafeZonesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
