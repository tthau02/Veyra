import React from "react";
import { cn } from "../../utils/cn";

export interface StatusDotProps {
  status: "online" | "offline" | "busy" | "idle";
  pulse?: boolean;
  className?: string;
  size?: "xs" | "sm";
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  pulse = false,
  className,
  size = "sm",
}) => {
  const colorMap = {
    online: "bg-emerald-400",
    busy: "bg-amber-400",
    offline: "bg-zinc-500",
    idle: "bg-zinc-500",
  };

  const sizeMap = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
  };

  return (
    <span className={cn("relative inline-flex items-center justify-center shrink-0", className)}>
      {pulse && (
        <span
          className={cn(
            "absolute rounded-full opacity-75 animate-ping",
            sizeMap[size],
            colorMap[status]
          )}
        />
      )}
      <span className={cn("rounded-full", sizeMap[size], colorMap[status])} />
    </span>
  );
};
