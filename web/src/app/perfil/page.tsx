import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) redirect("/login");

  // Opcional: lê role só pra mostrar/ajustar links
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role ?? "athlete";

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Perfil</h1>

        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/inicio">Início</Link>
          <Link href="/bem-estar">Bem-estar</Link>
          <Link href="/treino">Treino</Link>
          {role === "coach" || role === "admin" ? <Link href="/dashboard">Dashboard</Link> : null}
        </nav>
      </header>

      <p style={{ opacity: 0.8, marginTop: 12 }}>
        Logado como: <b>{data.user.email}</b>
      </p>

      <div style={{ marginTop: 16, padding: 14, border: "1px solid #333", borderRadius: 12 }}>
        <p style={{ marginTop: 0 }}>
          Em construção: aqui vamos colocar <b>nome</b>, <b>sexo</b>, <b>data de nascimento</b>, <b>equipe</b>,{" "}
          <b>timezone</b>, <b>foto</b> e <b>trocar senha</b>.
        </p>
      </div>
    </div>
  );
}
