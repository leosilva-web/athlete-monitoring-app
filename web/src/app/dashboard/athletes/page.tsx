import { createClient } from "@/lib/supabase/server";

export default async function AthletesPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <div>
      <h2>Atletas</h2>
      <p>Se você está vendo isso, a rota /dashboard/athletes existe ✅</p>
      <p>
        Usuário atual: <b>{data?.user?.email ?? "sem email"}</b>
      </p>
    </div>
  );
}
