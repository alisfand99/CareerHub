import { createHash } from "crypto";

export const OPS_WATCH_SESSION_COOKIE = "ops_watch_session";

function getOpsUsername(): string {
  return process.env.OPS_WATCH_USERNAME?.trim() || "opsadmin";
}

function getOpsPassword(): string {
  return process.env.OPS_WATCH_PASSWORD?.trim() || "CareerHub@2026!";
}

function getOpsSecret(): string {
  return process.env.OPS_WATCH_SECRET?.trim() || "careerhub-ops-watch-secret";
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function isValidOpsLogin(username: string, password: string): boolean {
  return (
    username.trim() === getOpsUsername() && password.trim() === getOpsPassword()
  );
}

export function buildOpsSessionValue(): string {
  return digest(`${getOpsUsername()}::${getOpsPassword()}::${getOpsSecret()}`);
}

export function isValidOpsSessionCookie(value: string | undefined): boolean {
  if (!value) return false;
  return value === buildOpsSessionValue();
}

