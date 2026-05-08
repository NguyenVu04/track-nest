import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Emergency Requests",
};

export default function EmergencyRequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
