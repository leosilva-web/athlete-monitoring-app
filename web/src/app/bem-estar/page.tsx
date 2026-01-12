import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CheckInBemEstarForm from "@/app/dashboard/athletes/[id]/measurements/CheckInBemEstarForm";
import SignOutButton from "@/app/dashboard/SignOutButton";

export const dynamic = "force-dynamic";

type BemEstarRow = {
  id: string;
  data_local: string; // YYYY-MM-DD
  hora_local: string; // HH:MM:SS
  peso_kg: number;
  fadiga: number;
  qualidade_sono: number;
  dor_muscular: number;
  nivel_estresse: number;
  humor: number;
  fase_ciclo_menstrual: string | null;
  intensidade_dor: string | null;
  created_at: string;
};

function fmtDate(yyyyMmDd: string) {
  const p = yyyyMmDd.split("-");
  if (p.length !== 3) return yyyyMmDd;
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function fmtTime(hhMmSs: string) {
  return (hhMmSs || "").slice(0, 5);
}

export default async function BemEstarPage() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return (
      <div style={{ padding: 16 }}>
        <p>Não autenticado.</p>
        <Link href="/login">Ir para Login</Link>
      </div>
    );
  }

  // ✅ Tentativa 1: procurar atleta pelo owner_id (modelo comum com RLS)
  const { data: athleteByOwner, error: e1 } = await supabase
    .from("athletes")
    .select("id, owner_id, name, sexo, timezone")
    .eq("owner_id", userData.user.id)
    .maybeSingle();

  // ✅ Tentativa 2 (fallback): alguns projetos usam athletes.id = auth.uid()
  const { data: athleteById, error: e2 } = athleteByOwner
    ? { data: null, error: null }
    : await supabase
        .from("athletes")
        .select("id, owner_id, name, sexo, timezone")
        .eq("id", userData.user.id)
        .maybeSingle();

  const athlete = athleteByOwner ?? athleteById;
  const athleteError = e1 ?? e2;

  if (!athlete) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Atleta não encontrado (ou sem permissão).</h2>
        <p style={{ marginTop: 12 }}>
          Isso normalmente significa que ainda não existe uma linha em <code>athletes</code> vinculada a este usuário,
          ou o RLS bloqueou a leitura.
        </p>

        <pre style={{ marginTop: 16, fontSize: 12, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(
            {
              auth_user_id: userData.user.id,
              try_owner_id: athleteByOwner ? "FOUND" : "NOT_FOUND",
              try_id: athleteById ? "FOUND" : "NOT_FOUND",
              error: athleteError
                ? {
                    message: athleteError.message ?? null,
                    details: (athleteError as any).details ?? null,
                    hint: (athleteError as any).hint ?? null,
                    code: (athleteError as any).code ?? null,
                  }
                : null,
            },
            null,
            2
          )}
        </pre>

        <p style={{ marginTop: 16 }}>
          <Link href="/inicio">Voltar</Link>
        </p>
      </div>
    );
  }

  const { data: bemEstar, error: beError } = await supabase
    .from("checkins_bem_estar")
    .select(
      "id, data_local, hora_local, peso_kg, fadiga, qualidade_sono, dor_muscular, nivel_estresse, humor, fase_ciclo_menstrual, intensidade_dor, created_at"
    )
    .eq("athlete_id", athlete.id)
    .order("created_at", { ascending: false })
    .limit(15);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      {/* Header (padrão do coach, mas sem dashboard) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Check-in — Bem-estar</h2>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            Atleta: <b>{athlete.name}</b>
          </div>
          <div style={{ opacity: 0.7, marginTop: 4, fontSize: 13 }}>
            Sexo: <b>{athlete.sexo}</b> · Fuso: <b>{athlete.timezone}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/inicio" style={{ opacity: 0.9 }}>
            Início
          </Link>
          <Link href="/treino" style={{ opacity: 0.9 }}>
            Treino
          </Link>
          <Link href="/perfil" style={{ opacity: 0.9 }}>
            Perfil
          </Link>
          <SignOutButton />
        </div>
      </div>

      <hr style={{ margin: "16px 0", opacity: 0.2 }} />

      {/* Formulário (o MESMO do coach) */}
      <CheckInBemEstarForm athleteId={athlete.id} athleteSexo={athlete.sexo} />

      <hr style={{ margin: "20px 0", opacity: 0.2 }} />

      <h3 style={{ marginTop: 0 }}>Histórico — Bem-estar</h3>
      {beError ? (
        <p>Erro ao carregar bem-estar: {beError.message}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <div style={{ opacity: 0.8, marginBottom: 8 }}>Total carregado: {bemEstar?.length ?? 0}</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                <th style={{ padding: "8px 6px" }}>Data</th>
                <th style={{ padding: "8px 6px" }}>Hora</th>
                <th style={{ padding: "8px 6px" }}>Peso</th>
                <th style={{ padding: "8px 6px" }}>Fadiga</th>
                <th style={{ padding: "8px 6px" }}>Sono</th>
                <th style={{ padding: "8px 6px" }}>Dor</th>
                <th style={{ padding: "8px 6px" }}>Estresse</th>
                <th style={{ padding: "8px 6px" }}>Humor</th>
                <th style={{ padding: "8px 6px" }}>Ciclo</th>
                <th style={{ padding: "8px 6px" }}>Dor (ciclo)</th>
              </tr>
            </thead>
            <tbody>
              {(bemEstar as BemEstarRow[] | null | undefined)?.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: "8px 6px" }}>{fmtDate(r.data_local)}</td>
                  <td style={{ padding: "8px 6px" }}>{fmtTime(r.hora_local)}</td>
                  <td style={{ padding: "8px 6px" }}>{r.peso_kg}</td>
                  <td style={{ padding: "8px 6px" }}>{r.fadiga}</td>
                  <td style={{ padding: "8px 6px" }}>{r.qualidade_sono}</td>
                  <td style={{ padding: "8px 6px" }}>{r.dor_muscular}</td>
                  <td style={{ padding: "8px 6px" }}>{r.nivel_estresse}</td>
                  <td style={{ padding: "8px 6px" }}>{r.humor}</td>
                  <td style={{ padding: "8px 6px" }}>{r.fase_ciclo_menstrual ?? "-"}</td>
                  <td style={{ padding: "8px 6px" }}>{r.intensidade_dor ?? "-"}</td>
                </tr>
              ))}
              {(bemEstar?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: "10px 6px", opacity: 0.7 }}>
                    Nenhum check-in de bem-estar ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
