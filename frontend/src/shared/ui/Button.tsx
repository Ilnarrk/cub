import { ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";
import { cn } from "@shared/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "group inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:ring-offset-2 focus:ring-offset-[#08090c] disabled:opacity-40 disabled:pointer-events-none active:scale-[.98]";

    const variants = {
      primary:
        "bg-white text-[#0a0b0f] shadow-[0_12px_32px_rgba(255,255,255,.12)] hover:-translate-y-0.5 hover:bg-violet-50 hover:shadow-[0_16px_38px_rgba(124,92,255,.2)]",
      secondary:
        "border border-white/10 bg-white/[.06] text-white hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[.1]",
      ghost:
        "bg-transparent text-white/60 hover:bg-white/[.06] hover:text-white",
      danger:
        "border border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20",
    };

    const sizes = {
      sm: "px-3 py-2 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3.5 text-[15px]",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : icon && iconPosition === "left" ? (
          <span>{icon}</span>
        ) : null}
        {children}
        {icon && iconPosition === "right" && <span>{icon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
