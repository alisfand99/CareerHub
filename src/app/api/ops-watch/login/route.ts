import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildOpsSessionValue,
  isValidOpsLogin,
  OPS_WATCH_SESSION_COOKIE,
} from "@/lib/ops-watch-auth";

const BodySchema = z.object({
  username: z.string().min(1).max(120),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "username and password are required" },
      { status: 400 },
    );
  }

  const { username, password } = parsed.data;
  if (!isValidOpsLogin(username, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPS_WATCH_SESSION_COOKIE, buildOpsSessionValue(), {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}

