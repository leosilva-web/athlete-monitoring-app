import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <div style={{ opacity: 0.8, marginTop: 6, fontSize: 14 }}>
            Logado como: <b>{data.user.email ?? "sem email"}</b>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            Dashboard
          </Link>
          <Link href="/dashboard/athletes" style={{ textDecoration: "none" }}>
            Atletas
          </Link>
          <SignOutButton />
        </div>
      </div>

      <hr style={{ margin: "16px 0", opacity: 0.2 }} />

      {children}
    </div>
  );
}
