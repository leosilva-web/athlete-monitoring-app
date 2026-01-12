import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Pega o role no profiles (você mostrou que existe: role = coach/athlete)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  // Se não conseguir ler perfil, trata como sem acesso
  if (error || !profile) redirect("/login");

  const role = profile.role;

  // ✅ REGRA: dashboard é SOMENTE do coach/admin
  if (role !== "coach" && role !== "admin") {
    redirect("/inicio");
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 1000, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ opacity: 0.8, marginTop: 6 }}>
            Logado como: {user.email}
          </p>
        </div>

        <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/dashboard/athletes">Atletas</Link>
          <Link href="/dashboard/invites">Convites</Link>
          <SignOutButton />
        </nav>
      </header>

      <hr style={{ margin: "16px 0", opacity: 0.2 }} />

      {children}
    </div>
  );
}
