"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-harper-gold focus:ring-offset-2 focus:ring-offset-midnight disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-harper-gold text-midnight hover:bg-harper-gold/90 hover:shadow-lg hover:shadow-harper-gold/20":
              variant === "primary",
            "bg-transparent border border-chalk/20 text-chalk hover:border-chalk/40 hover:bg-chalk/5":
              variant === "secondary",
            "bg-transparent text-chalk/70 hover:text-chalk hover:underline":
              variant === "ghost",
          },
          {
            "text-sm px-4 py-2": size === "sm",
            "text-base px-6 py-3": size === "md",
            "text-lg px-8 py-4": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
export type { ButtonProps };
