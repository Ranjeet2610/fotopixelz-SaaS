import type { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-full flex-1 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[oklch(0.17_0.01_260)] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_20%,oklch(0.32_0.06_260/0.45),transparent_55%),radial-gradient(ellipse_60%_50%_at_80%_80%,oklch(0.28_0.04_200/0.35),transparent_50%)]"
          aria-hidden="true"
        />
        <div className="relative z-10">
          <p className="text-sm font-semibold tracking-tight">Fotopixelz</p>
        </div>
        <div className="relative z-10 max-w-md space-y-4">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight">
            Enterprise-grade image production, built for modern teams.
          </h1>
          <p className="text-sm leading-relaxed text-white/70">
            Upload assets, track orders, and manage deliverables from one secure client workspace.
          </p>
        </div>
        <p className="relative z-10 text-xs text-white/45">Client workspace</p>
      </section>

      <section className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
        <div className="mx-auto w-full max-w-[440px] space-y-8">
          <div className="space-y-2 lg:hidden">
            <p className="text-sm font-semibold tracking-tight text-foreground">Fotopixelz</p>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
