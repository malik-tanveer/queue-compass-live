import { useState } from "react";
import { BellRing, ChevronRight, RotateCcw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveDot, StatusBadge, formatMinutes } from "@/components/queue/status";
import {
  callNext,
  createDemoState,
  estimateWait,
  formatToken,
  getService,
  joinQueue,
  peopleAhead,
  servingTicket,
  waitingTickets,
} from "@/lib/queue-logic";
import { cn } from "@/lib/utils";

// Fixed clock keeps server and client renders identical.
const CLOCK = 1_760_000_000_000;
const YOU_ID = "demo-14";
const WALK_INS = ["Ava Thompson", "Yusuf Ali", "Grace Kim", "Leo Novak", "Isla Brown"];

export function ProductPreview() {
  const [state, setState] = useState(() => createDemoState(CLOCK));
  const [walkIn, setWalkIn] = useState(0);
  const [pulse, setPulse] = useState(0);
  const serving = servingTicket(state);
  const waiting = waitingTickets(state);
  const you = state.tickets.find((t) => t.id === YOU_ID)!;
  const ahead = peopleAhead(state, YOU_ID);
  const eta = estimateWait(state, YOU_ID, CLOCK);

  const next = () => {
    setState((s) => callNext(s, CLOCK));
    setPulse((p) => p + 1);
  };
  const add = () => {
    const services = ["general", "lab", "followup"];
    setState((s) => joinQueue(s, { name: WALK_INS[walkIn % WALK_INS.length] ?? "Guest", phone: "", serviceId: services[walkIn % 3] ?? "general" }, CLOCK + walkIn).state);
    setWalkIn((n) => n + 1);
  };
  const reset = () => {
    setState(createDemoState(CLOCK));
    setWalkIn(0);
  };

  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_280px]">
        {/* Dashboard window */}
        <div className="overflow-hidden rounded-3xl border border-border-strong bg-card shadow-elevated">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="size-2.5 rounded-full bg-muted-foreground/25" />
            <span className="size-2.5 rounded-full bg-muted-foreground/25" />
            <span className="size-2.5 rounded-full bg-muted-foreground/25" />
            <span className="ml-3 text-xs text-muted-foreground">NovaCare Clinic · Live Queue</span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-success">
              <LiveDot /> Live
            </span>
          </div>
          <div className="p-5">
            <div className="flex flex-col gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div key={serving?.id ?? "none"} className="animate-token-in">
                <p className="text-[0.68rem] uppercase tracking-[0.14em] text-primary">Now serving</p>
                <p className="mt-1 font-mono text-4xl font-semibold tabular">{serving ? formatToken(serving.token) : "— — —"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {serving ? `${serving.name} · ${getService(state, serving.serviceId)?.name}` : "Queue is clear"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="soft" size="sm" onClick={add} aria-label="Add a walk-in to the preview">
                  <UserPlus /> Walk-in
                </Button>
                <Button variant="hero" onClick={next} disabled={!serving && !waiting.length}>
                  Call Next <ChevronRight />
                </Button>
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {waiting.slice(0, 4).map((t) => (
                <li
                  key={t.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-1",
                    t.id === YOU_ID ? "border-primary/30 bg-primary/5" : "border-border",
                  )}
                >
                  <span className="grid h-9 w-14 place-items-center rounded-lg bg-secondary font-mono text-xs font-semibold">{formatToken(t.token)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {t.name} {t.id === YOU_ID && <span className="text-xs text-primary">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{getService(state, t.serviceId)?.name}</p>
                  </div>
                  <StatusBadge status="waiting" className="hidden sm:inline-flex" />
                  <span className="w-16 text-right text-xs tabular text-muted-foreground">~{formatMinutes(estimateWait(state, t.id, CLOCK))}</span>
                </li>
              ))}
              {waiting.length > 4 && <li className="px-3 text-xs text-muted-foreground">+{waiting.length - 4} more in line</li>}
              {waiting.length === 0 && (
                <li className="rounded-xl border border-dashed border-border-strong px-3 py-5 text-center text-sm text-muted-foreground">
                  Nobody waiting.{" "}
                  <button onClick={reset} className="inline-flex items-center gap-1 text-primary hover:underline">
                    <RotateCcw className="size-3" /> Replay demo
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Phone */}
        <div className="mx-auto w-[260px] animate-float lg:mt-10">
          <div className="rounded-[2.4rem] border border-border-strong bg-sidebar p-2.5 shadow-elevated">
            <div className="overflow-hidden rounded-[2rem] border border-border bg-background">
              <div className="mx-auto mt-2 h-5 w-20 rounded-full bg-card" />
              <div className="px-5 pb-6 pt-4 text-center">
                <p className="text-xs text-muted-foreground">NovaCare Clinic</p>
                <p key={`${you.status}-${pulse}`} className={cn("mt-3 font-mono text-5xl font-semibold tabular animate-token-in", you.status === "serving" && "text-primary")}>
                  {formatToken(you.token)}
                </p>
                {you.status === "waiting" ? (
                  <>
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs text-success">
                      <LiveDot /> {ahead === 0 ? "You're next" : "Waiting in line"}
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <div key={`a-${ahead}`} className="rounded-xl bg-card py-3 animate-token-in">
                        <p className="text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">Ahead</p>
                        <p className="text-xl font-semibold tabular">{ahead}</p>
                      </div>
                      <div key={`e-${eta}`} className="rounded-xl bg-card py-3 animate-token-in">
                        <p className="text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground">Wait</p>
                        <p className="text-xl font-semibold tabular">~{eta}m</p>
                      </div>
                    </div>
                  </>
                ) : you.status === "serving" ? (
                  <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 animate-in zoom-in-95">
                    <BellRing className="mx-auto size-5 animate-bounce text-primary" />
                    <p className="mt-2 text-sm font-medium">It's your turn</p>
                    <p className="text-xs text-muted-foreground">Proceed to Room 1</p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-card p-4 text-sm">
                    <p className="font-medium">Visit complete</p>
                    <button onClick={reset} className="mt-1 text-xs text-primary hover:underline">
                      Replay demo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">Customer's phone · updates instantly</p>
        </div>
      </div>
    </div>
  );
}
