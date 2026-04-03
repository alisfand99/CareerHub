import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const STATIC_EXT = /\.(?:css|js|mjs|map|json|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico|avif)$/i;

export async function middleware(request: NextRequest) {
  const p = request.nextUrl.pathname;
  // Never run Supabase session refresh on Next internals (chunks, HMR, etc.).
  // Missing exclusions here can make dev painfully slow or break asset loads.
  if (
    p.startsWith("/_next") ||
    p === "/favicon.ico" ||
    STATIC_EXT.test(p)
  ) {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    // Exclude every Next internal URL prefix (static, HMR, image opt, etc.) in one shot.
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    "/", // ensure root runs session refresh (some Next versions omit it from the pattern above)
  ],
};
