import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddAthleteForm from "./AddAthleteForm";
import DeleteAthleteButton from "./DeleteAthleteButton";
import EditAthleteName from "./EditAthleteName";
import InviteLinkPanel from "./InviteLinkPanel";
import HardDeleteAthleteButton from "./HardDeleteAthleteButton";
import BlockAthleteButton from "./BlockAthleteButton";

export default async function AthletesPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return <div>Não autenticado.</div>;
  }

  const userId = userData.user.id;

  const { data: athletes, error } = await supabase
    .from("athletes")
    .select("id, name, created_at, owner_id, coach_id, is_blocked")
    .order("created_at", { ascending: false })
    .limit(50);

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

      <ul style={{ marginTop: 12, paddingLeft: 18 }}>
        {(athletes ?? []).map((a: any) => {
          // "Real" (via convite): tem coach_id e owner_id não é o coach
          const isRealInvited = !!a.coach_id && a.owner_id !== userId;

          return (
            <li key={a.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ minWidth: 220 }}>
                  <b>{a.name}</b>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>
                    {isRealInvited ? "Atleta (via convite)" : "Atleta (fictício)"} · {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>

                <EditAthleteName athleteId={a.id} initialName={a.name} />

                <Link href={`/dashboard/athletes/${a.id}/measurements`} style={{ opacity: 0.9 }}>
                  Check-ins
                </Link>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {isRealInvited ? (
                    <>
                      <BlockAthleteButton athleteId={a.id} isBlocked={!!a.is_blocked} />
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
