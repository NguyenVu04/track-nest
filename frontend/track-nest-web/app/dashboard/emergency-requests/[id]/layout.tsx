import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Emergency Detail",
};

export default function EmergencyDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
