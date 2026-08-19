import type { CatalogService } from "@/lib/catalog-types";
import { formatMoney } from "@/lib/service-catalog";

export function ServicePriceList({ services }: { services: CatalogService[] }) {
  if (services.length === 0) {
    return <p className="text-sm text-muted-foreground">No active services in this category yet.</p>;
  }

  return (
    <ul className="divide-y rounded-xl border">
      {services.map((service) => (
        <li key={service.id} className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-medium">{service.name}</p>
            {service.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
            ) : null}
          </div>
          <span className="shrink-0 text-sm font-medium">{formatMoney(service.basePrice)} / image</span>
        </li>
      ))}
    </ul>
  );
}
