"use client";

import Link from "next/link";
import { LoadingBlock } from "@/components/loading-block";
import { AddonList } from "@/components/marketing/addon-list";
import { MarketingCTA } from "@/components/marketing/marketing-cta";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { ServicePriceList } from "@/components/marketing/service-price-list";
import { Button } from "@/components/ui/button";
import { useCatalogData } from "@/lib/service-catalog";

export default function PricingPage() {
  const state = useCatalogData();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <MarketingHeader />

      <MarketingHero
        eyebrow="Pricing"
        title="Simple, per-image pricing"
        description="Every service is priced per image. Add optional addons as needed. Your final total is based on the images you actually upload."
        actions={
          <Button asChild size="lg">
            <Link href="/register">Get a quote</Link>
          </Button>
        }
      />

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        {state.status === "loading" ? (
          <LoadingBlock label="Loading pricing..." />
        ) : state.status === "error" ? (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        ) : state.data.categories.every((category) => category.services.length === 0) ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Pricing will appear here once the service catalog is configured.
          </div>
        ) : (
          <div className="space-y-10">
            {state.data.categories
              .filter((category) => category.services.length > 0)
              .map((category) => (
                <div key={category.id}>
                  <div className="mb-4">
                    <h2 className="text-lg font-medium">{category.name}</h2>
                    {category.description ? (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    ) : null}
                  </div>
                  <ServicePriceList services={category.services} />
                </div>
              ))}
          </div>
        )}
      </section>

      {state.status === "ready" && state.data.addons.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-6 pb-16">
          <h2 className="mb-4 text-lg font-medium">Addons</h2>
          <AddonList addons={state.data.addons} />
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-medium">How final pricing works</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            When you place an order, you select services and quantities to get an estimated quote. Your final
            bill is based on the number of images you actually upload, not the original estimate. Any free
            credits on your account are applied automatically before payment is due.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16">
        <h2 className="mb-4 text-lg font-medium">Frequently asked questions</h2>
        <div className="space-y-4">
          <FaqItem
            question="How is my order priced?"
            answer="Each service has a per-image base price. Your order total is the sum of your selected services multiplied by image quantity, plus any addons you choose."
          />
          <FaqItem
            question="What if I upload fewer images than expected?"
            answer="Billing is based on the number of images you actually upload, not your original estimate."
          />
          <FaqItem
            question="Do you offer free credits?"
            answer="Some workspaces include free image credits, which are applied automatically to your order total before payment is due."
          />
        </div>
      </section>

      <MarketingCTA
        title="Ready to see your exact quote?"
        description="Create an account to build an order and get a live price based on your services and images."
        href="/register"
        label="Get started"
      />
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="font-medium">{question}</p>
      <p className="mt-1 text-sm text-muted-foreground">{answer}</p>
    </div>
  );
}
