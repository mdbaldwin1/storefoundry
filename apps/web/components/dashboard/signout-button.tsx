"use client";

export function SignoutButton() {
  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted/45"
    >
      Sign out
    </button>
  );
}
