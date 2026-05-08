import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Guideline",
};

export default function CreateGuidelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
