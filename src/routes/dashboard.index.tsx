import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Timer,
  Users,
  UserCheck,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddWalkInDialog } from "@/components/queue/AddWalkInDialog";
import { EmptyState, PageHeader, StatCard } from "@/components/queue/PageHeader";
import { ShareQueueCard } from "@/components/queue/ShareQueueCard";
import { PageSkeleton } from "@/components/queue/Skeletons";
import { LiveDot, StatusBadge, formatMinutes } from "@/components/queue/status";
import {
  estimateWait,
  formatToken,
  getService,
  servingTicket,
  todayStats,
  waitingTickets,
  type QueueState,
  type Ticket,
  type TicketStatus,
} from "@/lib/queue-logic";
import { queue, useNow, useQueueState } from "@/lib/queue-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Live Queue · QueueFlow Dashboard" },
      { name: "description", content: "Manage your live queue, call the next customer and track wait times in real time." },
      { property: "og:title", content: "Live Queue · QueueFlow Dashboard" },
      { property: "og:description", content: "Call next, complete or skip customers and watch your queue update live." },
    ],
  }),
  component: LiveQueuePage,
});

type Filter = "active" | TicketStatus | "all";

function LiveQueuePage() {
  const state = useQueueState();
  const now = useNow(5_000);
  if (!state) return <PageSkeleton />;
  return <LiveQueue state={state} now={now} />;
}

function LiveQueue({ state, now }: { state: QueueState; now: number }) {
  const [calling, setCalling] = useState(false);
  const [filter, setFilter] = useState<Filter>("active");
  const serving = servingTicket(state);
  const waiting = waitingTickets(state);
  const stats = todayStats(state, now);
  const canCall = waiting.length > 0 || !!serving;

  const handleCallNext = useCallback(() => {
    if (calling || !canCall) return;
    setCalling(true);
    window.setTimeout(() => {
      const next = queue.callNext();
      setCalling(false);
      if (next) {
        toast.success(`Now serving ${formatToken(next.token)}`, { description: `${next.name} · ${getService(state, next.serviceId)?.name ?? ""}` });
      } else {
        toast("Queue is clear", { description: "Everyone has been served. Nice work." });
      }
    }, 380);
  }, [calling, canCall, state]);

  // Keyboard shortcut: N calls next
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable) return;
      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey) handleCallNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleCallNext]);

  const toggleOpen = () => {
    queue.setOpen(!state.business.isOpen);
    toast(state.business.isOpen ? "Queue paused" : "Queue reopened", {
      description: state.business.isOpen ? "New customers can't join until you reopen." : "Customers can join again.",
    });
  };

  const list = useMemo(() => {
    const order: Record<TicketStatus, number> = { serving: 0, waiting: 1, skipped: 2, completed: 3 };
    let items = [...state.tickets];
    if (filter === "active") items = items.filter((t) => t.status === "waiting" || t.status === "serving");
    else if (filter !== "all") items = items.filter((t) => t.status === filter);
    return items.sort((a, b) =>
      order[a.status] - order[b.status] ||
      (a.status === "waiting" ? a.joinedAt - b.joinedAt : (b.finishedAt ?? b.joinedAt) - (a.finishedAt ?? a.joinedAt)),
    );
  }, [state.tickets, filter]);

  const counts = {
    active: waiting.length + (serving ? 1 : 0),
    waiting: waiting.length,
    completed: state.tickets.filter((t) => t.status === "completed").length,
    skipped: state.tickets.filter((t) => t.status === "skipped").length,
    all: state.tickets.length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        title="Live Queue"
        description={`${state.business.name} · ${new Date(now).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}`}
        actions={
          <>
            <Button variant={state.business.isOpen ? "soft" : "warning"} onClick={toggleOpen}>
              {state.business.isOpen ? <Pause /> : <Play />}
              {state.business.isOpen ? "Pause queue" : "Reopen queue"}
            </Button>
            <AddWalkInDialog services={state.services} />
          </>
        }
      />

      {!state.business.isOpen && (
        <div className="flex items-center gap-3 rounded-2xl border border-warning/25 bg-warning/8 px-4 py-3 text-sm text-warning animate-in fade-in slide-in-from-top-1">
          <Pause className="size-4 shrink-0" />
          The queue is paused. Customers already in line are kept, but nobody new can join.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Now serving */}
        <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-6 shadow-glow sm:p-7">
          <div className="pointer-events-none absolute inset-0 bg-hero opacity-70" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary">
                <LiveDot tone="primary" /> Now serving · {state.business.counterName}
              </span>
              {serving && <ServingTimer ticket={serving} state={state} />}
            </div>

            {serving ? (
              <div key={serving.id} className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between animate-token-in">
                <div>
                  <p className="font-mono text-6xl font-semibold tracking-tight sm:text-7xl tabular">{formatToken(serving.token)}</p>
                  <p className="mt-3 text-lg font-medium">{serving.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {getService(state, serving.serviceId)?.name ?? "Service"} · {serving.phone || "Walk-in"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="success" onClick={() => { queue.complete(serving.id); toast.success(`${formatToken(serving.token)} completed`); }}>
                    <CheckCircle2 /> Complete
                  </Button>
                  <Button variant="warning" onClick={() => { queue.skip(serving.id); toast(`${formatToken(serving.token)} skipped`); }}>
                    <SkipForward /> Skip
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <p className="font-mono text-6xl font-semibold tracking-tight text-muted-foreground/40 sm:text-7xl">— — —</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {waiting.length ? "Counter is free. Call the next customer when you're ready." : "No one is at the counter."}
                </p>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {waiting[0] ? (
                  <>
                    Up next: <span className="font-mono text-foreground">{formatToken(waiting[0].token)}</span> · {waiting[0].name}
                  </>
                ) : (
                  "Nobody waiting"
                )}
              </div>
              <Button variant="hero" size="xl" onClick={handleCallNext} disabled={!canCall || calling} className="w-full sm:w-auto">
                {calling ? <Loader2 className="animate-spin" /> : <ChevronRight />}
                {calling ? "Calling…" : serving && !waiting.length ? "Finish & clear" : "Call Next"}
                <kbd className="ml-1 hidden rounded-md border border-primary-foreground/25 px-1.5 font-mono text-[0.7rem] sm:inline">N</kbd>
              </Button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Today" value={stats.total} hint="customers checked in" icon={<Users />} />
          <StatCard label="Completed" value={stats.completed} hint={`${stats.skipped} skipped`} icon={<UserCheck />} />
          <StatCard label="Waiting" value={waiting.length} hint={waiting.length ? `~${formatMinutes(estimateWait(state, waiting.at(-1)!.id, now))} for last` : "line is empty"} icon={<Clock />} />
          <StatCard label="Avg wait" value={<>{stats.avgWait}<span className="ml-1 text-base font-normal text-muted-foreground">min</span></>} hint={`avg service ${stats.avgService} min`} icon={<Timer />} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-medium">Queue</h2>
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 text-sm">
              {(["active", "completed", "skipped", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 capitalize transition-colors",
                    filter === f ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f === "active" ? "In line" : f}
                  <span className="ml-1.5 text-xs text-muted-foreground tabular">{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>

          {list.length === 0 ? (
            <EmptyState
              icon={<Inbox />}
              title={filter === "active" ? "The line is empty" : `No ${filter} customers yet`}
              description={filter === "active" ? "Share your queue link or add a walk-in. New customers appear here instantly." : "They'll show up here as you work through the queue."}
              action={filter === "active" ? <AddWalkInDialog services={state.services} /> : undefined}
            />
          ) : (
            <ul className="space-y-2">
              {list.map((t) => (
                <TicketRow key={t.id} ticket={t} state={state} now={now} />
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <ShareQueueCard slug={state.business.slug} compact />
          <div className="surface-card rounded-2xl p-5 text-sm">
            <p className="font-medium">Service mix in line</p>
            <div className="mt-3 space-y-2.5">
              {state.services.filter((s) => s.active).map((s) => {
                const n = waiting.filter((t) => t.serviceId === s.id).length;
                const pct = waiting.length ? (n / waiting.length) * 100 : 0;
                return (
                  <div key={s.id}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="tabular">{n}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ServingTimer({ ticket, state }: { ticket: Ticket; state: QueueState }) {
  const now = useNow(1000);
  const elapsed = Math.max(0, Math.floor((now - (ticket.calledAt ?? now)) / 1000));
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const over = elapsed / 60 > (getService(state, ticket.serviceId)?.duration ?? 10);
  return (
    <span className={cn("font-mono text-sm tabular", over ? "text-warning" : "text-muted-foreground")}>
      {mm}:{ss}
    </span>
  );
}

function TicketRow({ ticket, state, now }: { ticket: Ticket; state: QueueState; now: number }) {
  const service = getService(state, ticket.serviceId);
  const eta = ticket.status === "waiting" ? estimateWait(state, ticket.id, now) : 0;
  const pos = ticket.status === "waiting" ? waitingTickets(state).findIndex((t) => t.id === ticket.id) + 1 : 0;
  const time = (ts?: number) => (ts ? new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");

  return (
    <li
      className={cn(
        "group flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border bg-card px-4 py-3.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-1 hover:border-border-strong sm:flex-nowrap",
        ticket.status === "serving" ? "border-primary/30 bg-primary/5" : "border-border",
        (ticket.status === "completed" || ticket.status === "skipped") && "opacity-75",
      )}
    >
      <div className={cn("grid h-12 w-16 shrink-0 place-items-center rounded-xl font-mono text-sm font-semibold tabular", ticket.status === "serving" ? "bg-primary text-primary-foreground" : "bg-secondary")}>
        {formatToken(ticket.token)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{ticket.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {service?.name ?? "Removed service"} · {service?.duration ?? "—"} min
          {pos > 0 && <> · #{pos} in line</>}
        </p>
      </div>
      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
        <StatusBadge status={ticket.status} />
        <div className="w-24 text-right text-xs">
          {ticket.status === "waiting" && (
            <>
              <p className="font-medium text-foreground tabular">~{formatMinutes(eta)}</p>
              <p className="text-muted-foreground">est. wait</p>
            </>
          )}
          {ticket.status === "serving" && <p className="text-primary">At counter</p>}
          {ticket.status === "completed" && <p className="text-muted-foreground">Done {time(ticket.finishedAt)}</p>}
          {ticket.status === "skipped" && <p className="text-muted-foreground">{ticket.left ? "Left" : "Skipped"} {time(ticket.finishedAt)}</p>}
        </div>
        <div className="flex w-[76px] justify-end gap-1">
          {ticket.status === "serving" && (
            <IconAction label="Complete" onClick={() => { queue.complete(ticket.id); toast.success(`${formatToken(ticket.token)} completed`); }}>
              <CheckCircle2 className="text-success" />
            </IconAction>
          )}
          {(ticket.status === "waiting" || ticket.status === "serving") && (
            <IconAction label="Skip" onClick={() => { queue.skip(ticket.id); toast(`${formatToken(ticket.token)} skipped`, { action: { label: "Undo", onClick: () => queue.restore(ticket.id) } }); }}>
              <SkipForward className="text-warning" />
            </IconAction>
          )}
          {ticket.status === "skipped" && (
            <IconAction label="Return to line" onClick={() => { queue.restore(ticket.id); toast.success(`${formatToken(ticket.token)} is back in line`); }}>
              <RotateCcw />
            </IconAction>
          )}
        </div>
      </div>
    </li>
  );
}

function IconAction({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button size="icon" variant="ghost" onClick={onClick} aria-label={label} title={label} className="size-8 rounded-lg">
      {children}
    </Button>
  );
}
