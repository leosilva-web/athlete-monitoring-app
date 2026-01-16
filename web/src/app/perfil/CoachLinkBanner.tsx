import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CoachLinkBanner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // ✅ Só mostra para atleta
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "athlete") return null;

  // atleta logado (pelo owner_id)
  const { data: athlete } = await supabase
    .from("athletes")
    .select("coach_id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const coachId = athlete?.coach_id;
  if (!coachId) return null;

  // ✅ Evita “auto-vínculo” (caso alguém setou coach_id = próprio user)
  if (coachId === user.id) return null;

  const { data: coach } = await supabase
    .from("athletes")
    .select("name")
    .eq("id", coachId)
    .maybeSingle();

  const coachName = coach?.name ?? "seu coach";

  // Pequeno, discreto (canto inferior central)
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 12,
        transform: "translateX(-50%)",
        zIndex: 50,
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        fontSize: 12,
        opacity: 0.9,
        maxWidth: "min(92vw, 900px)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
      aria-label="Conta vinculada ao coach"
      title={`Conta vinculada — monitorado por ${coachName}`}
    >
      Conta vinculada • Monitorado por <b>{coachName}</b>
    </div>
  );
}
