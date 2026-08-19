import type { CatalogAddon } from "@/lib/catalog-types";
import { formatMoney } from "@/lib/service-catalog";

export function AddonList({ addons }: { addons: CatalogAddon[] }) {
  if (addons.length === 0) {
    return null;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {addons.map((addon) => (
        <li key={addon.id} className="rounded-xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{addon.name}</p>
            <span className="shrink-0 text-sm font-medium">
              {formatMoney(addon.price)} {addon.pricingType === "PER_IMAGE" ? "/ image" : "flat"}
            </span>
          </div>
          {addon.description ? <p className="mt-1 text-sm text-muted-foreground">{addon.description}</p> : null}
        </li>
      ))}
    </ul>
  );
}
