"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOrganization } from "@/components/organization-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingBlock } from "@/components/loading-block";
import { ApiError, apiRequest } from "@/lib/api-client";
import type {
  CatalogAddon,
  CatalogService,
  CreatedOrder,
  Paginated,
  QuoteResult,
  ServiceCategory,
} from "@/lib/catalog-types";
import { cn } from "@/lib/utils";
import { WizardProgress } from "./wizard-progress";

type ServiceLine = {
  serviceId: string;
  name: string;
  basePrice: number;
  quantity: number;
};

type WizardStep = 1 | 2 | 3 | 4 | 5;

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function WizardAlert({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      role="alert"
    >
      {message}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function OrderWizard() {
  const router = useRouter();
  const { organization, loading: orgLoading } = useOrganization();

  const [step, setStep] = useState<WizardStep>(1);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [addons, setAddons] = useState<CatalogAddon[]>([]);

  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedServices = useMemo(
    () => serviceLines.filter((line) => line.quantity > 0),
    [serviceLines],
  );

  const loadCategories = useCallback(async () => {
    setLoadingCatalog(true);
    setError(null);
    try {
      const data = await apiRequest<Paginated<ServiceCategory>>("/categories", {
        query: { limit: 100 },
      });
      setCategories(data.items ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load categories");
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  const loadServices = useCallback(async () => {
    if (!categoryId || !organization?.id) {
      return;
    }

    setLoadingCatalog(true);
    setError(null);
    try {
      const data = await apiRequest<Paginated<CatalogService>>("/services", {
        query: { categoryId, organizationId: organization.id, limit: 100 },
      });
      const items = data.items ?? [];
      setServices(items);
      setServiceLines(
        items.map((service) => ({
          serviceId: service.id,
          name: service.name,
          basePrice: service.basePrice,
          quantity: 0,
        })),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load services");
    } finally {
      setLoadingCatalog(false);
    }
  }, [categoryId, organization?.id]);

  const loadAddons = useCallback(async () => {
    setLoadingCatalog(true);
    setError(null);
    try {
      const data = await apiRequest<Paginated<CatalogAddon>>("/addons", {
        query: { limit: 100 },
      });
      setAddons(data.items ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load addons");
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  const loadQuote = useCallback(async () => {
    if (!organization?.id) {
      return;
    }

    setLoadingQuote(true);
    setError(null);
    try {
      const data = await apiRequest<QuoteResult>("/pricing/quote", {
        method: "POST",
        body: {
          organizationId: organization.id,
          items: selectedServices.map((line) => ({
            serviceId: line.serviceId,
            quantity: line.quantity,
          })),
          addons: selectedAddonIds.map((addonId) => ({ addonId })),
          currency: "USD",
        },
      });
      setQuote(data);
      setTitle((current) => {
        if (current.trim()) {
          return current;
        }
        return categoryName
          ? `${categoryName} order`
          : `Order ${new Date().toLocaleDateString()}`;
      });
    } catch (caught) {
      setQuote(null);
      setError(caught instanceof Error ? caught.message : "Failed to load quote");
    } finally {
      setLoadingQuote(false);
    }
  }, [organization?.id, selectedServices, selectedAddonIds, categoryName]);

  useEffect(() => {
    if (step === 1 && categories.length === 0) {
      void loadCategories();
    }
  }, [step, categories.length, loadCategories]);

  useEffect(() => {
    if (step === 2) {
      void loadServices();
    }
  }, [step, loadServices]);

  useEffect(() => {
    if (step === 3 && addons.length === 0) {
      void loadAddons();
    }
  }, [step, addons.length, loadAddons]);

  useEffect(() => {
    if (step === 4) {
      void loadQuote();
    }
  }, [step, loadQuote]);

  function updateServiceQuantity(serviceId: string, quantity: number) {
    setServiceLines((current) =>
      current.map((line) =>
        line.serviceId === serviceId
          ? { ...line, quantity: Math.max(0, quantity) }
          : line,
      ),
    );
  }

  function toggleAddon(addonId: string) {
    setSelectedAddonIds((current) =>
      current.includes(addonId)
        ? current.filter((id) => id !== addonId)
        : [...current, addonId],
    );
  }

  function validateStep(targetStep: WizardStep): string | null {
    if (targetStep === 1) {
      return null;
    }
    if (!categoryId) {
      return "Select a category to continue.";
    }
    if (targetStep === 2) {
      return null;
    }
    if (selectedServices.length === 0) {
      return "Add at least one service with quantity greater than zero.";
    }
    if (targetStep === 3) {
      return null;
    }
    if (targetStep === 4) {
      return null;
    }
    if (!quote) {
      return "Quote is required before creating the order.";
    }
    if (title.trim().length < 2) {
      return "Order title must be at least 2 characters.";
    }
    return null;
  }

  function goNext() {
    const next = Math.min(5, step + 1) as WizardStep;
    const validationError = validateStep(next);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep(next);
  }

  function goBack() {
    setError(null);
    setStep((current) => Math.max(1, current - 1) as WizardStep);
  }

  async function createDraftOrder() {
    const validationError = validateStep(5);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!organization?.id || !categoryId) {
      setError("Workspace organization is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const order = await apiRequest<CreatedOrder>("/orders", {
        method: "POST",
        body: {
          organizationId: organization.id,
          categoryId,
          title: title.trim(),
          instructions: instructions.trim() || undefined,
          items: selectedServices.map((line) => ({
            serviceId: line.serviceId,
            quantity: line.quantity,
          })),
          addons: selectedAddonIds.map((addonId) => ({ addonId })),
        },
      });
      router.push(`/dashboard/orders/${order.id}`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : "Failed to create order",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (orgLoading) {
    return <LoadingBlock label="Loading workspace..." />;
  }

  if (!organization) {
    return (
      <EmptyState
        title="No workspace found"
        description="Your client organization is required before creating an order."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New order</h1>
        <p className="text-sm text-muted-foreground">
          Build an order for {organization.name}. Upload source files in a later step.
        </p>
      </div>

      <WizardProgress currentStep={step} />
      {error ? <WizardAlert message={error} /> : null}

      {step === 1 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-medium">Select category</h2>
            <p className="text-sm text-muted-foreground">
              Choose the editing category that best matches your project.
            </p>
          </div>
          {loadingCatalog ? (
            <LoadingBlock label="Loading categories..." />
          ) : categories.length === 0 ? (
            <EmptyState
              title="No categories available"
              description="Catalog categories will appear here once configured."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {categories.map((category) => {
                const selected = categoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(category.id);
                      setCategoryName(category.name);
                      setError(null);
                    }}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors hover:bg-muted/50",
                      selected && "border-primary ring-2 ring-primary/20",
                    )}
                  >
                    <p className="font-medium">{category.name}</p>
                    {category.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-medium">Select services</h2>
            <p className="text-sm text-muted-foreground">
              Choose services and set image quantities for {categoryName ?? "this category"}.
            </p>
          </div>
          {loadingCatalog ? (
            <LoadingBlock label="Loading services..." />
          ) : services.length === 0 ? (
            <EmptyState
              title="No services in this category"
              description="Try another category or contact support."
            />
          ) : (
            <div className="space-y-3">
              {serviceLines.map((line) => (
                <Card key={line.serviceId} size="sm">
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{line.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatMoney(line.basePrice)} per image
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground" htmlFor={`qty-${line.serviceId}`}>
                        Expected images
                      </label>
                      <Input
                        id={`qty-${line.serviceId}`}
                        type="number"
                        min={0}
                        step={1}
                        value={line.quantity}
                        onChange={(event) =>
                          updateServiceQuantity(line.serviceId, Number(event.target.value) || 0)
                        }
                        className="w-24"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-medium">Select addons</h2>
            <p className="text-sm text-muted-foreground">Optional enhancements for your order.</p>
          </div>
          {loadingCatalog ? (
            <LoadingBlock label="Loading addons..." />
          ) : addons.length === 0 ? (
            <EmptyState
              title="No addons available"
              description="You can continue without addons."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {addons.map((addon) => {
                const selected = selectedAddonIds.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors hover:bg-muted/50",
                      selected && "border-primary ring-2 ring-primary/20",
                    )}
                  >
                    <p className="font-medium">{addon.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatMoney(addon.price)} · {addon.pricingType.replace("_", " ")}
                    </p>
                    {addon.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">{addon.description}</p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-medium">Quote review</h2>
            <p className="text-sm text-muted-foreground">
              Review pricing before placing your order.
            </p>
          </div>
          {loadingQuote ? (
            <LoadingBlock label="Calculating quote..." />
          ) : !quote ? (
            <EmptyState
              title="Quote unavailable"
              description="Go back and verify your service selections, then try again."
            />
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quote.items.map((item) => (
                    <div key={item.serviceId} className="flex justify-between text-sm">
                      <span>
                        {item.serviceName} × {item.quantity}
                      </span>
                      <span>{formatMoney(item.subtotal, quote.currency)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 text-sm font-medium">
                    <span>Services subtotal</span>
                    <span>{formatMoney(quote.servicesSubtotal, quote.currency)}</span>
                  </div>
                </CardContent>
              </Card>

              {quote.addons.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Addons</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {quote.addons.map((addon) => (
                      <div key={addon.addonId} className="flex justify-between text-sm">
                        <span>{addon.addonName}</span>
                        <span>{formatMoney(addon.subtotal, quote.currency)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t pt-2 text-sm font-medium">
                      <span>Addons subtotal</span>
                      <span>{formatMoney(quote.addonsSubtotal, quote.currency)}</span>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardContent className="grid gap-3 pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Expected images</p>
                    <p className="text-lg font-semibold">{quote.totalImageCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Credits</p>
                    <p className="text-lg font-semibold">{quote.creditsUsed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Estimated total</p>
                    <p className="text-lg font-semibold">
                      {formatMoney(quote.grandTotal, quote.currency)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      ) : null}

      {step === 5 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-medium">Place order</h2>
            <p className="text-sm text-muted-foreground">
              Name your order and place it. You can upload files next.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order details</CardTitle>
              <CardDescription>Required before placing your order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="order-title">
                  Title
                </label>
                <Input
                  id="order-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Spring catalog retouching"
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="order-instructions">
                  Instructions (optional)
                </label>
                <textarea
                  id="order-instructions"
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="Editing notes for the production team"
                  rows={4}
                  className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            </CardContent>
          </Card>

          {quote ? (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Category:</span> {categoryName}
                </p>
                <p>
                  <span className="text-muted-foreground">Expected images:</span> {quote.totalImageCount}
                </p>
                <p>
                  <span className="text-muted-foreground">Estimated total:</span>{" "}
                  {formatMoney(quote.grandTotal, quote.currency)}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </section>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={goBack} disabled={step === 1 || submitting}>
          Previous
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          {step < 5 ? (
            <Button
              type="button"
              onClick={goNext}
              disabled={
                loadingCatalog ||
                loadingQuote ||
                (step === 1 && !categoryId) ||
                (step === 4 && !quote)
              }
            >
              Next
            </Button>
          ) : (
            <Button type="button" onClick={() => void createDraftOrder()} disabled={submitting}>
              {submitting ? "Placing order…" : "Place Order"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
