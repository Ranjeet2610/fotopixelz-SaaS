import type { CategoryWithServices } from "@/lib/service-catalog";
import { routeSlugForCategory } from "@/lib/service-catalog";
import { ServiceCategoryCard } from "./service-category-card";

export function ServiceGrid({ categories }: { categories: CategoryWithServices[] }) {
  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        Services will appear here once the catalog is configured.
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <ServiceCategoryCard
          key={category.id}
          category={category}
          href={routeSlugForCategory(category) ?? "/pricing"}
        />
      ))}
    </div>
  );
}
