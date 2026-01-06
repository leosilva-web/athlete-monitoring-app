import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Dashboard</h1>
      <p>Autenticado ✅</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify({ email: data.user.email, id: data.user.id }, null, 2)}
      </pre>
    </div>
  );
}
