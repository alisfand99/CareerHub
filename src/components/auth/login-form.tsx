"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");
  const [pwMessage, setPwMessage] = useState<string | null>(null);

  const [otpEmail, setOtpEmail] = useState("");
  const [otpStatus, setOtpStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  async function onPasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setPwStatus("loading");
    setPwMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setPwStatus("error");
        setPwMessage(error.message);
        return;
      }
      setPwStatus("success");
      router.refresh();
      router.push("/");
    } catch {
      setPwStatus("error");
      setPwMessage(
        "Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL and keys on this deployment.",
      );
    }
  }

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setOtpStatus("sending");
    setOtpMessage(null);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (error) {
        setOtpStatus("error");
        setOtpMessage(error.message);
        return;
      }
      setOtpStatus("sent");
      setOtpMessage("Check your email for the magic link.");
    } catch {
      setOtpStatus("error");
      setOtpMessage("Something went wrong. Check your Supabase environment keys.");
    }
  }

  return (
    <Card className="w-full max-w-md border-border/80 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>
          Use email and password, or get a one-time link by email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">Email & password</TabsTrigger>
            <TabsTrigger value="magic">Magic link</TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="mt-4 space-y-4">
            <form onSubmit={onPasswordSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={pwStatus === "loading"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={pwStatus === "loading"}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={pwStatus === "loading"}
              >
                {pwStatus === "loading" ? "Signing in…" : "Sign in"}
              </Button>
              {pwMessage ? (
                <p
                  className={
                    pwStatus === "error"
                      ? "text-sm text-destructive"
                      : "text-sm text-muted-foreground"
                  }
                >
                  {pwMessage}
                </p>
              ) : null}
            </form>
          </TabsContent>

          <TabsContent value="magic" className="mt-4 space-y-4">
            <form onSubmit={onMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">Email</Label>
                <Input
                  id="magic-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  disabled={otpStatus === "sending"}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                variant="secondary"
                disabled={otpStatus === "sending"}
              >
                {otpStatus === "sending" ? "Sending…" : "Send magic link"}
              </Button>
              {otpMessage ? (
                <p
                  className={
                    otpStatus === "error"
                      ? "text-sm text-destructive"
                      : "text-sm text-muted-foreground"
                  }
                >
                  {otpMessage}
                </p>
              ) : null}
            </form>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />
        <p className="text-center text-xs text-muted-foreground">
          After signing in, dashboard stats load from your Supabase data (RLS).
        </p>
      </CardContent>
    </Card>
  );
}
