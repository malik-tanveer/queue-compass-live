import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Clock, Loader2, MapPin, PauseCircle, Ticket as TicketIcon, Users } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BusinessAvatar, PublicShell } from "@/components/queue/PublicShell";
import { Shimmer } from "@/components/queue/Skeletons";
import { OpenPill, formatMinutes } from "@/components/queue/status";
import { estimateWaitForNew, formatToken, servingTicket, waitingTickets, type Ticket } from "@/lib/queue-logic";
import { JUST_JOINED_KEY, getMyTickets, queue, useNow, useQueueState } from "@/lib/queue-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/q/$slug")({
  head: () => ({
    meta: [
      { title: "Join the queue · NovaCare Clinic" },
      { name: "description", content: "Skip the waiting room. Pick a service, get a digital token and track your place live." },
      { property: "og:title", content: "Join the queue · NovaCare Clinic" },
      { property: "og:description", content: "Get a digital token and track your place in line from your phone." },
    ],
  }),
  component: PublicQueuePage,
});

const joinSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(50, "Name is too long"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number"),
  serviceId: z.string().min(1, "Choose a service"),
});

function PublicQueuePage() {
  const { slug } = Route.useParams();
  const state = useQueueState();
  const now = useNow(10_000);
  const navigate = useNavigate();
  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [myTicket, setMyTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!state) return;
    const ids = getMyTickets();
    const active = state.tickets.find((t) => ids.includes(t.id) && (t.status === "waiting" || t.status === "serving"));
    setMyTicket(active ?? null);
  }, [state]);

  const activeServices = useMemo(() => state?.services.filter((s) => s.active) ?? [], [state]);
  useEffect(() => {
    if (!serviceId && activeServices[0]) setServiceId(activeServices[0].id);
  }, [activeServices, serviceId]);

  if (!state) {
    return (
      <PublicShell>
        <div className="space-y-4" aria-busy="true">
          <Shimmer className="h-28" />
          <Shimmer className="h-20" />
          <Shimmer className="h-64" />
        </div>
      </PublicShell>
    );
  }

  if (slug !== state.business.slug) {
    return (
      <PublicShell>
        <div className="mt-24 text-center">
          <p className="text-lg font-medium">This queue doesn't exist</p>
          <p className="mt-2 text-sm text-muted-foreground">Check the link or scan the QR code at the front desk again.</p>
          <Button variant="soft" className="mt-6" asChild>
            <Link to="/q/$slug" params={{ slug: state.business.slug }}>
              Go to {state.business.name}
            </Link>
          </Button>
        </div>
      </PublicShell>
    );
  }

  const { business } = state;
  const serving = servingTicket(state);
  const waiting = waitingTickets(state);
  const eta = estimateWaitForNew(state, now);
  const selected = activeServices.find((s) => s.id === serviceId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = joinSchema.safeParse({ name, phone, serviceId });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    window.setTimeout(() => {
      const t = queue.join(parsed.data);
      window.sessionStorage.setItem(JUST_JOINED_KEY, t.id);
      navigate({ to: "/t/$ticketId", params: { ticketId: t.id } });
    }, 750);
  };

  return (
    <PublicShell>
      <header className="animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="flex items-center gap-4">
          <BusinessAvatar name={business.name} />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">{business.name}</h1>
            <p className="truncate text-sm text-muted-foreground">{business.tagline}</p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="size-3" /> {business.address}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x divide-border rounded-2xl glass">
          <QuickStat label="Serving" value={serving ? formatToken(serving.token) : "—"} mono />
          <QuickStat label="Waiting" value={String(waiting.length)} icon={<Users className="size-3" />} />
          <QuickStat label="Est. wait" value={business.isOpen ? `~${formatMinutes(eta)}` : "—"} icon={<Clock className="size-3" />} />
        </div>
        <div className="mt-3 flex justify-center">
          <OpenPill isOpen={business.isOpen} />
        </div>
      </header>

      {myTicket && (
        <Link
          to="/t/$ticketId"
          params={{ ticketId: myTicket.id }}
          className="mt-5 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm transition-colors hover:bg-primary/15 animate-in fade-in"
        >
          <span className="flex items-center gap-2">
            <TicketIcon className="size-4 text-primary" />
            You're in line as <span className="font-mono font-semibold">{formatToken(myTicket.token)}</span>
          </span>
          <span className="flex items-center gap-1 text-primary">
            View <ArrowRight className="size-3.5" />
          </span>
        </Link>
      )}

      {!business.isOpen ? (
        <div className="mt-6 rounded-3xl border border-warning/25 bg-warning/8 p-6 text-center animate-in fade-in">
          <PauseCircle className="mx-auto size-9 text-warning" />
          <p className="mt-3 font-medium">The queue is paused right now</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {business.name} isn't taking new check-ins at the moment. This page updates automatically when they reopen.
          </p>
        </div>
      ) : activeServices.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-border-strong p-6 text-center">
          <p className="font-medium">No services available</p>
          <p className="mt-1 text-sm text-muted-foreground">Please check with the front desk.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500" noValidate>
          <fieldset>
            <legend className="mb-3 text-sm font-medium">
              <span className="mr-2 text-muted-foreground">01</span>Choose a service
            </legend>
            <div className="space-y-2" role="radiogroup">
              {activeServices.map((s) => {
                const active = s.id === serviceId;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    key={s.id}
                    onClick={() => setServiceId(s.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
                      active ? "border-primary/50 bg-primary/10 shadow-glow" : "border-border bg-card hover:border-border-strong",
                    )}
                  >
                    <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border transition-colors", active ? "border-primary bg-primary text-primary-foreground" : "border-border-strong")}>
                      {active && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{s.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{s.description}</span>
                    </span>
                    <span className="shrink-0 rounded-lg bg-secondary px-2 py-1 text-xs tabular text-muted-foreground">{s.duration} min</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-medium">
              <span className="mr-2 text-muted-foreground">02</span>Your details
            </legend>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Cooper" maxLength={50} aria-invalid={!!errors["name"]} className="h-12 rounded-xl bg-card text-base" />
              {errors["name"] && <p className="text-xs text-destructive">{errors["name"]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 415 555 0100" maxLength={20} aria-invalid={!!errors["phone"]} className="h-12 rounded-xl bg-card text-base" />
              {errors["phone"] ? <p className="text-xs text-destructive">{errors["phone"]}</p> : <p className="text-xs text-muted-foreground">Only used to reach you if you step away.</p>}
            </div>
          </fieldset>

          <div className="sticky bottom-4 space-y-2">
            <Button type="submit" variant="hero" size="xl" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <TicketIcon />}
              {submitting ? "Issuing your token…" : "Get my token"}
            </Button>
            {selected && (
              <p className="text-center text-xs text-muted-foreground">
                {selected.name} · you'd be #{waiting.length + 1} in line · ~{formatMinutes(eta)}
              </p>
            )}
          </div>
        </form>
      )}
    </PublicShell>
  );
}

function QuickStat({ label, value, icon, mono }: { label: string; value: string; icon?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="px-3 py-3 text-center">
      <p className="flex items-center justify-center gap-1 text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className={cn("mt-1 font-semibold tabular", mono && "font-mono")}>{value}</p>
    </div>
  );
}
