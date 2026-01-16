"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CoachLinkBanner() {
  const supabase = createClient();
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      // ✅ Só atleta vê o banner
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "athlete") {
        if (alive) setText(null);
        return;
      }

      // ✅ Nome do coach (perfil) via RPC segura
      const { data, error } = await supabase.rpc("get_my_coach_name");
      const coachName =
        (!error && typeof data === "string" && data.trim()) ? data.trim() : "";

      if (!alive) return;

      if (!coachName) {
        // sem vínculo -> não mostra nada
        setText(null);
        return;
      }

      setText(`Conta vinculada • Monitorado por ${coachName} (Coach)`);
    }

    run();

    return () => {
      alive = false;
    };
  }, [supabase]);

  if (!text) return null;

  // ✅ discreto, topo-central, fonte pequena
  return (
    <div
      aria-label="Conta vinculada ao coach"
      style={{
        position: "fixed",
        left: "50%",
        top: 12,
        transform: "translateX(-50%)",
        zIndex: 50,
        padding: "8px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(6px)",
        fontSize: 12,
        opacity: 0.9,
        maxWidth: "92vw",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {text}
    </div>
  );
}
