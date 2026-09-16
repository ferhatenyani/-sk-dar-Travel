import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "error" | "warning";

const tones: Record<Tone, string> = {
  info: "bg-navy-soft text-navy border-navy-border",
  success: "bg-success-soft text-success border-success-border",
  error: "bg-danger-soft text-danger border-danger-border",
  warning: "bg-warning-soft text-warning border-warning-border",
};

/** Bandeau de retour (succès / erreur) pour les formulaires et actions. */
export function Alert({
  tone = "info",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3.5 py-2.5 text-sm",
        tones[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
