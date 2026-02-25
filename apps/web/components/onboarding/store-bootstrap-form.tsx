"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
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
    <Card>
      <CardHeader>
        <CardTitle>Set up your store</CardTitle>
        <CardDescription>Create your store profile. You can edit branding and domain settings later.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Store name">
            <Input
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
            />
          </FormField>
          <FormField label="Store slug">
            <Input
              type="text"
              required
              minLength={3}
              maxLength={63}
              value={slug}
              onChange={(event) => setSlug(normalizeStoreSlug(event.target.value))}
            />
          </FormField>
          <FeedbackMessage type="error" message={error} />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating store..." : "Create store"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
