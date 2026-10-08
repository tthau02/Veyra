import React from "react";
import { cn } from "../../utils/cn";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "xs" | "sm" | "md";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "secondary",
      size = "sm",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    // Transition only specific composite properties, never transition-all (avoids layout/gradient flicker)
    const baseStyles =
      "inline-flex items-center justify-center font-semibold select-none transition-[background-color,border-color,box-shadow,color,filter,opacity] duration-150 ease-out focus:outline-none disabled:opacity-40 disabled:pointer-events-none active:scale-[0.99] transform-gpu will-change-transform";

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:brightness-110 active:brightness-95 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30",
      secondary:
        "bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-800 hover:text-zinc-950 border border-zinc-200 shadow-sm dark:bg-[#181926] dark:hover:bg-[#222438] dark:active:bg-[#141520] dark:text-zinc-100 dark:hover:text-white dark:border-zinc-700/60 dark:hover:border-indigo-500/40",
      ghost:
        "bg-transparent hover:bg-zinc-100 dark:hover:bg-white/[0.06] active:bg-zinc-200 dark:active:bg-white/[0.1] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent",
      danger:
        "bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-600 dark:text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/15",
    };

    const sizeStyles = {
      xs: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
      sm: "h-8 px-3.5 text-xs gap-2 rounded-md",
      md: "h-9.5 px-4 text-sm gap-2 rounded-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-white" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
