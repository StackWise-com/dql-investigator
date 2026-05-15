"use client";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "block" | "circle";
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", variant = "block", style }: SkeletonProps) {
  const base = "animate-pulse bg-white/[0.06] rounded";
  const variantClass = variant === "circle" ? "rounded-full" : variant === "text" ? "rounded h-3" : "rounded-lg";
  return <div className={`${base} ${variantClass} ${className}`} style={style} />;
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-0">
      <div className="flex gap-4 px-3 py-2 border-b border-white/[0.06]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1 h-2.5" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-3 py-2 border-b border-white/[0.04]">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} variant="text" className="flex-1 h-2.5" style={{ opacity: 1 - i * 0.12 }} />
          ))}
        </div>
      ))}
    </div>
  );
}
