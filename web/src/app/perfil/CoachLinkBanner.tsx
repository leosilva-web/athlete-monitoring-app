"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CoachLinkBanner() {
  const supabase = createClient();
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      // 1) precisa estar logado
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      const user = auth?.user;
      if (authErr || !user) return;

      // 2) só mostra para atleta
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profErr) return;
      if (prof?.role !== "athlete") return;

      // 3) pega nome do coach via RPC (bypass RLS com validação por auth.uid)
      const { data: coachName, error: rpcErr } = await supabase.rpc("get_my_coach_name");

      if (rpcErr) return;
      const name = (coachName || "").trim();
      if (!name) return;

      const finalText = `Conta vinculada • Monitorado por ${name} (Coach)`;
      if (alive) setText(finalText);
    }

    run();
    return () => {
      alive = false;
    };
  }, [supabase]);

  if (!text) return null;

  return (
    <div
      style={{
        marginTop: 10,
        textAlign: "center",
        fontSize: 12,
        opacity: 0.8,
      }}
      aria-label="Conta vinculada ao coach"
    >
      {text}
    </div>
  );
}
