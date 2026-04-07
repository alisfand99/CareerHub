import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

const CONNECTION_COOKIE = "ch_vid";

function detectDeviceInfo(uaRaw: string): {
  deviceType: string;
  osName: string;
  browserName: string;
} {
  const ua = uaRaw.toLowerCase();
  const deviceType = /mobile|android|iphone/.test(ua)
    ? "mobile"
    : /ipad|tablet/.test(ua)
      ? "tablet"
      : "desktop";
  const osName = /windows/.test(ua)
    ? "Windows"
    : /mac os x|macintosh/.test(ua)
      ? "macOS"
      : /android/.test(ua)
        ? "Android"
        : /iphone|ipad|ios/.test(ua)
          ? "iOS"
          : /linux/.test(ua)
            ? "Linux"
            : "Unknown";
  const browserName = /edg\//.test(ua)
    ? "Edge"
    : /chrome\//.test(ua)
      ? "Chrome"
      : /safari\//.test(ua) && !/chrome\//.test(ua)
        ? "Safari"
        : /firefox\//.test(ua)
          ? "Firefox"
          : "Unknown";
  return { deviceType, osName, browserName };
}

function getClientIp(request: NextRequest): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip")?.trim();
  return real || null;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  let sessionKey = request.cookies.get(CONNECTION_COOKIE)?.value;
  if (!sessionKey) {
    sessionKey = crypto.randomUUID();
    supabaseResponse.cookies.set(CONNECTION_COOKIE, sessionKey, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && sessionKey) {
    const ua = request.headers.get("user-agent") ?? "";
    const { deviceType, osName, browserName } = detectDeviceInfo(ua);
    const ip = getClientIp(request);
    const nowIso = new Date().toISOString();

    // Best-effort telemetry only; never block auth/session middleware on logging.
    try {
      const { data: existing } = await supabase
        .from("connection_logs")
        .select("id, hit_count")
        .eq("user_id", user.id)
        .eq("session_key", sessionKey)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from("connection_logs")
          .update({
            last_seen_at: nowIso,
            hit_count: (existing.hit_count ?? 0) + 1,
            last_path: request.nextUrl.pathname,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("connection_logs").insert({
          user_id: user.id,
          user_email: user.email ?? null,
          session_key: sessionKey,
          ip_address: ip,
          user_agent: ua || null,
          device_type: deviceType,
          os_name: osName,
          browser_name: browserName,
          first_seen_at: nowIso,
          last_seen_at: nowIso,
          hit_count: 1,
          last_path: request.nextUrl.pathname,
        });
      }
    } catch {
      // Ignore telemetry errors to avoid affecting user traffic.
    }
  }

  return supabaseResponse;
}
