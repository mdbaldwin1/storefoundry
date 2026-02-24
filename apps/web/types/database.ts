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
