import { useState } from "react";
import { Check, Copy, ExternalLink, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function useQueueUrl(slug: string) {
  return typeof window === "undefined" ? `/q/${slug}` : `${window.location.origin}/q/${slug}`;
}

export function ShareQueueCard({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const url = useQueueUrl(slug);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Queue link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — select the link manually");
    }
  };

  return (
    <div className="surface-card rounded-2xl p-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <QrCode className="size-4 text-primary" /> Customer check-in
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Print the code at your entrance or share the link.</p>
      <div className={compact ? "mt-4 flex items-center gap-4" : "mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start"}>
        <div className="shrink-0 rounded-xl bg-foreground p-2.5">
          <QRCodeSVG value={url} size={compact ? 84 : 132} bgColor="transparent" fgColor="currentColor" className="text-background" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="truncate rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-xs text-muted-foreground">{url}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="soft" onClick={copy}>
              {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a href={`/q/${slug}`} target="_blank" rel="noreferrer">
                <ExternalLink /> Open
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
