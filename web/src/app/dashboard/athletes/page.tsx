import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AddAthleteForm from "./AddAthleteForm";
import DeleteAthleteButton from "./DeleteAthleteButton";
import EditAthleteName from "./EditAthleteName";
import InviteLinkPanel from "./InviteLinkPanel";

export default async function AthletesPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return <div>Não autenticado.</div>;
  }

  const { data: athletes, error } = await supabase
    .from("athletes")
    .select("id, owner_id, name, is_blocked, created_at")
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
        {(athletes ?? []).map((a) => (
          <li
            key={a.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "6px 0",
            }}
          >
            <div>
              <EditAthleteName athleteId={a.id} initialName={a.name} />
              <span style={{ opacity: 0.7, fontSize: 12, marginLeft: 8 }}>
                ({new Date(a.created_at).toLocaleString()})
              </span>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link
                href={`/dashboard/athletes/${a.id}/measurements`}
                style={{
                  padding: "6px 10px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8,
                  textDecoration: "none",
                }}
              >
                Medições
              </Link>

              <DeleteAthleteButton athleteId={a.id} athleteName={a.name} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
