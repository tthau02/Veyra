import React from "react";
import { cn } from "../../utils/cn";

export interface SegmentOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
  label?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
  size = "sm",
  fullWidth = true,
  label,
}: SegmentedControlProps<T>) {
  return (
    <div className={cn("space-y-1.5", fullWidth && "w-full")}>
      {label && (
        <span className="block text-xs font-semibold text-[var(--text-secondary)] select-none tracking-wide">
          {label}
        </span>
      )}
      <div
        className={cn(
          "inline-flex p-1 rounded-lg bg-[var(--bg-input)] border border-[var(--border-app)] select-none",
          fullWidth && "w-full flex",
          className
        )}
      >
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "inline-flex items-center justify-center font-semibold rounded-md border select-none",
                // Smooth color transition without layout shift or gradient re-render flicker
                "transition-[background-color,border-color,box-shadow,color] duration-150 ease-out transform-gpu",
                fullWidth && "flex-1",
                size === "sm" && "py-1.5 px-3 text-xs gap-2",
                size === "md" && "py-2 px-3.5 text-sm gap-2",
                isSelected
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 border-indigo-400/40"
                  : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 border-transparent"
              )}
            >
              {opt.icon && (
                <span
                  className={cn(
                    "shrink-0",
                    isSelected ? "text-white" : "text-zinc-400"
                  )}
                >
                  {opt.icon}
                </span>
              )}
              <span>{opt.label}</span>
              {opt.description && (
                <span
                  className={cn(
                    "text-xs font-normal ml-0.5",
                    isSelected ? "text-indigo-200" : "text-zinc-400"
                  )}
                >
                  ({opt.description})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
