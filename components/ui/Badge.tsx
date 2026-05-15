"use client";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "accent" | "rank";
  size?: "sm" | "md";
  className?: string;
}

const variantClasses = {
  default: "bg-white/8 text-slate-300 border border-white/8",
  success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  danger: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  accent: "bg-accent/10 text-accent border border-accent/20",
  rank: "bg-slate-800 text-slate-200 border border-white/12 font-semibold",
};

const sizeClasses = {
  sm: "text-xs px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
};

export function Badge({ children, variant = "default", size = "md", className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
