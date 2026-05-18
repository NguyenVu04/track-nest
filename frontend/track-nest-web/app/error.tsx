"use client";

import { ErrorPageContent } from "@/components/errors/ErrorPageContent";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ reset }: ErrorProps) {
  return (
    <ErrorPageContent
      title="Something Went Wrong"
      description="An unexpected error occurred. You can try again or return to the home page."
      onReset={reset}
    />
  );
}
