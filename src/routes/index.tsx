import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  Clock,
  LayoutList,
  PauseCircle,
  QrCode,
  Smartphone,
  Stethoscope,
  Ticket,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QueueFlow — Waiting lines belong in the past" },
      {
        name: "description",
        content: "QueueFlow is a smart digital queue for clinics and service businesses. Customers join from their phone and track their place live.",
      },
      { property: "og:title", content: "QueueFlow — Waiting lines belong in the past" },
      { property: "og:description", content: "Digital queues customers join from their phone, with a live dashboard for your team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: LayoutList, title: "Live queue board", text: "Every customer, their service and expected wait — updating the second something changes." },
  { icon: Smartphone, title: "No app, just a link", text: "Customers scan a QR code at your door and join from any phone browser." },
  { icon: Clock, title: "Honest wait times", text: "Estimates are built from the real duration of every service ahead in line." },
  { icon: Stethoscope, title: "Multiple services", text: "Consultations, lab tests, follow-ups — each with its own estimated duration." },
  { icon: PauseCircle, title: "Pause in one tap", text: "Running behind or closing up? Stop new check-ins without losing anyone in line." },
  { icon: BarChart3, title: "Analytics that matter", text: "Volume by hour, average wait and service mix, so you can staff the busy hours." },
];

const STEPS = [
  { icon: QrCode, title: "Customer scans & joins", text: "They pick a service, enter a name and phone number, and get a digital token instantly." },
  { icon: Ticket, title: "They track it live", text: "Their ticket shows position, people ahead and estimated wait — no hovering at the desk." },
  { icon: BellRing, title: "You call next", text: "One click moves the line forward. Their phone lights up the moment it's their turn." },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#preview" className="transition-colors hover:text-foreground">Product</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <Link to="/q/$slug" params={{ slug: "novacare" }} className="transition-colors hover:text-foreground">
              Customer demo
            </Link>
          </nav>
          <Button variant="hero" size="sm" asChild>
            <Link to="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 bg-hero" />
        <div className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-700">
            <span className="size-1.5 rounded-full bg-success" /> Smart queues for clinics & service businesses
          </span>
          <h1 className="mx-auto mt-7 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.035em] text-balance sm:text-7xl animate-in fade-in slide-in-from-bottom-3 duration-700">
            Waiting lines belong in the <span className="font-display font-normal italic tracking-normal text-primary">past.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-balance animate-in fade-in slide-in-from-bottom-4 duration-700">
            QueueFlow lets customers join your queue from their phone and watch their place move in real time — while your team runs the line from one calm dashboard.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Button variant="hero" size="xl" asChild>
              <Link to="/dashboard">
                Create your queue <ArrowRight />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link to="/q/$slug" params={{ slug: "novacare" }}>
                <Smartphone /> Join the demo queue
              </Link>
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">No app to install · Works on any phone · Set up in minutes</p>
        </div>

        <div id="preview" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 pb-24">
          <p className="mb-5 text-center text-sm text-muted-foreground">
            Try it — press <span className="font-medium text-foreground">Call Next</span> and watch the customer's phone.
          </p>
          <ProductPreview />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Features</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Everything a front desk needs. Nothing it doesn't.</h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="group bg-background p-7 transition-colors hover:bg-card">
                <div className="grid size-10 place-items-center rounded-xl border border-border-strong bg-card text-primary transition-transform duration-300 group-hover:-translate-y-0.5">
                  <f.icon className="size-[18px]" />
                </div>
                <p className="mt-5 font-medium">{f.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="text-center">
            <p className="text-sm font-medium text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">From front door to front desk in three steps</h2>
          </div>
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="surface-card relative rounded-3xl p-7">
                <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                <div className="mt-5 grid size-11 place-items-center rounded-2xl bg-primary/12 text-primary">
                  <s.icon className="size-5" />
                </div>
                <p className="mt-5 text-lg font-medium">{s.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/25 bg-card px-6 py-16 text-center shadow-glow sm:px-16">
            <div className="pointer-events-none absolute inset-0 bg-hero" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
                Give your customers their time back.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                Explore the NovaCare Clinic demo — the dashboard and customer view stay in sync across tabs.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/dashboard">
                    Create your queue <ArrowRight />
                  </Link>
                </Button>
                <Button variant="soft" size="xl" asChild>
                  <Link to="/q/$slug" params={{ slug: "novacare" }}>See the customer view</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <p>© {2026} QueueFlow. Built for businesses that respect their customers' time.</p>
        </div>
      </footer>
    </div>
  );
}
