import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MarketingCTA({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-20">
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/40 p-10 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        <Button asChild size="lg">
          <Link href={href}>{label}</Link>
        </Button>
      </div>
    </section>
  );
}
