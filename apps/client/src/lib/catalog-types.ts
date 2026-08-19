export type Paginated<T> = {
  items: T[];
  page?: number;
  limit?: number;
  total?: number;
};

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

export type CatalogService = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  categoryId: string;
  isActive?: boolean;
};

export type CatalogAddon = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  pricingType: "FIXED" | "PER_IMAGE";
  credits: number;
};

export type QuotedServiceLine = {
  serviceId: string;
  serviceName: string;
  serviceSlug: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
};

export type QuotedAddonLine = {
  addonId: string;
  addonName: string;
  addonSlug: string;
  quantity: number;
  unitPrice: number;
  pricingType: "FIXED" | "PER_IMAGE";
  subtotal: number;
  credits: number;
};

export type QuoteResult = {
  organizationId: string;
  currency: string;
  totalImageCount: number;
  items: QuotedServiceLine[];
  addons: QuotedAddonLine[];
  servicesSubtotal: number;
  addonsSubtotal: number;
  grandTotal: number;
  creditsUsed: number;
  isManualTotal: boolean;
};

export type OrderServiceLine = {
  id: string;
  serviceId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string | null;
  service?: {
    id: string;
    name: string;
    slug: string;
  };
};

export type OrderAddonLine = {
  id: string;
  addonId: string;
  quantity: number;
  unitPrice: number;
  pricingType: "FIXED" | "PER_IMAGE";
  subtotal: number;
  credits: number;
  addon?: {
    id: string;
    name: string;
    slug: string;
  };
};

export type CreatedOrder = {
  id: string;
  orderNumber: string;
  organizationId?: string;
  title: string;
  status: string;
  totalAmount: number;
  currency: string;
  totalImages: number;
  creditsUsed: number;
  categoryId?: string | null;
  instructions?: string | null;
  dueDate?: string | null;
  reviewRound?: number;
  createdAt?: string;
  updatedAt?: string;
  items?: OrderServiceLine[];
  addons?: OrderAddonLine[];
};

export type OrderBillingSummary = {
  expectedImages: number;
  uploadedImages: number;
  availableCredits: number;
  freeCreditsUsed: number;
  billableImages: number;
  pricePerImage: number;
  amountDue: number;
  imagesNotUploaded: number;
  paymentRequired: boolean;
};

export type SubmitOrderResult = {
  order: CreatedOrder;
  billing: OrderBillingSummary;
  amountDue: number;
  imageCreditsApplied: number;
  paymentRequired: boolean;
};
