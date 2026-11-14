import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/queue/PageHeader";
import { ShareQueueCard } from "@/components/queue/ShareQueueCard";
import { PageSkeleton } from "@/components/queue/Skeletons";
import type { Business } from "@/lib/queue-logic";
import { queue, useQueueState } from "@/lib/queue-store";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings · QueueFlow Dashboard" },
      { name: "description", content: "Business profile, queue availability and check-in link settings." },
      { property: "og:title", content: "Settings · QueueFlow Dashboard" },
      { property: "og:description", content: "Configure your business profile and queue." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const state = useQueueState();
  if (!state) return <PageSkeleton />;
  const b = state.business;
  return <Settings key={`${b.name}|${b.tagline}|${b.address}|${b.counterName}`} business={b} />;
}

function Settings({ business }: { business: Business }) {
  const [form, setForm] = useState(business);
  const [saving, setSaving] = useState(false);

  const dirty = (["name", "tagline", "address", "counterName"] as const).some((k) => form[k] !== business[k]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) { toast.error("Business name is required"); return; }
    setSaving(true);
    setTimeout(() => {
      queue.updateBusiness({ name: form.name.trim(), tagline: form.tagline.trim(), address: form.address.trim(), counterName: form.counterName.trim() || "Counter 1" });
      setSaving(false);
      toast.success("Settings saved");
    }, 450);
  };

  const field = (key: "name" | "tagline" | "address" | "counterName", label: string, placeholder: string) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input id={key} value={form[key]} placeholder={placeholder} maxLength={80} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="h-10 rounded-xl" />
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader title="Settings" description="How your business appears to customers joining the queue." />

      <form onSubmit={save} className="surface-card space-y-5 rounded-2xl p-6">
        <p className="font-medium">Business profile</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("name", "Business name", "NovaCare Clinic")}
          {field("tagline", "Tagline", "Family medicine & diagnostics")}
          {field("address", "Address", "Street, city")}
          {field("counterName", "Counter / room name", "Room 1")}
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="hero" disabled={!dirty || saving}>
            {saving && <Loader2 className="animate-spin" />}
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <div className="surface-card flex items-center justify-between gap-4 rounded-2xl p-6">
        <div>
          <p className="font-medium">Accept new customers</p>
          <p className="mt-1 text-sm text-muted-foreground">Pause to stop new check-ins. People already in line keep their place.</p>
        </div>
        <Switch
          checked={business.isOpen}
          aria-label="Accept new customers"
          onCheckedChange={(v) => {
            queue.setOpen(v);
            toast(v ? "Queue reopened" : "Queue paused");
          }}
        />
      </div>

      <ShareQueueCard slug={business.slug} />

      <div className="rounded-2xl border border-destructive/25 p-6">
        <p className="font-medium">Demo data</p>
        <p className="mt-1 text-sm text-muted-foreground">Restore the NovaCare Clinic sample morning, or start the day with an empty queue.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Confirm
            title="Reset demo data?"
            description="This restores the original NovaCare Clinic services, customers and settings."
            confirm="Reset demo"
            onConfirm={() => {
              queue.resetDemo();
              toast.success("Demo data restored");
            }}
          >
            <Button variant="soft">
              <RotateCcw /> Reset demo
            </Button>
          </Confirm>
          <Confirm
            title="Clear today's queue?"
            description="All tickets are removed and token numbers restart at A-001. Services are kept."
            confirm="Clear queue"
            onConfirm={() => {
              queue.clearToday();
              toast.success("Queue cleared");
            }}
          >
            <Button variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 /> Clear queue
            </Button>
          </Confirm>
        </div>
      </div>
    </div>
  );
}

function Confirm({ title, description, confirm, onConfirm, children }: { title: string; description: string; confirm: string; onConfirm: () => void; children: React.ReactNode }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl border-border-strong bg-popover">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
          <AlertDialogAction className="rounded-lg" onClick={onConfirm}>
            {confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
