import type { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-full flex-1 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, color-mix(in oklch, white 4%, transparent) 0px, color-mix(in oklch, white 4%, transparent) 1px, transparent 1px, transparent 14px)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10">
          <p className="text-sm font-semibold tracking-tight">Fotopixelz</p>
        </div>
        <div className="relative z-10 max-w-md space-y-4">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight">
            Enterprise-grade image production, built for modern teams.
          </h1>
          <p className="text-sm leading-relaxed text-sidebar-muted-foreground">
            Upload assets, track orders, and manage deliverables from one secure client workspace.
          </p>
        </div>
        <p className="relative z-10 text-xs text-sidebar-muted-foreground">Client workspace</p>
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
