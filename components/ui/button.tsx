import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "text";
type ButtonPresentation = "default" | "hover" | "outline" | "disabled";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  presentation?: ButtonPresentation;
};

const base =
  "inline-flex min-h-9 items-center justify-center rounded-md px-5 text-[12px] font-medium transition-colors focus-visible:outline-none disabled:cursor-not-allowed";

const styles: Record<ButtonVariant, Record<ButtonPresentation, string>> = {
  primary: {
    default: "bg-foreground text-white shadow-sm hover:bg-[#28282c]",
    hover: "bg-[#28282c] text-white shadow-sm",
    outline: "border border-border bg-white text-foreground hover:bg-subtle",
    disabled: "bg-[#e8e8e8] text-[#929292]",
  },
  secondary: {
    default: "border border-[#d7d7da] bg-white text-foreground hover:bg-subtle",
    hover: "border border-[#cacacd] bg-subtle text-foreground",
    outline: "border border-[#d7d7da] bg-white text-foreground hover:bg-subtle",
    disabled: "border border-transparent bg-[#ededed] text-[#929292]",
  },
  text: {
    default: "px-2 text-foreground hover:text-right-bias",
    hover: "px-2 text-right-bias",
    outline: "px-2 text-muted",
    disabled: "px-2 text-[#a0a0a0]",
  },
};

export function Button({ children, variant = "primary", presentation = "default", className = "", disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${styles[variant][presentation]} ${className}`}
      disabled={disabled || presentation === "disabled"}
      {...props}
    >
      {children}
    </button>
  );
}
