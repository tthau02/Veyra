import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../utils/cn";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  value?: string;
  defaultValue?: string;
  options?: SelectOption[];
  children?: React.ReactNode;
  onChange?: (e: any) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

function extractChildrenText(children: React.ReactNode): string {
  if (children === null || children === undefined) return "";
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(extractChildrenText).join("");
  }
  if (React.isValidElement(children)) {
    return extractChildrenText((children.props as any).children);
  }
  return String(children);
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  defaultValue,
  options,
  children,
  onChange,
  disabled = false,
  className,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  // Extract options from props or children
  const parsedOptions: SelectOption[] = [];
  if (options && options.length > 0) {
    parsedOptions.push(...options);
  } else if (children) {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const text = extractChildrenText(child.props.children);
        const val =
          child.props.value !== undefined
            ? String(child.props.value)
            : text;
        const lbl = text || val;
        parsedOptions.push({
          value: val,
          label: lbl,
          disabled: Boolean(child.props.disabled),
        });
      }
    });
  }

  // Manage internal value state if uncontrolled
  const [internalValue, setInternalValue] = useState<string>(
    value ?? defaultValue ?? (parsedOptions[0]?.value || "")
  );

  const selectedValue = value !== undefined ? value : internalValue;
  const currentOption = parsedOptions.find((opt) => opt.value === selectedValue) || parsedOptions[0];

  // Highlighted index for keyboard navigation
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Synchronize internal value when controlled value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Reset highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const idx = parsedOptions.findIndex((opt) => opt.value === selectedValue);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, selectedValue]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    setInternalValue(optionValue);
    setIsOpen(false);

    if (onChange) {
      const syntheticEvent = {
        target: { value: optionValue, name: id },
        currentTarget: { value: optionValue, name: id },
        value: optionValue,
      };
      onChange(syntheticEvent);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape" || e.key === "Tab") {
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev + 1;
        while (next < parsedOptions.length && parsedOptions[next]?.disabled) {
          next++;
        }
        return next < parsedOptions.length ? next : prev;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        let next = prev - 1;
        while (next >= 0 && parsedOptions[next]?.disabled) {
          next--;
        }
        return next >= 0 ? next : prev;
      });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < parsedOptions.length) {
        const opt = parsedOptions[highlightedIndex];
        if (opt && !opt.disabled) {
          handleSelect(opt.value);
        }
      }
    }
  };

  const renderLabel = (labelStr: string) => {
    const match = labelStr.match(/^(.*?)\s*(\(.*?\))$/);
    if (match) {
      return (
        <span className="flex items-center gap-1.5 truncate">
          <span className="font-medium text-[var(--text-primary)] truncate">{match[1]}</span>
          <span className="text-xs text-[var(--text-secondary)] font-normal shrink-0">{match[2]}</span>
        </span>
      );
    }
    return <span className="truncate">{labelStr}</span>;
  };

  return (
    <div ref={containerRef} className="w-full space-y-1.5 relative select-none">
      {label && (
        <span className="block text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
          {label}
        </span>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full h-9 px-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-app)] text-sm text-[var(--text-primary)] flex items-center justify-between text-left",
          "hover:border-indigo-500/40 hover:bg-[var(--bg-card-hover)] transition-colors duration-100 ease-out cursor-pointer",
          "focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20",
          isOpen && "border-indigo-500/80 ring-1 ring-indigo-500/20 bg-[var(--bg-card-hover)]",
          disabled && "opacity-40 cursor-not-allowed hover:bg-[var(--bg-input)] hover:border-[var(--border-app)]",
          className
        )}
      >
        <div className="truncate pr-2 font-medium">
          {currentOption ? renderLabel(currentOption.label) : <span className="text-[var(--text-muted)]">Select...</span>}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform duration-150",
            isOpen && "rotate-180 text-indigo-400"
          )}
        />
      </button>

      {/* Custom Dropdown Popover */}
      {isOpen && (
        <div
          ref={listboxRef}
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1.5 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-app)] shadow-2xl shadow-black/20 dark:shadow-black/90 z-50 max-h-60 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {parsedOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[var(--text-muted)] text-center">
              No options available
            </div>
          ) : (
            parsedOptions.map((opt, index) => {
              const isSelected = opt.value === selectedValue;
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => !opt.disabled && handleSelect(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm flex items-center justify-between cursor-pointer transition-colors duration-100 ease-out",
                    isSelected
                      ? "bg-indigo-600/15 dark:bg-indigo-600/25 border border-indigo-500/30 text-indigo-600 dark:text-white font-semibold"
                      : isHighlighted
                      ? "bg-zinc-100 dark:bg-white/[0.08] text-[var(--text-primary)] border border-transparent"
                      : "text-[var(--text-secondary)] border border-transparent hover:bg-zinc-100 dark:hover:bg-white/[0.06] hover:text-[var(--text-primary)]",
                    opt.disabled && "opacity-30 cursor-not-allowed pointer-events-none"
                  )}
                >
                  <div className="truncate pr-2">
                    {renderLabel(opt.label)}
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
