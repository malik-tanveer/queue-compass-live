import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Minus, Plus, Stethoscope, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EmptyState, PageHeader } from "@/components/queue/PageHeader";
import { PageSkeleton } from "@/components/queue/Skeletons";
import type { Service } from "@/lib/queue-logic";
import { queue, useQueueState } from "@/lib/queue-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/services")({
  head: () => ({
    meta: [
      { title: "Services · QueueFlow Dashboard" },
      { name: "description", content: "Add services and set estimated durations that power live wait-time estimates." },
      { property: "og:title", content: "Services · QueueFlow Dashboard" },
      { property: "og:description", content: "Manage the services customers can queue for." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const state = useQueueState();
  if (!state) return <PageSkeleton />;
  const waitingCount = (id: string) => state.tickets.filter((t) => t.serviceId === id && (t.status === "waiting" || t.status === "serving")).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader title="Services" description="Durations drive the wait time every customer sees on their ticket." />
      <NewServiceForm />
      {state.services.length === 0 ? (
        <EmptyState icon={<Stethoscope />} title="No services yet" description="Add your first service above so customers can join the queue." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {state.services.map((s) => (
            <ServiceCard key={s.id} service={s} inLine={waitingCount(s.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DurationStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const set = (v: number) => onChange(Math.min(180, Math.max(1, v)));
  return (
    <div className="inline-flex items-center rounded-xl border border-border bg-background/50">
      <button type="button" aria-label="Decrease duration" onClick={() => set(value - 1)} className="grid size-9 place-items-center text-muted-foreground transition-colors hover:text-foreground">
        <Minus className="size-3.5" />
      </button>
      <span className="w-16 text-center font-mono text-sm tabular">{value} min</span>
      <button type="button" aria-label="Increase duration" onClick={() => set(value + 1)} className="grid size-9 place-items-center text-muted-foreground transition-colors hover:text-foreground">
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function NewServiceForm() {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(10);
  const [description, setDescription] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { toast.error("Give the service a name"); return; }
    queue.addService({ name: name.trim(), duration, description: description.trim(), active: true });
    toast.success(`${name.trim()} added`, { description: `${duration} min estimated duration` });
    setName("");
    setDescription("");
    setDuration(10);
  };

  return (
    <form onSubmit={submit} className="surface-card grid gap-4 rounded-2xl p-5 md:grid-cols-[1.2fr_1.5fr_auto_auto] md:items-end">
      <div className="space-y-2">
        <Label htmlFor="svc-name">New service</Label>
        <Input id="svc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Blood Pressure Check" maxLength={50} className="h-10 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="svc-desc">Description</Label>
        <Input id="svc-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Shown to customers when they join" maxLength={100} className="h-10 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Duration</Label>
        <DurationStepper value={duration} onChange={setDuration} />
      </div>
      <Button type="submit" variant="hero" className="h-10">
        <Plus /> Add
      </Button>
    </form>
  );
}

function ServiceCard({ service, inLine }: { service: Service; inLine: number }) {
  return (
    <li className={cn("surface-card flex flex-col gap-4 rounded-2xl p-5 transition-all animate-in fade-in", !service.active && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{service.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{service.description || "No description"}</p>
        </div>
        <Switch
          checked={service.active}
          aria-label={`${service.active ? "Disable" : "Enable"} ${service.name}`}
          onCheckedChange={(v) => {
            queue.updateService(service.id, { active: v });
            toast(v ? `${service.name} is bookable` : `${service.name} hidden from customers`);
          }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <Clock className="size-4 text-muted-foreground" />
          <DurationStepper value={service.duration} onChange={(v) => queue.updateService(service.id, { duration: v })} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular">{inLine} in line</span>
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Delete ${service.name}`}
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={() => {
              if (inLine > 0) { toast.error("Customers are still waiting for this service", { description: "Disable it instead, or clear the line first." }); return; }
              queue.removeService(service.id);
              toast(`${service.name} deleted`);
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </li>
  );
}
