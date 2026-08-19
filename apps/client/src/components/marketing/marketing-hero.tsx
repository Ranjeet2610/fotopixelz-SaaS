import type { ReactNode } from "react";

export function MarketingHero({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 text-center sm:py-20">
      {eyebrow ? (
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{eyebrow}</p>
      ) : null}
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">{description}</p>
      {actions ? <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div> : null}
    </section>
  );
}
