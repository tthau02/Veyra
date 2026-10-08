import React from "react";
import { cn } from "../../utils/cn";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  label?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  id,
  className,
  label,
  description,
  icon,
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-[var(--text-primary)] leading-none">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[var(--text-secondary)] mt-1">
              {description}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-1 focus:ring-offset-transparent",
          checked ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700",
          disabled && "opacity-40 cursor-not-allowed pointer-events-none"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        >
          {icon && <span className="scale-75 text-zinc-600">{icon}</span>}
        </span>
      </button>
    </div>
  );
};
