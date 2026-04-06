"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "../ui/button";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 220 }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-50 ring-1 ring-brand-100 mb-6"
      >
        <Icon className="w-9 h-9 text-brand-500" />
      </motion.div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button onClick={onAction} className="bg-brand-500 hover:bg-brand-600 text-white">
            {actionLabel}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
