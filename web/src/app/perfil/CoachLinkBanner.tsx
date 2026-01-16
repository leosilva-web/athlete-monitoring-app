"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CoachLinkBanner() {
  const supabase = createClient();
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      // auth
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      // só atleta vê
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (myProfile?.role !== "athlete") return;

      // acha o athlete do user (owner_id ou id)
      const { data: a1 } = await supabase
        .from("athletes")
        .select("coach_id")
        .eq("owner_id", user.id)
        .maybeSingle();

      const { data: a2 } = a1
        ? { data: null as any }
        : await supabase
            .from("athletes")
            .select("coach_id")
            .eq("id", user.id)
            .maybeSingle();

      const coachId = (a1 ?? a2)?.coach_id as string | null;
      if (!coachId) return;

      // ✅ pega o nome do coach em PROFILES (athlete não tem permissão pra ler athletes do coach)
      const { data: coachProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", coachId)
        .maybeSingle();

      const coachName = (coachProfile?.full_name || "").trim() || "seu coach";

      if (!alive) return;
      setText(`Conta vinculada • Monitorado por ${coachName} (Coach)`);
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
        position: "fixed",
        left: "50%",
        top: 12,
        transform: "translateX(-50%)",
        zIndex: 50,
        padding: "8px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        fontSize: 12,
        opacity: 0.9,
        maxWidth: 880,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
      aria-label="Conta vinculada ao coach"
      title={text}
    >
      {text}
    </div>
  );
}
