"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  as?: "div" | "section" | "article";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({ children, className = "", padding = "md", as: Tag = "div" }: CardProps) {
  return (
    <Tag
      className={`
        bg-slate-900/90 border border-white/8 rounded-lg
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </Tag>
  );
}
