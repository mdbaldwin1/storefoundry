"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeStoreSlug } from "@/lib/stores/slug";

type BootstrapResponse = {
  store?: { id: string; slug: string };
  error?: string;
};

export function StoreBootstrapForm() {
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedSlug = normalizeStoreSlug(slug || storeName);

    const response = await fetch("/api/stores/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeName, slug: normalizedSlug })
    });

    const data = (await response.json()) as BootstrapResponse;

    setLoading(false);

    if (!response.ok || !data.store) {
      setError(data.error ?? "Unable to create store");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-card/80 p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">Set up your store</h1>
      <p className="text-sm text-muted-foreground">Create your store profile. You can edit branding and domain settings later.</p>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Store name</span>
        <input
          type="text"
          required
          minLength={2}
          value={storeName}
          onChange={(event) => {
            const next = event.target.value;
            setStoreName(next);
            if (!slug) {
              setSlug(normalizeStoreSlug(next));
            }
          }}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Store slug</span>
        <input
          type="text"
          required
          minLength={3}
          maxLength={63}
          value={slug}
          onChange={(event) => setSlug(normalizeStoreSlug(event.target.value))}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {loading ? "Creating store..." : "Create store"}
      </button>
    </form>
  );
}
