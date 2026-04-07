import { NextResponse } from "next/server";
import { OPS_WATCH_SESSION_COOKIE } from "@/lib/ops-watch-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPS_WATCH_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}

