import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/brand/Logo";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-hero" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10 pt-5">
        {children}
        <Link to="/" className="mt-auto flex items-center justify-center gap-2 pt-10 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <LogoMark className="size-5 rounded-md [&_svg]:size-3" /> Powered by QueueFlow
        </Link>
      </div>
    </div>
  );
}

export function BusinessAvatar({ name, className = "size-14 text-lg" }: { name: string; className?: string }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div className={`grid shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/12 font-semibold text-primary ${className}`}>
      {initials}
    </div>
  );
}
