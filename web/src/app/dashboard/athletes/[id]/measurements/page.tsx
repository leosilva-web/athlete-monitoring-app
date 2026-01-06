import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddMeasurementForm from "./AddMeasurementForm";

export default async function MeasurementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: athleteId } = await params;

  const supabase = await createClient();

  // 1) Confirma que o atleta existe e pertence ao usuário logado (via RLS)
  const { data: athlete, error: athleteError } = await supabase
    .from("athletes")
    .select("id, name")
    .eq("id", athleteId)
    .single();

  if (athleteError || !athlete) {
    return (
      <div>
        <p>Atleta não encontrado (ou você não tem acesso).</p>
        <Link href="/dashboard/athletes">Voltar</Link>
      </div>
    );
  }

  // 2) Lista medições do atleta
  const { data: rows, error } = await supabase
    .from("athlete_measurements")
    .select(
      "id, date, weight_kg, fatigue, sleep_quality, general_muscle_soreness, stress_levels, mood, session_time_minutes, session_rpe, created_at"
    )
    .eq("athlete_id", athleteId)
    .order("date", { ascending: false })
    .limit(60);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Medições</h2>
          <div style={{ opacity: 0.8, marginTop: 6 }}>
            Atleta: <b>{athlete.name}</b>
          </div>
        </div>

        <Link href="/dashboard/athletes">← Voltar</Link>
      </div>

      <AddMeasurementForm athleteId={athleteId} />

      <div style={{ marginTop: 16, opacity: 0.85 }}>
        {error ? (
          <p>Erro ao carregar medições: {error.message}</p>
        ) : (
          <p>Total carregado: {rows?.length ?? 0}</p>
        )}
      </div>

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Data</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Peso</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Fadiga</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Sono</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Dor</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Estresse</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Humor</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Min</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>RPE</th>
            </tr>
          </thead>

          <tbody>
            {(rows ?? []).map((r) => (
              <tr key={r.id}>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {new Date(r.date).toLocaleDateString()}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {r.weight_kg ?? "-"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{r.fatigue}</td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{r.sleep_quality}</td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {r.general_muscle_soreness}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{r.stress_levels}</td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{r.mood}</td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {r.session_time_minutes ?? "-"}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {r.session_rpe ?? "-"}
                </td>
              </tr>
            ))}

            {(rows?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: 12, opacity: 0.7 }}>
                  Nenhuma medição ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
