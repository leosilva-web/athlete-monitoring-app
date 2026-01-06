import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <div>
      <p>Autenticado ✅</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify({ email: data.user?.email, id: data.user?.id }, null, 2)}
      </pre>
    </div>
  );
}
