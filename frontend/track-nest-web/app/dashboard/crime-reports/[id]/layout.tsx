import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crime Report Detail",
};

export default function CrimeReportDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
