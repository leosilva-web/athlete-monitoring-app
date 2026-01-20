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

export default async function AthletesPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return <div>Não autenticado.</div>;
  }

  const userId = userData.user.id;

  // ✅ Agora buscamos avatar_path DIRETO da tabela athletes (fonte para o dashboard do coach)
  const { data: athletes, error } = await supabase
    .from("athletes")
    .select("id, name, created_at, owner_id, coach_id, is_blocked, avatar_path")
    .order("created_at", { ascending: false })
    .limit(50);

  // ✅ Gerar signed URLs do bucket privado "avatars"
  const avatarUrlByAthleteId = new Map<string, string>();

  // ✅ Debug mínimo e seguro (só em DEV)
  const isDev = process.env.NODE_ENV !== "production";
  const avatarDebugByAthleteId = new Map<string, string>();

  // 1) Para atletas reais (via convite): foto vem do profiles.avatar_path (fonte da verdade do atleta)
  const invitedOwnerIds = Array.from(
    new Set(
      (athletes ?? [])
        .filter((a: any) => !!a?.coach_id && a?.owner_id && a.owner_id !== userId)
        .map((a: any) => a.owner_id)
    )
  ) as string[];

  const profileAvatarPathByOwnerId = new Map<string, string>();

  if (invitedOwnerIds.length > 0) {
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, avatar_path")
      .in("id", invitedOwnerIds);

    if (profErr) {
      // não quebra a página; só registra debug
      if (isDev) {
        (athletes ?? []).forEach((a: any) => {
          const isRealInvited = !!a?.coach_id && a?.owner_id && a.owner_id !== userId;
          if (isRealInvited) avatarDebugByAthleteId.set(a.id, `profiles erro: ${profErr.message}`);
        });
      }
    }

    (profiles ?? []).forEach((p: any) => {
      if (p?.id && p?.avatar_path) profileAvatarPathByOwnerId.set(p.id, p.avatar_path);
    });
  }

  // 2) Gerar signed URLs:
  //    - Real (via convite): usa profiles.avatar_path
  //    - Fictício: usa athletes.avatar_path (quando existir)
  await Promise.all(
    (athletes ?? []).map(async (a: any) => {
      const isRealInvited = !!a?.coach_id && a?.owner_id && a.owner_id !== userId;

      const path = isRealInvited
        ? profileAvatarPathByOwnerId.get(a.owner_id)
        : a?.avatar_path;

      if (!path) {
        if (isDev) {
          avatarDebugByAthleteId.set(
            a.id,
            isRealInvited
              ? "sem avatar_path em profiles (ou não liberou SELECT)"
              : "sem avatar_path em athletes"
          );
        }
        return;
      }

      const { data: signed, error: signedErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 10);

      if (signedErr) {
        if (isDev) {
          avatarDebugByAthleteId.set(a.id, `signedUrl erro: ${signedErr.message} | path=${path}`);
        }
        return;
      }

      if (!signed?.signedUrl) {
        if (isDev) avatarDebugByAthleteId.set(a.id, `signedUrl vazio | path=${path}`);
        return;
      }

      avatarUrlByAthleteId.set(a.id, signed.signedUrl);
      if (isDev) avatarDebugByAthleteId.set(a.id, `ok | path=${path}`);
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

      {/* ✅ remove recuo e bullets para padronizar alinhamento */}
      <ul style={{ marginTop: 12, padding: 0, listStyle: "none" }}>
        {(athletes ?? []).map((a: any) => {
          // "Real" (via convite): tem coach_id e owner_id não é o coach
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

                    {/* ✅ Debug mínimo: só em DEV */}
                    {isDev && (
                      <div style={{ opacity: 0.7, fontSize: 11, lineHeight: 1.2 }}>
                        avatar-debug: {avatarDebugByAthleteId.get(a.id) ?? "-"}
                      </div>
                    )}
                  </div>
                </div>

                {/* DIREITA: ações */}
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  {/* Editar nome: SOMENTE atleta fictício */}
                  {!isRealInvited ? <EditAthleteName athleteId={a.id} initialName={a.name} /> : null}

                  <Link href={`/dashboard/athletes/${a.id}/measurements`} style={{ opacity: 0.9 }}>
                    Medições
                  </Link>

                  {isRealInvited ? (
                    <>
                      <BlockAthleteButton athleteId={a.id} athleteName={a.name} initialBlocked={!!a.is_blocked} />
                      <HardDeleteAthleteButton athleteId={a.id} athleteName={a.name} />
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
