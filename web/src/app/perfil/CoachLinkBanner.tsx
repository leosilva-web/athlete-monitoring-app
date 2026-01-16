import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function mapSexoToPt(value: string | null | undefined) {
  const v = (value || "").toLowerCase().trim();
  if (v === "male") return "masculino";
  if (v === "female") return "feminino";
  return value || "";
}

export default async function CoachLinkBanner() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return null;

  // Só mostra para atleta
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "athlete") return null;

  // Pega o athlete (padrão owner_id, com fallback id)
  const { data: athleteByOwner } = await supabase
    .from("athletes")
    .select("id, coach_id, owner_id, name, sexo, timezone")
    .eq("owner_id", userId)
    .maybeSingle();

  const { data: athleteById } = athleteByOwner
    ? { data: null as any }
    : await supabase
        .from("athletes")
        .select("id, coach_id, owner_id, name, sexo, timezone")
        .eq("id", userId)
        .maybeSingle();

  const athlete = athleteByOwner ?? athleteById;
  if (!athlete) return null;

  // coach_id preferencialmente vem direto do athlete
  let coachId: string | null = athlete.coach_id ?? null;

  // fallback: tentar na tabela coach_athletes (se existir vínculo por lá)
  if (!coachId) {
    const { data: ca } = await supabase
      .from("coach_athletes")
      .select("coach_id")
      .eq("athlete_id", athlete.id)
      .maybeSingle();

    coachId = (ca as any)?.coach_id ?? null;
  }

  if (!coachId) {
    return (
      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Vínculo de monitoramento</div>
        <div style={{ opacity: 0.85 }}>
          Você ainda não está vinculado a nenhum coach.
        </div>
      </div>
    );
  }

  const { data: coachProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", coachId)
    .maybeSingle();

  const coachName =
    (coachProfile?.full_name || "").trim() ||
    (coachProfile?.email || "").trim() ||
    coachId;

  return (
    <div
      style={{
        marginTop: 16,
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 6 }}>
        Monitoramento ativo
      </div>
      <div style={{ opacity: 0.9 }}>
        Você está sendo gerenciado pelo coach: <b>{coachName}</b>
      </div>
      <div style={{ opacity: 0.7, marginTop: 6, fontSize: 13 }}>
        Atleta: <b>{athlete.name}</b> · Sexo: <b>{mapSexoToPt(athlete.sexo)}</b> · Fuso: <b>{athlete.timezone}</b>
      </div>
    </div>
  );
}
