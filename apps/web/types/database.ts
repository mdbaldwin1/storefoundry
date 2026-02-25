export type StoreStatus = "draft" | "active" | "suspended";

export type StoreRecord = {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  status: StoreStatus;
  stripe_account_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductStatus = "draft" | "active" | "archived";

export type ProductRecord = {
  id: string;
  store_id: string;
  title: string;
  description: string;
  sku: string | null;
  image_url: string | null;
  is_featured: boolean;
  price_cents: number;
  inventory_qty: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
};

export type StoreDomainVerificationStatus = "pending" | "verified" | "failed";

export type StoreDomainRecord = {
  id: string;
  store_id: string;
  domain: string;
  is_primary: boolean;
  verification_status: StoreDomainVerificationStatus;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StoreBrandingRecord = {
  store_id: string;
  logo_path: string | null;
  primary_color: string | null;
  accent_color: string | null;
  theme_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type StoreSettingsRecord = {
  store_id: string;
  support_email: string | null;
  fulfillment_message: string | null;
  shipping_policy: string | null;
  return_policy: string | null;
  announcement: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export type OrderRecord = {
  id: string;
  store_id: string;
  customer_email: string;
  currency: string;
  subtotal_cents: number;
  total_cents: number;
  status: OrderStatus;
  stripe_payment_intent_id: string | null;
  platform_fee_bps: number;
  platform_fee_cents: number;
  created_at: string;
  updated_at: string;
};

export type OrderItemRecord = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  created_at: string;
};

export type PlanKey = "free" | "starter" | "growth" | "scale";
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "incomplete" | "trialing";

export type SubscriptionRecord = {
  id: string;
  store_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan_key: PlanKey;
  status: SubscriptionStatus;
  platform_fee_bps: number;
  created_at: string;
  updated_at: string;
};

export type InventoryMovementReason = "sale" | "restock" | "adjustment";

export type InventoryMovementRecord = {
  id: string;
  store_id: string;
  product_id: string;
  order_id: string | null;
  delta_qty: number;
  reason: InventoryMovementReason;
  note: string | null;
  created_at: string;
};
