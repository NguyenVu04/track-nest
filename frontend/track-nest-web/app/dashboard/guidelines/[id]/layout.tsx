import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guideline Detail",
};

export default function GuidelineDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
