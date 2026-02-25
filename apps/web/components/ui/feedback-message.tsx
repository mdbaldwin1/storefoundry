import { cn } from "@/lib/utils";

type FeedbackMessageProps = {
  type: "error" | "success";
  message: string | null;
  className?: string;
};

export function FeedbackMessage({ type, message, className }: FeedbackMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p className={cn("text-sm", type === "error" ? "text-red-600" : "text-emerald-700", className)}>
      {message}
    </p>
  );
}
