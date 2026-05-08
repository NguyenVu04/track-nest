import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Missing Person Detail",
};

export default function MissingPersonDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
