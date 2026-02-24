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
  price_cents: number;
  inventory_qty: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
};
