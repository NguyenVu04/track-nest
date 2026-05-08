import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Management",
};

export default function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
