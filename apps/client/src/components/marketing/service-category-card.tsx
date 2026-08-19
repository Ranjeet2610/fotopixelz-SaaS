import Link from "next/link";
import type { CategoryWithServices } from "@/lib/service-catalog";
import { formatServicePrice } from "@/lib/service-catalog";

export function ServiceCategoryCard({
  category,
  href,
}: {
  category: CategoryWithServices;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-xl border p-6 transition-colors hover:border-primary hover:bg-muted/40"
    >
      <div>
        <h3 className="font-medium">{category.name}</h3>
        {category.description ? (
          <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
        ) : null}
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{formatServicePrice(category.startingPrice)}</span>
        <span className="text-sm text-primary group-hover:underline">View details →</span>
      </div>
    </Link>
  );
}
