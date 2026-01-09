import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MedicoesTabs from "./MedicoesTabs";

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

type SessaoRow = {
  id: string;
  data_local: string;
  hora_local: string;
  tipo_treino: string;
  minutos: number;
  pse_sessao: number;
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

export default async function MedicoesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next recente: params pode vir como Promise
  const { id } = await params; // ESSENCIAL
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

  const { data: athlete, error: athleteError } = await supabase
    .from("athletes")
    .select("id, name, sexo, timezone")
    .eq("id", id)
    .single();

  if (athleteError || !athlete) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Atleta não encontrado (ou sem permissão).</h2>

        <pre style={{ marginTop: 16, fontSize: 12, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(
            {
              paramsId: id,
              userId: userData?.user?.id ?? null,
              athleteError: athleteError
                ? {
                    code: (athleteError as any).code ?? null,
                    message: athleteError.message ?? null,
                    details: (athleteError as any).details ?? null,
                    hint: (athleteError as any).hint ?? null,
                  }
                : null,
            },
            null,
            2
          )}
        </pre>

        <p style={{ marginTop: 16 }}>
          <Link href="/dashboard/athletes">Voltar</Link>
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

  const { data: sessoes, error: sError } = await supabase
    .from("sessoes_treino")
    .select("id, data_local, hora_local, tipo_treino, minutos, pse_sessao, created_at")
    .eq("athlete_id", athlete.id)
    .order("created_at", { ascending: false })
    .limit(25);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Medições</h2>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            Atleta: <b>{athlete.name}</b>
          </div>
          <div style={{ opacity: 0.7, marginTop: 4, fontSize: 13 }}>
            Sexo: <b>{athlete.sexo}</b> · Fuso: <b>{athlete.timezone}</b>
          </div>
        </div>

        <Link href="/dashboard/athletes" style={{ opacity: 0.85 }}>
          ← Voltar
        </Link>
      </div>

      <hr style={{ margin: "16px 0", opacity: 0.2 }} />

      <MedicoesTabs athleteId={athlete.id} athleteSexo={athlete.sexo} />

      <hr style={{ margin: "20px 0", opacity: 0.2 }} />

      <h3 style={{ marginTop: 0 }}>Histórico — Check-in Bem-Estar</h3>
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

      <hr style={{ margin: "20px 0", opacity: 0.2 }} />

      <h3 style={{ marginTop: 0 }}>Histórico — Sessões de Treino</h3>
      {sError ? (
        <p>Erro ao carregar sessões: {sError.message}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <div style={{ opacity: 0.8, marginBottom: 8 }}>Total carregado: {sessoes?.length ?? 0}</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                <th style={{ padding: "8px 6px" }}>Data</th>
                <th style={{ padding: "8px 6px" }}>Hora</th>
                <th style={{ padding: "8px 6px" }}>Tipo</th>
                <th style={{ padding: "8px 6px" }}>Min</th>
                <th style={{ padding: "8px 6px" }}>PSE-sessão</th>
              </tr>
            </thead>
            <tbody>
              {(sessoes as SessaoRow[] | null | undefined)?.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: "8px 6px" }}>{fmtDate(r.data_local)}</td>
                  <td style={{ padding: "8px 6px" }}>{fmtTime(r.hora_local)}</td>
                  <td style={{ padding: "8px 6px" }}>{r.tipo_treino}</td>
                  <td style={{ padding: "8px 6px" }}>{r.minutos}</td>
                  <td style={{ padding: "8px 6px" }}>{r.pse_sessao}</td>
                </tr>
              ))}
              {(sessoes?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "10px 6px", opacity: 0.7 }}>
                    Nenhuma sessão registrada ainda.
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
