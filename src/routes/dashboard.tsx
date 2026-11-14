import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BarChart3, ExternalLink, LayoutList, Settings, Stethoscope } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { OpenPill } from "@/components/queue/status";
import { useQueueState } from "@/lib/queue-store";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard", label: "Live Queue", icon: LayoutList, exact: true },
  { to: "/dashboard/services", label: "Services", icon: Stethoscope, exact: false },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { to: "/dashboard/settings", label: "Settings", icon: Settings, exact: false },
] as const;

function DashboardLayout() {
  const state = useQueueState();
  const business = state?.business;
  const initials = (business?.name ?? "NC")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
        <Logo className="px-2" />

        <div className="mt-7 rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/15 font-semibold text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{business?.name ?? "Loading…"}</p>
              <p className="truncate text-xs text-muted-foreground">{business?.tagline ?? "\u00a0"}</p>
            </div>
          </div>
          {business && <OpenPill isOpen={business.isOpen} className="mt-3" />}
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          <p className="px-3 pb-2 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
            Workspace
          </p>
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
            >
              <item.icon className="size-4 text-muted-foreground transition-colors group-data-[status=active]:text-primary" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-2">
          <a
            href={`/q/${business?.slug ?? "novacare"}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl border border-sidebar-border px-3 py-2.5 text-sm text-sidebar-foreground/80 transition-colors hover:border-border-strong hover:text-foreground"
          >
            Open customer view
            <ExternalLink className="size-3.5" />
          </a>
          <p className="px-3 text-xs text-muted-foreground/70">Opens in a new tab and stays in sync live.</p>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo />
        {business && <OpenPill isOpen={business.isOpen} />}
      </header>

      <main className="min-w-0 pb-24 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 gap-1 rounded-2xl p-1.5 glass shadow-elevated lg:hidden">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.exact }}
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-[0.68rem] text-muted-foreground transition-colors data-[status=active]:bg-accent data-[status=active]:text-foreground"
          >
            <item.icon className="size-[18px]" />
            {item.label.replace("Live ", "")}
          </Link>
        ))}
      </nav>
    </div>
  );
}
