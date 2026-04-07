import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  isValidOpsSessionCookie,
  OPS_WATCH_SESSION_COOKIE,
} from "@/lib/ops-watch-auth";

type ConnectionLogRow = {
  id: string;
  user_id: string;
  user_email: string | null;
  ip_address: string | null;
  device_type: string | null;
  os_name: string | null;
  browser_name: string | null;
  first_seen_at: string;
  last_seen_at: string;
  hit_count: number;
  last_path: string | null;
};

function f(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export default async function OpsWatchPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(OPS_WATCH_SESSION_COOKIE)?.value;
  if (!isValidOpsSessionCookie(session)) {
    redirect("/ops-watch/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">Ops Watch</h1>
        <p className="mt-2 text-sm text-slate-600">Please sign in first.</p>
      </div>
    );
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-900">Access denied</h1>
        <p className="mt-2 text-sm text-red-800">
          This hidden panel is only available for admin accounts.
        </p>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("connection_logs")
    .select(
      "id, user_id, user_email, ip_address, device_type, os_name, browser_name, first_seen_at, last_seen_at, hit_count, last_path",
    )
    .order("last_seen_at", { ascending: false })
    .limit(300);

  const rows = (data ?? []) as ConnectionLogRow[];

  return (
    <div className="w-full space-y-4">
      <header className="space-y-1">
        <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-cyan-700">
          Hidden Admin
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Ops Watch</h1>
        <p className="text-sm text-slate-600">
          Connected users, IP/device fingerprints, and activity timestamps.
        </p>
        <form
          action="/api/ops-watch/logout"
          method="post"
          className="pt-1"
        >
          <button
            type="submit"
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Logout panel
          </button>
        </form>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          Couldn’t load connection logs: {error.message}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 font-semibold">User</th>
              <th className="px-3 py-2 font-semibold">IP</th>
              <th className="px-3 py-2 font-semibold">Device</th>
              <th className="px-3 py-2 font-semibold">Browser / OS</th>
              <th className="px-3 py-2 font-semibold">First seen</th>
              <th className="px-3 py-2 font-semibold">Last seen</th>
              <th className="px-3 py-2 font-semibold">Hits</th>
              <th className="px-3 py-2 font-semibold">Last path</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 align-top">
                <td className="px-3 py-2 text-slate-800">
                  <div className="font-medium">{r.user_email ?? "unknown"}</div>
                  <div className="text-xs text-slate-500">{r.user_id}</div>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-700">
                  {r.ip_address ?? "—"}
                </td>
                <td className="px-3 py-2 text-slate-700">{r.device_type ?? "—"}</td>
                <td className="px-3 py-2 text-slate-700">
                  {(r.browser_name ?? "Unknown") + " / " + (r.os_name ?? "Unknown")}
                </td>
                <td className="px-3 py-2 text-slate-700">{f(r.first_seen_at)}</td>
                <td className="px-3 py-2 text-slate-700">{f(r.last_seen_at)}</td>
                <td className="px-3 py-2 text-slate-700">{r.hit_count}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-700">
                  {r.last_path ?? "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                  No connection logs yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
