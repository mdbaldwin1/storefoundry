"use client";

import { useState } from "react";
import type { StoreContentBlockRecord } from "@/types/database";

type ContentBlocksManagerProps = {
  initialBlocks: Array<
    Pick<StoreContentBlockRecord, "id" | "sort_order" | "eyebrow" | "title" | "body" | "cta_label" | "cta_url" | "is_active">
  >;
};

type ContentBlockInput = {
  id?: string;
  sortOrder: number;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  isActive: boolean;
};

type ContentBlocksResponse = {
  blocks?: Array<
    Pick<StoreContentBlockRecord, "id" | "sort_order" | "eyebrow" | "title" | "body" | "cta_label" | "cta_url" | "is_active">
  >;
  error?: string;
};

function toInput(block: Pick<StoreContentBlockRecord, "id" | "sort_order" | "eyebrow" | "title" | "body" | "cta_label" | "cta_url" | "is_active">): ContentBlockInput {
  return {
    id: block.id,
    sortOrder: block.sort_order,
    eyebrow: block.eyebrow ?? "",
    title: block.title,
    body: block.body,
    ctaLabel: block.cta_label ?? "",
    ctaUrl: block.cta_url ?? "",
    isActive: block.is_active
  };
}

export function ContentBlocksManager({ initialBlocks }: ContentBlocksManagerProps) {
  const [blocks, setBlocks] = useState<ContentBlockInput[]>(initialBlocks.map(toInput));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function addBlock() {
    const nextOrder = blocks.length === 0 ? 0 : Math.max(...blocks.map((block) => block.sortOrder)) + 1;
    setBlocks((current) => [
      ...current,
      {
        sortOrder: nextOrder,
        eyebrow: "",
        title: "New content block",
        body: "Tell shoppers about ingredients, process, or seasonal drops.",
        ctaLabel: "",
        ctaUrl: "",
        isActive: true
      }
    ]);
  }

  function updateBlock(index: number, patch: Partial<ContentBlockInput>) {
    setBlocks((current) => current.map((block, blockIndex) => (blockIndex === index ? { ...block, ...patch } : block)));
  }

  function removeBlock(index: number) {
    setBlocks((current) => current.filter((_, blockIndex) => blockIndex !== index));
  }

  async function saveBlocks() {
    setSaving(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/stores/content-blocks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blocks: blocks.map((block) => ({
          id: block.id,
          sortOrder: block.sortOrder,
          eyebrow: block.eyebrow.trim() || null,
          title: block.title,
          body: block.body,
          ctaLabel: block.ctaLabel.trim() || null,
          ctaUrl: block.ctaUrl.trim() || null,
          isActive: block.isActive
        }))
      })
    });

    const payload = (await response.json()) as ContentBlocksResponse;
    setSaving(false);

    if (!response.ok || !payload.blocks) {
      setError(payload.error ?? "Unable to save content blocks.");
      return;
    }

    setBlocks(payload.blocks.map(toInput));
    setMessage("Content blocks saved.");
  }

  return (
    <section className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Storefront Content Blocks</h2>
        <button type="button" onClick={addBlock} className="rounded-md border border-border px-3 py-2 text-xs font-medium">
          Add block
        </button>
      </header>

      {blocks.length === 0 ? <p className="text-sm text-muted-foreground">No content blocks yet.</p> : null}

      <div className="space-y-3">
        {blocks.map((block, index) => (
          <article key={block.id ?? `new-${index}`} className="space-y-2 rounded-md border border-border bg-background p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sort Order</span>
                <input
                  type="number"
                  value={block.sortOrder}
                  onChange={(event) => updateBlock(index, { sortOrder: Number(event.target.value) })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Eyebrow</span>
                <input
                  value={block.eyebrow}
                  onChange={(event) => updateBlock(index, { eyebrow: event.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Title</span>
              <input
                value={block.title}
                onChange={(event) => updateBlock(index, { title: event.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Body</span>
              <textarea
                rows={3}
                value={block.body}
                onChange={(event) => updateBlock(index, { body: event.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <input
                placeholder="CTA Label"
                value={block.ctaLabel}
                onChange={(event) => updateBlock(index, { ctaLabel: event.target.value })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                placeholder="https://..."
                value={block.ctaUrl}
                onChange={(event) => updateBlock(index, { ctaUrl: event.target.value })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={block.isActive} onChange={(event) => updateBlock(index, { isActive: event.target.checked })} />
                active
              </label>
            </div>
            <button type="button" onClick={() => removeBlock(index)} className="rounded-md border border-border px-2 py-1 text-xs">
              Remove block
            </button>
          </article>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <button
        type="button"
        onClick={() => void saveBlocks()}
        disabled={saving}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save content blocks"}
      </button>
    </section>
  );
}
