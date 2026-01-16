"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CoachLinkBanner() {
  const supabase = createClient();
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      setText(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      // 1) Só mostra para ATHLETE (coach/admin não vê)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "athlete") return;

      // 2) Acha o atleta logado (owner_id = auth.uid) e fallback (id = auth.uid)
      const { data: a1 } = await supabase
        .from("athletes")
        .select("id, owner_id, coach_id")
        .eq("owner_id", user.id)
        .maybeSingle();

      const { data: a2 } = a1
        ? { data: null as any }
        : await supabase
            .from("athletes")
            .select("id, owner_id, coach_id")
            .eq("id", user.id)
            .maybeSingle();

      const athlete = a1 ?? a2;
      const coachId = athlete?.coach_id as string | null;
      if (!coachId) return;

      // 3) Nome do coach vem do PERFIL (profiles.full_name)
      const { data: coachProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", coachId)
        .maybeSingle();

      const coachName =
        (coachProfile?.full_name || "").trim() || "Seu coach";

      if (!alive) return;
      setText(`Conta vinculada • Monitorado por ${coachName} (Coach)`);
    }

    run();

    return () => {
      alive = false;
    };
  }, [supabase]);

  if (!text) return null;

  // Visual: pequeno, discreto, no topo do conteúdo (sem “matar” a página)
  return (
    <div
      style={{
        marginTop: 10,
        marginBottom: 6,
        display: "flex",
        justifyContent: "center",
      }}
      aria-label="Conta vinculada ao coach"
    >
      <div
        style={{
          padding: "8px 12px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          fontSize: 13,
          opacity: 0.9,
          maxWidth: 820,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={text}
      >
        {text}
      </div>
    </div>
  );
}
