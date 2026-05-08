import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Missing Persons",
};

export default function MissingPersonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
