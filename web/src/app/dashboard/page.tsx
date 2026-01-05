import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  // Se não estiver autenticado, manda pro /login
  if (error || !claims?.sub || claims.role !== "authenticated") {
    redirect("/login");
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Dashboard</h1>
      <p>✅ Você está logado.</p>

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <p><b>User ID:</b> {claims.sub}</p>
        <p><b>Email:</b> {claims.email}</p>
        <p><b>Role:</b> {claims.role}</p>
      </div>
    </main>
  );
}
