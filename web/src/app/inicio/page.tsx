import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/dashboard/SignOutButton";

export default async function InicioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  // Se for coach/admin, o "home" dele é o dashboard
  if (profile?.role === "coach" || profile?.role === "admin") {
    redirect("/dashboard");
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1>Início</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/perfil">Perfil</Link>
          <SignOutButton />
        </div>
      </div>

      <p style={{ opacity: 0.85 }}>Escolha o que você quer registrar hoje.</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
        <Link
          href="/bem-estar"
          style={{
            padding: 14,
            border: "1px solid #333",
            borderRadius: 10,
            minWidth: 220,
            textAlign: "center",
          }}
        >
          Bem-estar
        </Link>

        <Link
          href="/treino"
          style={{
            padding: 14,
            border: "1px solid #333",
            borderRadius: 10,
            minWidth: 220,
            textAlign: "center",
          }}
        >
          Sessão de Treino
        </Link>
      </div>
    </div>
  );
}
