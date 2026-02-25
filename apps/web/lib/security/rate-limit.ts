import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || "unknown";
}

export function checkRateLimit(
  request: NextRequest,
  options: {
    key: string;
    limit: number;
    windowMs: number;
  }
): NextResponse | null {
  const now = Date.now();
  const ip = getClientIp(request);
  const bucketKey = `${options.key}:${ip}`;
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs
    });
    return null;
  }

  if (existing.count >= options.limit) {
    return NextResponse.json(
      {
        error: "Too many requests. Please retry shortly."
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((existing.resetAt - now) / 1000))
        }
      }
    );
  }

  existing.count += 1;
  buckets.set(bucketKey, existing);
  return null;
}
