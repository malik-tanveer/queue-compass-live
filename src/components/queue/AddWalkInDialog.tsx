import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatToken, type Service } from "@/lib/queue-logic";
import { queue } from "@/lib/queue-store";
import { cn } from "@/lib/utils";

export function AddWalkInDialog({ services }: { services: Service[] }) {
  const active = services.filter((s) => s.active);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState(active[0]?.id ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("Enter the customer's name");
    if (!serviceId) return toast.error("Pick a service");
    const t = queue.addWalkIn({ name, phone, serviceId });
    toast.success(`${formatToken(t.token)} added to the queue`, { description: name.trim() });
    setName("");
    setPhone("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="soft" disabled={active.length === 0}>
          <UserPlus /> Add walk-in
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl border-border-strong bg-popover sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a walk-in customer</DialogTitle>
          <DialogDescription>They'll get the next token and join the end of the line.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wi-name">Name</Label>
            <Input id="wi-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" maxLength={50} autoFocus className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wi-phone">Phone (optional)</Label>
            <Input id="wi-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 415 555 0100" maxLength={20} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Service</Label>
            <div className="grid gap-2">
              {active.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setServiceId(s.id)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                    serviceId === s.id ? "border-primary/50 bg-primary/10" : "border-border hover:border-border-strong",
                  )}
                >
                  <span>{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.duration} min</span>
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" variant="hero" className="w-full" size="lg">
            Issue token
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
