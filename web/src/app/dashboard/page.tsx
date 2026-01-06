import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Dashboard</h1>
        <SignOutButton />
      </div>

      <p>Autenticado ✅</p>

      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify({ email: data.user.email, id: data.user.id }, null, 2)}
      </pre>
    </div>
  );
}
