import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchUserContacts } from "@/lib/queries/contacts";
import { NetworkConnections } from "@/components/network/network-connections";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { workspaceNotReady } from "@/lib/user-facing-copy";

export default async function NetworkPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Network CRM</h1>
        <p className="text-sm text-muted-foreground">{workspaceNotReady}</p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Network CRM</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage connections.
        </p>
        <Link href="/login" className={cn(buttonVariants())}>
          Sign in
        </Link>
      </div>
    );
  }

  const contacts = await fetchUserContacts(supabase, user.id);

  return (
    <div className="mx-auto max-w-5xl">
      <NetworkConnections initialContacts={contacts} />
    </div>
  );
}
