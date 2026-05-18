import { ErrorPageContent } from "@/components/errors/ErrorPageContent";

export default function NotFound() {
  return (
    <ErrorPageContent
      title="Page Not Found"
      description="The page you're looking for doesn't exist or has been moved."
    />
  );
}
