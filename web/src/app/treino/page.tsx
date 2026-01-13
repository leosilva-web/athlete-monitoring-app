import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/dashboard/SignOutButton";
import CheckInSessaoTreinoForm from "@/app/dashboard/athletes/[id]/measurements/CheckInSessaoTreinoForm";
import DeleteSessaoButton from "./DeleteSessaoButton";

export const dynamic = "force-dynamic";

type SessaoRow = {
  id: string;
  data_local: string; // YYYY-MM-DD
  hora_local: string; // HH:MM:SS
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

function mapSexoToPt(value: string | null | undefined) {
  const v = (value || "").toLowerCase().trim();
  if (v === "male") return "masculino";
  if (v === "female") return "feminino";
  return value || "";
}

function formatSupabaseError(err: any) {
  if (!err) return null;
  return JSON.stringify(
    {
      message: err.message ?? null,
      details: err.details ?? null,
      hint: err.hint ?? null,
      code: err.code ?? null,
    },
    null,
    2
  );
}

export default async function TreinoPage() {
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

  const userId = userData.user.id;

  // 1) Tenta achar atleta por owner_id
  const { data: athleteByOwner, error: e1 } = await supabase
    .from("athletes")
    .select("id, owner_id, name, sexo, timezone")
    .eq("owner_id", userId)
    .maybeSingle();

  // 2) Fallback: athletes.id = auth.uid()
  const { data: athleteById, error: e2 } = athleteByOwner
    ? { data: null as any, error: null as any }
    : await supabase
        .from("athletes")
        .select("id, owner_id, name, sexo, timezone")
        .eq("id", userId)
        .maybeSingle();

  let athlete = athleteByOwner ?? athleteById;

  // 3) Se não existir atleta, cria usando o perfil
  if (!athlete) {
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("full_name, sex, timezone")
      .eq("id", userId)
      .maybeSingle();

    if (pErr) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Erro ao ler perfil.</h2>
          <pre style={{ marginTop: 12, fontSize: 12, whiteSpace: "pre-wrap" }}>
            {formatSupabaseError(pErr)}
          </pre>
          <p style={{ marginTop: 16 }}>
            <Link href="/perfil">Ir para Perfil</Link>
          </p>
        </div>
      );
    }

    const fullName = (profile?.full_name || "").trim();
    const sexoPt = mapSexoToPt(profile?.sex || "");
    const tz = (profile?.timezone || "").trim();

    // Perfil incompleto -> obriga completar
    if (!fullName || !sexoPt || !tz) {
      return (
        <div
          style={{
            maxWidth: 720,
            margin: "40px auto",
            padding: 16,
            fontFamily: "system-ui",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Antes do Treino…</h2>
          <p style={{ opacity: 0.85 }}>
            Seu perfil precisa estar completo para registrar treino: <b>Nome</b>,{" "}
            <b>Sexo</b> e <b>Fuso horário</b>.
          </p>
          <p style={{ marginTop: 12 }}>
            <Link href="/perfil">Ir para Perfil</Link>
          </p>
          <p style={{ marginTop: 12 }}>
            <Link href="/inicio">Voltar</Link>
          </p>
        </div>
      );
    }

    const { data: createdAthlete, error: insErr } = await supabase
      .from("athletes")
      .insert({
        id: userId,
        owner_id: userId,
        name: fullName,
        sexo: sexoPt,
        timezone: tz,
      })
      .select("id, owner_id, name, sexo, timezone")
      .single();

    if (insErr || !createdAthlete) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Não foi possível criar seu registro de atleta.</h2>
          <p style={{ marginTop: 10, opacity: 0.85 }}>
            Isso normalmente é <b>RLS</b> ou <b>constraint</b> no banco.
          </p>
          <pre style={{ marginTop: 12, fontSize: 12, whiteSpace: "pre-wrap" }}>
            {formatSupabaseError(insErr)}
          </pre>
          <p style={{ marginTop: 16 }}>
            <Link href="/perfil">Ir para Perfil</Link>
          </p>
        </div>
      );
    }

    athlete = createdAthlete;
  }

  if (!athlete) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Atleta não encontrado (ou sem permissão).</h2>
        <pre style={{ marginTop: 12, fontSize: 12, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(
            {
              auth_user_id: userId,
              try_owner_id: athleteByOwner ? "FOUND" : "NOT_FOUND",
              try_id: athleteById ? "FOUND" : "NOT_FOUND",
              error1: formatSupabaseError(e1),
              error2: formatSupabaseError(e2),
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

  const athleteSexoPt = mapSexoToPt(athlete.sexo);

  // ✅ "Hoje" no fuso do atleta (YYYY-MM-DD)
  const hojeLocal = new Date().toLocaleDateString("en-CA", {
    timeZone: athlete.timezone,
  });

  const { data: sessoes, error: sError } = await supabase
    .from("sessoes_treino")
    .select("id, data_local, hora_local, tipo_treino, minutos, pse_sessao, created_at")
    .eq("athlete_id", athlete.id)
    .eq("data_local", hojeLocal)
    .order("created_at", { ascending: false })
    .limit(25);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      {/* Header padrão, sem dashboard */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Sessão de Treino</h2>
          <div style={{ opacity: 0.85, marginTop: 6 }}>
            Atleta: <b>{athlete.name}</b>
          </div>
          <div style={{ opacity: 0.7, marginTop: 4, fontSize: 13 }}>
            Sexo: <b>{athleteSexoPt}</b> · Fuso: <b>{athlete.timezone}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/inicio" style={{ opacity: 0.9 }}>
            Início
          </Link>
          <Link href="/bem-estar" style={{ opacity: 0.9 }}>
            Bem-estar
          </Link>
          <Link href="/perfil" style={{ opacity: 0.9 }}>
            Perfil
          </Link>
          <SignOutButton />
        </div>
      </div>

      <hr style={{ margin: "16px 0", opacity: 0.2 }} />

      {/* Formulário (mesmo padrão do coach) */}
      <CheckInSessaoTreinoForm athleteId={athlete.id} />

      <hr style={{ margin: "20px 0", opacity: 0.2 }} />

      <h3 style={{ marginTop: 0 }}>Histórico — Sessões de Treino (hoje)</h3>

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
                <th style={{ padding: "8px 6px" }}>Ações</th>
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
                  <td style={{ padding: "8px 6px" }}>
                    <DeleteSessaoButton id={r.id} />
                  </td>
                </tr>
              ))}

              {(sessoes?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "10px 6px", opacity: 0.7 }}>
                    Nenhuma sessão registrada hoje.
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
