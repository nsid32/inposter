import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function LogoIcon({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background rounded square */}
      <rect width="36" height="36" rx="8" fill="#0A66C2" />

      {/* Bold "IN" monogram */}
      {/* I stroke */}
      <rect x="7" y="9" width="4" height="18" rx="1" fill="white" />

      {/* N strokes */}
      <rect x="14" y="9" width="4" height="18" rx="1" fill="white" />
      <rect x="22" y="9" width="4" height="18" rx="1" fill="white" />
      {/* Diagonal stroke for N */}
      <polygon
        points="14,9 18,9 26,27 22,27"
        fill="white"
      />

      {/* Spark/quill accent — small angled lines at top right */}
      <line x1="29" y1="5" x2="32" y2="2" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="31" y1="8" x2="34" y2="7" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="8" x2="30" y2="5" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, size = 36, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoIcon size={size} />
      {showText && (
        <span
          className="font-bold text-gray-900 dark:text-white tracking-tight"
          style={{ fontSize: size * 0.55 }}
        >
          InPoster
        </span>
      )}
    </div>
  );
}
