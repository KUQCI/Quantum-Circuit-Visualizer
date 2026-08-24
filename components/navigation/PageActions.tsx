import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PageAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  disabled?: boolean;
  title?: string;
}

interface PageActionsProps {
  primary?: PageAction[];
  secondary?: PageAction[];
  className?: string;
}

export function PageActions({ primary = [], secondary = [], className }: PageActionsProps) {
  if (primary.length === 0 && secondary.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {primary.map((action) => (
        <ActionButton key={action.label} action={action} priority="primary" />
      ))}
      {secondary.map((action) => (
        <ActionButton key={action.label} action={action} priority="secondary" />
      ))}
    </div>
  );
}

function ActionButton({
  action,
  priority,
}: {
  action: PageAction;
  priority: "primary" | "secondary";
}) {
  const variant =
    action.variant ?? (priority === "primary" ? "default" : "outline");
  const size = priority === "primary" ? "default" : "sm";

  if (action.href && !action.disabled) {
    return (
      <Button asChild variant={variant} size={size} className="gap-1.5">
        <Link href={action.href}>
          {action.icon}
          {action.label}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className="gap-1.5"
      onClick={action.onClick}
      disabled={action.disabled}
      title={action.title}
    >
      {action.icon}
      {action.label}
    </Button>
  );
}
