"use client";

import Lottie from "lottie-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const animation404 = require("@/assets/404 Error Animation.json");

interface ErrorPageContentProps {
  title?: string;
  description?: string;
  onReset?: () => void;
}

export function ErrorPageContent({ title, description, onReset }: ErrorPageContentProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafa] dark:bg-[#0f172a] p-8 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center gap-8 max-w-sm w-full text-center"
      >
        <Lottie
          animationData={animation404}
          loop
          autoplay
          style={{ width: 300, height: 300 }}
        />

        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title ?? "Page Not Found"}
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            {description ?? "The page you're looking for doesn't exist or has been moved."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {onReset && (
            <Button variant="outline" size="lg" onClick={onReset}>
              Try Again
            </Button>
          )}
          <Button
            size="lg"
            onClick={() => router.push("/")}
          >
            Back to Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
