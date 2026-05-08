import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report Incident",
};

export default function CreateCrimeReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
