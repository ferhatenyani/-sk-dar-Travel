import { cn } from "@/lib/cn";

type Variant = "neutral" | "navy" | "gold" | "success" | "danger" | "warning";

const variants: Record<Variant, string> = {
  neutral: "bg-page text-ink-secondary border-line",
  navy: "bg-navy-soft text-navy border-navy-border",
  gold: "bg-gold-soft text-gold-hover border-gold/40",
  success: "bg-success-soft text-success border-success-border",
  danger: "bg-danger-soft text-danger border-danger-border",
  warning: "bg-warning-soft text-warning border-warning-border",
};

export function Badge({
  variant = "neutral",
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
