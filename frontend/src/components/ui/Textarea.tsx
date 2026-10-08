import React, { useRef, useEffect } from "react";
import { cn } from "../../utils/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  maxLength?: number;
  currentLength?: number;
  autoResize?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      maxLength,
      currentLength,
      id,
      value,
      autoResize = true,
      rows = 3,
      onChange,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = (element: HTMLTextAreaElement | null) => {
      internalRef.current = element;
      if (typeof ref === "function") {
        ref(element);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = element;
      }
    };

    const adjustHeight = () => {
      const el = internalRef.current;
      if (!el || !autoResize) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };

    useEffect(() => {
      adjustHeight();
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (onChange) {
        onChange(e);
      }
    };

    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {(label || maxLength !== undefined) && (
          <div className="flex items-center justify-between select-none">
            {label && (
              <label
                htmlFor={textareaId}
                className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide"
              >
                {label}
              </label>
            )}
            {maxLength !== undefined && currentLength !== undefined && (
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
        <textarea
          id={textareaId}
          ref={setRefs}
          value={value}
          rows={rows}
          maxLength={maxLength}
          onChange={handleChange}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-app)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]",
            "transition-colors duration-100 ease-out resize-none leading-relaxed overflow-hidden",
            "focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20",
            "disabled:opacity-40 disabled:bg-zinc-100 dark:disabled:bg-zinc-950",
            error && "border-rose-500 focus:border-rose-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
