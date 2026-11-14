import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BellRing, CheckCircle2, Clock, LogOut, RotateCcw, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { BusinessAvatar, PublicShell } from "@/components/queue/PublicShell";
import { Shimmer } from "@/components/queue/Skeletons";
import { LiveDot, formatMinutes } from "@/components/queue/status";
import {
  estimateWait,
  formatToken,
  getService,
  peopleAhead,
  positionOf,
  servingTicket,
  type QueueState,
  type Ticket,
} from "@/lib/queue-logic";
import { JUST_JOINED_KEY, queue, useNow, useQueueState } from "@/lib/queue-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/t/$ticketId")({
  head: () => ({
    meta: [
      { title: "My token · QueueFlow" },
      { name: "description", content: "Your live digital ticket: position, people ahead and estimated waiting time." },
      { property: "og:title", content: "My token · QueueFlow" },
      { property: "og:description", content: "Track your place in line live." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TicketPage,
});

function TicketPage() {
  const { ticketId } = Route.useParams();
  const state = useQueueState();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(JUST_JOINED_KEY) === ticketId) {
      window.sessionStorage.removeItem(JUST_JOINED_KEY);
      setConfirming(true);
    }
  }, [ticketId]);

  if (!state) {
    return (
      <PublicShell>
        <div className="space-y-4" aria-busy="true">
          <Shimmer className="h-12" />
          <Shimmer className="h-[420px] rounded-3xl" />
        </div>
      </PublicShell>
    );
  }

  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) {
    return (
      <PublicShell>
        <div className="mt-24 text-center">
          <p className="text-lg font-medium">We couldn't find this ticket</p>
          <p className="mt-2 text-sm text-muted-foreground">It may have been cleared at the end of the day.</p>
          <Button variant="hero" className="mt-6" asChild>
            <Link to="/q/$slug" params={{ slug: state.business.slug }}>
              Join {state.business.name}
            </Link>
          </Button>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      {confirming ? (
        <Confirmation state={state} ticket={ticket} onDone={() => setConfirming(false)} />
      ) : (
        <LiveTicket state={state} ticket={ticket} />
      )}
    </PublicShell>
  );
}

function Confirmation({ state, ticket, onDone }: { state: QueueState; ticket: Ticket; onDone: () => void }) {
  const now = useNow(10_000);
  const service = getService(state, ticket.serviceId);
  return (
    <div className="flex flex-1 flex-col items-center justify-center pt-10 text-center">
      <div className="relative">
        <span className="absolute inset-0 animate-ping rounded-full bg-success/20" />
        <div className="relative grid size-20 place-items-center rounded-full border border-success/30 bg-success/15 text-success animate-in zoom-in-50 duration-500">
          <CheckCircle2 className="size-10" />
        </div>
      </div>
      <h1 className="mt-7 text-2xl font-semibold tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500">You're in the queue</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Relax — no need to stand in line. This page updates live and tells you when it's your turn.
      </p>

      <div className="mt-8 w-full rounded-3xl surface-card p-6 animate-token-in">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Your token</p>
        <p className="mt-2 font-mono text-6xl font-semibold tracking-tight">{formatToken(ticket.token)}</p>
        <div className="mt-6 grid grid-cols-3 gap-2 text-sm">
          <Mini label="Position" value={ticket.status === "waiting" ? `#${positionOf(state, ticket.id)}` : "Now"} />
          <Mini label="Ahead" value={String(peopleAhead(state, ticket.id))} />
          <Mini label="Est. wait" value={`~${formatMinutes(estimateWait(state, ticket.id, now))}`} />
        </div>
        <p className="mt-5 text-xs text-muted-foreground">
          {service?.name} at {state.business.name}
        </p>
      </div>

      <Button variant="hero" size="xl" className="mt-6 w-full" onClick={onDone}>
        <Sparkles /> Track my place live
      </Button>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary px-2 py-2.5">
      <p className="text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold tabular">{value}</p>
    </div>
  );
}

function LiveTicket({ state, ticket }: { state: QueueState; ticket: Ticket }) {
  const now = useNow(5_000);
  const service = getService(state, ticket.serviceId);
  const serving = servingTicket(state);
  const ahead = peopleAhead(state, ticket.id);
  const position = positionOf(state, ticket.id);
  const eta = estimateWait(state, ticket.id, now);
  const prev = useRef({ status: ticket.status, ahead });
  const [bump, setBump] = useState(0);

  // React to the business moving the queue
  useEffect(() => {
    const p = prev.current;
    if (p.status !== ticket.status) {
      if (ticket.status === "serving") {
        toast.success("It's your turn!", { description: `Please proceed to ${state.business.counterName}.` });
        navigator.vibrate?.([200, 100, 200]);
      } else if (ticket.status === "completed") {
        toast.success("Visit complete — thank you!");
      } else if (ticket.status === "skipped" && !ticket.left) {
        toast.warning("Your turn was missed");
      }
    } else if (ticket.status === "waiting" && ahead < p.ahead) {
      setBump((b) => b + 1);
      if (ahead === 0) toast("You're next!", { description: "Please make your way to the waiting area." });
    }
    prev.current = { status: ticket.status, ahead };
  }, [ticket.status, ticket.left, ahead, state.business.counterName]);

  useEffect(() => {
    const original = document.title;
    if (ticket.status === "serving") document.title = "🔔 It's your turn · QueueFlow";
    else if (ticket.status === "waiting") document.title = `#${position} in line · ${formatToken(ticket.token)}`;
    return () => {
      document.title = original;
    };
  }, [ticket.status, position, ticket.token]);

  const mood =
    ticket.status === "serving"
      ? { label: "It's your turn", tone: "primary" as const, text: `Please proceed to ${state.business.counterName}` }
      : ticket.status === "completed"
        ? { label: "Visit complete", tone: "success" as const, text: `Thanks for visiting ${state.business.name}` }
        : ticket.status === "skipped"
          ? { label: ticket.left ? "You left the queue" : "Turn missed", tone: "warning" as const, text: ticket.left ? "Your spot was released." : "Please speak to the front desk or rejoin." }
          : ahead === 0
            ? { label: "You're next", tone: "primary" as const, text: "Head to the waiting area — you'll be called shortly" }
            : { label: "Waiting in line", tone: "success" as const, text: `${ahead} ${ahead === 1 ? "person" : "people"} ahead of you` };

  const isTurn = ticket.status === "serving";
  const isDone = ticket.status === "completed" || ticket.status === "skipped";
  const dots = Math.min(ahead, 8);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between">
        <Link to="/q/$slug" params={{ slug: state.business.slug }} className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> {state.business.name}
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-card px-3 py-1 text-xs">
          <LiveDot tone={isDone ? "warning" : "success"} /> {isDone ? "Closed" : "Live"}
        </span>
      </div>

      {/* Ticket */}
      <div
        className={cn(
          "relative mt-6 overflow-hidden rounded-[28px] border bg-card shadow-elevated transition-all duration-500 animate-token-in",
          isTurn ? "border-primary/50 shadow-glow" : "border-border-strong",
        )}
      >
        {isTurn && <div className="pointer-events-none absolute inset-0 bg-hero" />}
        <div className="relative px-6 pb-6 pt-6">
          <div className="flex items-center gap-3">
            <BusinessAvatar name={state.business.name} className="size-10 text-sm rounded-xl" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{state.business.name}</p>
              <p className="truncate text-xs text-muted-foreground">{service?.name ?? "Service"}</p>
            </div>
          </div>

          <div className="mt-7 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Token number</p>
            <p key={ticket.status} className={cn("mt-2 font-mono text-[5.25rem] font-semibold leading-none tracking-tight animate-token-in", isTurn && "text-primary")}>
              {formatToken(ticket.token)}
            </p>
            <div className={cn("mt-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium",
              mood.tone === "primary" && "border-primary/30 bg-primary/12 text-primary",
              mood.tone === "success" && "border-success/25 bg-success/10 text-success",
              mood.tone === "warning" && "border-warning/25 bg-warning/10 text-warning",
            )}>
              {isTurn ? <BellRing className="size-4 animate-bounce" /> : <LiveDot tone={mood.tone} />}
              {mood.label}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{mood.text}</p>
          </div>
        </div>

        {/* perforation */}
        <div className="relative flex items-center">
          <span className="absolute -left-3 size-6 rounded-full border border-border-strong bg-background" />
          <span className="mx-5 w-full border-t-2 border-dashed border-border-strong" />
          <span className="absolute -right-3 size-6 rounded-full border border-border-strong bg-background" />
        </div>

        <div className="relative grid grid-cols-3 px-3 py-5 text-center">
          <Stat label="Position" value={ticket.status === "waiting" ? `#${position}` : isTurn ? "Now" : "—"} bump={bump} />
          <Stat label="Ahead" value={ticket.status === "waiting" ? String(ahead) : "0"} icon={<Users className="size-3" />} bump={bump} />
          <Stat label="Est. wait" value={ticket.status === "waiting" ? `~${formatMinutes(eta)}` : isTurn ? "Now" : "—"} icon={<Clock className="size-3" />} bump={bump} />
        </div>

        {ticket.status === "waiting" && (
          <div className="relative border-t border-border px-6 py-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Now serving</span>
              <span className="font-mono text-foreground">{serving ? formatToken(serving.token) : "—"}</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5" aria-label={`${ahead} people ahead`}>
              <span className="size-3 rounded-full bg-primary" title="At the counter" />
              {Array.from({ length: dots }).map((_, i) => (
                <span key={i} className="size-3 rounded-full bg-muted-foreground/30 transition-all duration-500" />
              ))}
              {ahead > 8 && <span className="text-xs text-muted-foreground">+{ahead - 8}</span>}
              <span className="ml-1 rounded-full bg-foreground px-2 py-0.5 text-[0.65rem] font-semibold text-background">You</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-2">
        {ticket.status === "waiting" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full text-muted-foreground">
                <LogOut /> Leave queue
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-border-strong bg-popover">
              <AlertDialogHeader>
                <AlertDialogTitle>Leave the queue?</AlertDialogTitle>
                <AlertDialogDescription>Your spot {formatToken(ticket.token)} will be released. You can rejoin later, but you'll go to the back of the line.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-lg">Stay in line</AlertDialogCancel>
                <AlertDialogAction className="rounded-lg" onClick={() => { queue.skip(ticket.id, true); toast("You left the queue"); }}>
                  Leave queue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {isDone && (
          <Button variant="soft" size="lg" className="w-full" asChild>
            <Link to="/q/$slug" params={{ slug: state.business.slug }}>
              <RotateCcw /> Join again
            </Link>
          </Button>
        )}
        <p className="text-center text-xs text-muted-foreground">
          Joined at {new Date(ticket.joinedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · Updates automatically
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, bump }: { label: string; value: string; icon?: React.ReactNode; bump: number }) {
  return (
    <div>
      <p className="flex items-center justify-center gap-1 text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p key={`${value}-${bump}`} className="mt-1.5 text-2xl font-semibold tabular animate-token-in">
        {value}
      </p>
    </div>
  );
}
