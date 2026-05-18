"use client";

import Lottie from "lottie-react";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const animationData = require("@/assets/hummingbird 1.json");

interface LottieLoaderProps {
  size?: number;
}

export function LottieLoader({ size = 100 }: LottieLoaderProps) {
  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      style={{ width: size, height: size }}
    />
  );
}
