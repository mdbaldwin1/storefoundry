"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignoutButton } from "@/components/dashboard/signout-button";

type DashboardNavProps = {
  storeSlug: string;
};

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/settings", label: "Settings" }
];

export function DashboardNav({ storeSlug }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/80 p-3 shadow-sm backdrop-blur">
      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              isActive ? "bg-primary text-primary-foreground" : "bg-muted/50 text-foreground hover:bg-muted"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <Link
        href={`/s/${storeSlug}`}
        className="ml-auto rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted/45"
      >
        View storefront
      </Link>
      <SignoutButton />
    </nav>
  );
}
