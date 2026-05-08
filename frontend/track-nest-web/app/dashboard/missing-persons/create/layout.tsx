import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Report",
};

export default function CreateMissingPersonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
