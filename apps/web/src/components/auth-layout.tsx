import type { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-full flex-1 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-foreground text-background lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="text-sm font-medium tracking-wide uppercase opacity-80">Fotopixelz</div>
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl leading-tight font-semibold">
            Professional image editing, delivered on your schedule.
          </h1>
          <p className="text-sm leading-relaxed opacity-80">
            Upload assets, track orders, and manage billing from one client workspace.
          </p>
        </div>
        <p className="text-xs opacity-60">Client workspace</p>
      </section>

      <section className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
        <div className="mx-auto w-full max-w-md space-y-8">
          <div className="space-y-2 lg:hidden">
            <p className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Fotopixelz</p>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
