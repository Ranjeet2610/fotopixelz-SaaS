"use client";

import { useState, type ReactNode } from "react";

const TABS = ["Overview", "Assets", "Comments", "Timeline", "Activity"] as const;
export type OrderDetailTab = (typeof TABS)[number];

type OrderDetailTabsProps = {
  overview: ReactNode;
  assets: ReactNode;
  comments: ReactNode;
  timeline: ReactNode;
  activity: ReactNode;
  defaultTab?: OrderDetailTab;
};

export function OrderDetailTabs({
  overview,
  assets,
  comments,
  timeline,
  activity,
  defaultTab = "Overview",
}: OrderDetailTabsProps) {
  const [active, setActive] = useState<OrderDetailTab>(defaultTab);

  const panels: Record<OrderDetailTab, ReactNode> = {
    Overview: overview,
    Assets: assets,
    Comments: comments,
    Timeline: timeline,
    Activity: activity,
  };

  return (
    <section className="order-detail-tabs">
      <div className="order-detail-tablist" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === tab}
            className={`order-detail-tab${active === tab ? " order-detail-tab-active" : ""}`}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="order-detail-tabpanel" role="tabpanel">
        {panels[active]}
      </div>
    </section>
  );
}
