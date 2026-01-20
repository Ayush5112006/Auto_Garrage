import React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg" | string;
  variant?: string;
};

type ButtonVariantsProps = {
  variant?: "default" | "outline" | "ghost" | "destructive" | string;
  size?: "sm" | "md" | "lg" | string;
};

const baseStyles = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const buttonVariants = ({ variant = "default", size = "md" }: ButtonVariantsProps = {}): string => {
  return cn(
    baseStyles,
    variants[variant as keyof typeof variants] || variants.default,
    sizes[size as keyof typeof sizes] || sizes.md
  );
};

export const Button = ({ asChild, className = "", children, variant = "default", size = "md", ...props }: ButtonProps) => {
  const buttonClass = buttonVariants({ variant, size });
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      className: cn(buttonClass, className),
      ...props,
    });
  }
  return (
    <button className={cn(buttonClass, className)} {...props}>
      {children}
    </button>
  );
};

export default Button;
