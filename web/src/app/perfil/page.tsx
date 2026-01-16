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
  const user = userData?.user;
  if (!user) return null;

  // tenta achar o atleta do usuário (owner_id = auth.uid) e fallback (id = auth.uid)
  const { data: a1 } = await supabase
    .from("athletes")
    .select("id, owner_id, name, sexo, timezone, coach_id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: a2 } = a1
    ? { data: null as any }
    : await supabase
        .from("athletes")
        .select("id, owner_id, name, sexo, timezone, coach_id")
        .eq("id", user.id)
        .maybeSingle();

  const athlete = a1 ?? a2;
  if (!athlete?.coach_id) return null;

  // nome do coach (no seu modelo atual, o coach também existe em athletes)
  const { data: coachAthlete } = await supabase
    .from("athletes")
    .select("name")
    .eq("id", athlete.coach_id)
    .maybeSingle();

  const coachName = coachAthlete?.name?.trim() || "Coach";

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 4 }}>Conta vinculada</div>
      <div style={{ opacity: 0.9 }}>
        Você está sendo monitorado por: <b>{coachName}</b>
      </div>
      <div style={{ opacity: 0.7, fontSize: 13, marginTop: 6 }}>
        Atleta: <b>{athlete.name}</b> · Sexo: <b>{mapSexoToPt(athlete.sexo)}</b> · Fuso:{" "}
        <b>{athlete.timezone}</b>
      </div>
    </div>
  );
}
