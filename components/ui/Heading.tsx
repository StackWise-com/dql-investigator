"use client";

interface HeadingProps {
  level?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

const sizeMap = {
  1: "text-2xl font-bold text-slate-100 tracking-tight",
  2: "text-xl font-semibold text-slate-100 tracking-tight",
  3: "text-base font-semibold text-slate-200",
  4: "text-sm font-medium text-slate-300",
};

export function Heading({ level = 2, children, className = "" }: HeadingProps) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
  return <Tag className={`${sizeMap[level]} ${className}`}>{children}</Tag>;
}
