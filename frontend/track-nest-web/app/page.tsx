import type { Metadata } from "next";
import { LandingPageContent } from "@/components/landing/LandingPageContent";

export const metadata: Metadata = {
  title: "Sanctuary",
  description: "Track and manage missing person reports and crime incidents with real-time safety tooling.",
};

export default function LandingPage() {
  return <LandingPageContent />;
}
