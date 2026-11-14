import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/lib/queue-logic";

const STYLES: Record<TicketStatus, { label: string; cls: string; dot: string }> = {
  waiting: { label: "Waiting", cls: "bg-secondary text-muted-foreground border-border-strong", dot: "bg-muted-foreground" },
  serving: { label: "Serving", cls: "bg-primary/12 text-primary border-primary/30", dot: "bg-primary" },
  completed: { label: "Completed", cls: "bg-success/10 text-success border-success/25", dot: "bg-success" },
  skipped: { label: "Skipped", cls: "bg-warning/10 text-warning border-warning/25", dot: "bg-warning" },
};

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        s.cls,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot, status === "serving" && "animate-pulse")} />
      {s.label}
    </span>
  );
}

export function LiveDot({ className, tone = "success" }: { className?: string; tone?: "success" | "primary" | "warning" }) {
  const color = tone === "success" ? "bg-success text-success" : tone === "primary" ? "bg-primary text-primary" : "bg-warning text-warning";
  return <span className={cn("inline-block size-2 rounded-full animate-pulse-ring", color, className)} />;
}

export function OpenPill({ isOpen, className }: { isOpen: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        isOpen ? "border-success/25 bg-success/10 text-success" : "border-warning/25 bg-warning/10 text-warning",
        className,
      )}
    >
      <LiveDot tone={isOpen ? "success" : "warning"} />
      {isOpen ? "Queue open" : "Queue paused"}
    </span>
  );
}

export function formatMinutes(min: number) {
  if (min <= 0) return "Now";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
