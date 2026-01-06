import { createClient } from "@/lib/supabase/server";
import AddAthleteForm from "./AddAthleteForm";

export default async function AthletesPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    // o layout já protege, mas deixo por segurança
    return <div>Não autenticado.</div>;
  }

  const { data: athletes, error } = await supabase
    .from("athletes")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <h2>Atletas</h2>

      <AddAthleteForm />

      <div style={{ marginTop: 16, opacity: 0.85 }}>
        {error ? (
          <p>Erro ao carregar atletas: {error.message}</p>
        ) : (
          <p>Total carregado: {athletes?.length ?? 0}</p>
        )}
      </div>

      <ul style={{ marginTop: 12 }}>
        {(athletes ?? []).map((a) => (
          <li key={a.id}>
            <b>{a.name}</b>{" "}
            <span style={{ opacity: 0.7, fontSize: 12 }}>
              ({new Date(a.created_at).toLocaleString()})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
