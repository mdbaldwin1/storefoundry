"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignoutButton } from "@/components/dashboard/signout-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StoreRecord } from "@/types/database";

type DashboardNavProps = {
  storeSlug: string;
  storeStatus: StoreRecord["status"];
};

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/insights", label: "Insights" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/settings", label: "Settings" }
];

export function DashboardNav({ storeSlug, storeStatus }: DashboardNavProps) {
  const pathname = usePathname();
  const storefrontLabel = storeStatus === "active" ? "View storefront" : "Preview storefront";

  return (
    <nav className="h-fit rounded-lg border border-border bg-card p-3 lg:sticky lg:top-6">
      <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Navigation</p>
      <div className="space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(buttonVariants({ variant: isActive ? "default" : "ghost", size: "sm" }), "w-full justify-start")}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      <div className="mt-4 space-y-2 border-t border-border pt-3">
        <Link href={`/s/${storeSlug}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-start")}>
          {storefrontLabel}
        </Link>
        <SignoutButton />
      </div>
    </nav>
  );
}
