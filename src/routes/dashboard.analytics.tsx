import { createFileRoute } from "@tanstack/react-router";
import { Activity, CheckCircle2, Clock, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, StatCard } from "@/components/queue/PageHeader";
import { PageSkeleton } from "@/components/queue/Skeletons";
import { isSameDay, todayStats } from "@/lib/queue-logic";
import { useNow, useQueueState } from "@/lib/queue-store";

export const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · QueueFlow Dashboard" },
      { name: "description", content: "Customer volume, wait times and service mix for your queue." },
      { property: "og:title", content: "Analytics · QueueFlow Dashboard" },
      { property: "og:description", content: "See how your queue performs today and this week." },
    ],
  }),
  component: AnalyticsPage,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 12, tickLine: false, axisLine: false } as const;
const tooltipStyle = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border-strong)", borderRadius: 12, color: "var(--foreground)", fontSize: 12 },
  cursor: { fill: "color-mix(in oklab, var(--foreground) 5%, transparent)" },
};

function AnalyticsPage() {
  const state = useQueueState();
  const now = useNow(30_000);
  if (!state) return <PageSkeleton />;

  const stats = todayStats(state, now);
  const week = [...state.history, { label: "Today", customers: stats.total, avgWait: stats.avgWait }];
  const today = state.tickets.filter((t) => isSameDay(t.joinedAt, now));

  const hours: { label: string; customers: number }[] = [];
  for (let h = 8; h <= 19; h++) {
    hours.push({
      label: `${h % 12 || 12}${h < 12 ? "a" : "p"}`,
      customers: today.filter((t) => new Date(t.joinedAt).getHours() === h).length,
    });
  }

  const mix = state.services.map((s) => {
    const items = today.filter((t) => t.serviceId === s.id);
    return { ...s, count: items.length, done: items.filter((t) => t.status === "completed").length };
  });
  const maxMix = Math.max(1, ...mix.map((m) => m.count));
  const completion = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader title="Analytics" description="Live numbers from today plus your last six days." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Customers today" value={stats.total} hint={`${week.reduce((s, d) => s + d.customers, 0)} this week`} icon={<Users />} />
        <StatCard label="Completion" value={`${completion}%`} hint={`${stats.completed} completed · ${stats.skipped} skipped`} icon={<CheckCircle2 />} />
        <StatCard label="Avg wait" value={`${stats.avgWait}m`} hint="join → called" icon={<Clock />} />
        <StatCard label="Avg service" value={`${stats.avgService}m`} hint="called → done" icon={<Activity />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Customers this week" subtitle="Daily check-ins">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={week} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" {...axis} />
              <YAxis {...axis} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="customers" name="Customers" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Average wait" subtitle="Minutes from join to being called">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={week} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" {...axis} />
              <YAxis {...axis} allowDecimals={false} />
              <Tooltip {...tooltipStyle} cursor={{ stroke: "var(--border-strong)" }} />
              <Line type="monotone" dataKey="avgWait" name="Avg wait (min)" stroke="var(--success)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--success)" }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <ChartCard title="Today by hour" subtitle="When customers checked in">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hours} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" {...axis} />
              <YAxis {...axis} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="customers" name="Check-ins" fill="var(--chart-4)" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Service mix" subtitle="Today's customers per service">
          <div className="space-y-4 pt-2">
            {mix.map((m) => (
              <div key={m.id}>
                <div className="flex items-baseline justify-between text-sm">
                  <span>{m.name}</span>
                  <span className="text-xs text-muted-foreground tabular">
                    {m.done}/{m.count} done
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(m.count / maxMix) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="surface-card rounded-2xl p-5">
      <p className="font-medium">{title}</p>
      <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>
      {children}
    </section>
  );
}
