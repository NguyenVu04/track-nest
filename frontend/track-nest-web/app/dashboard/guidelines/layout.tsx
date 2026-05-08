import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Safety Guidelines",
};

export default function GuidelinesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
