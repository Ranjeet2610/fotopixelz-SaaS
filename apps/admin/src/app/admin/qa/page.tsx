"use client";

import { OrdersPage } from "@/components/orders-page";
import { PeoplePage } from "@/components/people-page";
import { useAuth } from "@/components/auth-provider";

export default function Page() {
  const { user } = useAuth();
  return user?.role === "QA" ? <OrdersPage queue /> : <PeoplePage mode="qa" />;
}
