"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedListItemProps {
  children: ReactNode;
  index: number;
  className?: string;
}

export function AnimatedListItem({ children, index, className }: AnimatedListItemProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut",
      }}
      whileHover={{
        backgroundColor: "rgba(249, 250, 251, 1)",
        transition: { duration: 0.2 },
      }}
      className={className}
    >
      {children}
    </motion.tr>
  );
}
