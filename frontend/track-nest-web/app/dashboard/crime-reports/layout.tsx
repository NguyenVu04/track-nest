import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crime Reports",
};

export default function CrimeReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
