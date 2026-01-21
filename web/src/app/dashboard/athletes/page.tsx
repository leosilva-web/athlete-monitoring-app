import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddAthleteForm from "./AddAthleteForm";
import DeleteAthleteButton from "./DeleteAthleteButton";
import EditAthleteName from "./EditAthleteName";
import InviteLinkPanel from "./InviteLinkPanel";
import HardDeleteAthleteButton from "./HardDeleteAthleteButton";
import BlockAthleteButton from "./BlockAthleteButton";

export const dynamic = "force-dynamic";

function initialsFromName(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  const a = parts[0][0] || "";
  const b = parts[parts.length - 1][0] || "";
  return (a + b).toUpperCase();
}

// ✅ Largura fixa por coluna de ação (alinhamento perfeito entre linhas)
const ACTION_W = 124;

// ✅ Estilo base para ações neutras (Editar/Medições/Bloquear)
const ACTION_NEUTRAL_STYLE = {
  width: ACTION_W,
  height: 34,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 10,
  padding: "6px 10px",
  fontWeight: 700,
  fontSize: 14,
  lineHeight: "20px",
  whiteSpace: "nowrap",
  border: "1px solid rgba(255,255,255,0.20)",
  background: "rgba(255,255,255,0.08)",
  color: "inherit",
  textDecoration: "none",
} as const;

export default async function AthletesPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return <div>Não autenticado.</div>;
  }

  const userId = userData.user.id;

  const { data: athletes, error } = await supabase
    .from("athletes")
    .select("id, name, created_at, owner_id, coach_id, is_blocked, avatar_path")
    .order("created_at", { ascending: false })
    .limit(50);

  // ✅ Signed URLs: atleta via convite -> profiles.avatar_path (fonte da verdade)
  //               fictício -> athletes.avatar_path (quando existir)
  const avatarUrlByAthleteId = new Map<string, string>();

  const invitedOwnerIds = Array.from(
    new Set(
      (athletes ?? [])
        .filter((a: any) => !!a?.coach_id && a?.owner_id && a.owner_id !== userId)
        .map((a: any) => a.owner_id)
    )
  ) as string[];

  const profileAvatarPathByOwnerId = new Map<string, string>();

  if (invitedOwnerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, avatar_path")
      .in("id", invitedOwnerIds);

    (profiles ?? []).forEach((p: any) => {
      if (p?.id && p?.avatar_path) profileAvatarPathByOwnerId.set(p.id, p.avatar_path);
    });
  }

  await Promise.all(
    (athletes ?? []).map(async (a: any) => {
      const isRealInvited = !!a?.coach_id && a?.owner_id && a.owner_id !== userId;

      const path = isRealInvited
        ? profileAvatarPathByOwnerId.get(a.owner_id)
        : a?.avatar_path;

      if (!path) return;

      const { data: signed } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 10);

      if (signed?.signedUrl) {
        avatarUrlByAthleteId.set(a.id, signed.signedUrl);
      }
    })
  );

  return (
    <div>
      <h2>Atletas</h2>

      <InviteLinkPanel />

      <AddAthleteForm />

      <div style={{ marginTop: 16, opacity: 0.85 }}>
        {error ? (
          <p>Erro ao carregar atletas: {error.message}</p>
        ) : (
          <p>Total carregado: {athletes?.length ?? 0}</p>
        )}
      </div>

      <ul style={{ marginTop: 12, padding: 0, listStyle: "none" }}>
        {(athletes ?? []).map((a: any) => {
          const isRealInvited = !!a.coach_id && a.owner_id !== userId;

          const avatarUrl = avatarUrlByAthleteId.get(a.id) ?? null;
          const initials = initialsFromName(a.name);

          return (
            <li
              key={a.id}
              style={{
                marginBottom: 14,
                padding: 14,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {/* ESQUERDA: avatar + nome + info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 260 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                    aria-label="Avatar do atleta"
                    title={a.name}
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={`avatar ${a.name}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.85 }}>{initials}</span>
                    )}
                  </div>

                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>{a.name}</div>
                    <div style={{ opacity: 0.7, fontSize: 12, lineHeight: 1.2 }}>
                      {isRealInvited ? "Atleta (via convite)" : "Atleta (fictício)"} ·{" "}
                      {new Date(a.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>

                {/* DIREITA: ações em 3 colunas fixas (alinha todas as linhas) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `${ACTION_W}px ${ACTION_W}px ${ACTION_W}px`,
                    gap: 12,
                    alignItems: "center",
                    justifyContent: "end",
                  }}
                >
                  {/* Coluna 1: Editar (ou placeholder invisível no convidado) */}
                  {!isRealInvited ? (
                    <EditAthleteName athleteId={a.id} initialName={a.name} />
                  ) : (
                    <span aria-hidden style={{ width: ACTION_W, height: 34, visibility: "hidden" }}>
                      —
                    </span>
                  )}

                  {/* Coluna 2: Medições (botão-link padronizado) */}
                  <Link href={`/dashboard/athletes/${a.id}/measurements`} style={ACTION_NEUTRAL_STYLE}>
                    Medições
                  </Link>

                  {/* Coluna 3: Deletar (vermelho já vem do componente) */}
                  {isRealInvited ? (
                    <>
                      {/* Bloquear fica no lugar do "Editar" para convidados? NÃO.
                          A gente mantém 3 colunas fixas e o "Bloquear" entra no fluxo do convidado no lugar do Editar? 
                          Você pediu 3 botões alinhados — então, no convidado:
                          Coluna 1 (placeholder), Coluna 2 (Medições), Coluna 3 (Deletar) e o Bloquear entra? 
                          Melhor: Bloquear substitui o placeholder e mantém alinhamento. */}
                    </>
                  ) : null}

                  {/* ✅ Ajuste: para convidado, queremos 3 botões também (Medições | Bloquear | Deletar)
                      então vamos sobrescrever o grid abaixo: */}
                  {isRealInvited ? (
                    <>
                      {/* Re-render do bloco de ações para convidado com 3 botões reais */}
                      <div style={{ display: "contents" }}>
                        <BlockAthleteButton athleteId={a.id} athleteName={a.name} initialBlocked={!!a.is_blocked} />
                        <HardDeleteAthleteButton athleteId={a.id} athleteName={a.name} />
                      </div>
                    </>
                  ) : (
                    <DeleteAthleteButton athleteId={a.id} athleteName={a.name} />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
