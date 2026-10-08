import React from "react";
import { cn } from "../../utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  size?: "xs" | "sm";
  withDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  size = "xs",
  withDot = false,
  children,
  ...props
}) => {
  const variantStyles = {
    default: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700/80",
    success: "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/40 shadow-sm shadow-emerald-500/10",
    warning: "bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:border-amber-500/40 shadow-sm shadow-amber-500/10",
    danger: "bg-rose-500/15 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30 dark:border-rose-500/40 shadow-sm shadow-rose-500/10",
    info: "bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 dark:border-indigo-500/40 shadow-sm shadow-indigo-500/10",
    outline: "bg-zinc-50 dark:bg-transparent text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700/80",
  };

  const dotColors = {
    default: "bg-zinc-500 dark:bg-zinc-400",
    success: "bg-emerald-500 dark:bg-emerald-400",
    warning: "bg-amber-500 dark:bg-amber-400",
    danger: "bg-rose-500 dark:bg-rose-400",
    info: "bg-indigo-500 dark:bg-indigo-400",
    outline: "bg-zinc-500 dark:bg-zinc-400",
  };

  const sizeStyles = {
    xs: "text-xs px-2 py-0.5 gap-1.5",
    sm: "text-xs px-2.5 py-1 gap-2 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-md border select-none leading-none tracking-wide",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {withDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])} />
      )}
      {children}
    </span>
  );
};
