import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-gold-duck)] text-[var(--color-ink)] hover:brightness-110 shadow-sm",
        secondary:
          "border border-[rgba(125,211,252,0.4)] bg-[rgba(125,211,252,0.1)] text-[var(--color-cyan-quantum)] hover:bg-[rgba(125,211,252,0.18)]",
        outline:
          "border border-[rgba(125,211,252,0.4)] bg-transparent text-[var(--color-cyan-quantum)] hover:bg-[rgba(125,211,252,0.08)]",
        ghost:
          "hover:bg-[rgba(125,211,252,0.08)] hover:text-[var(--color-cyan-quantum)]",
        destructive:
          "bg-[var(--color-destructive)] text-white hover:brightness-110",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-2xl px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
