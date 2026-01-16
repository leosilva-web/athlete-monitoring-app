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

      // 3) acha o athlete do user (owner_id = auth.uid) e fallback (id = auth.uid)
      const { data: a1 } = await supabase
        .from("athletes")
        .select("id, coach_id")
        .eq("owner_id", user.id)
        .maybeSingle();

      const { data: a2 } = a1
        ? { data: null as any }
        : await supabase
            .from("athletes")
            .select("id, coach_id")
            .eq("id", user.id)
            .maybeSingle();

      const athlete = a1 ?? a2;
      const coachId = athlete?.coach_id;

      if (!coachId) return;

      // 4) tenta pegar nome do coach no profiles (ideal)
      let coachName: string | null = null;

      const { data: coachProf } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", coachId)
        .maybeSingle();

      coachName = (coachProf?.full_name || "").trim() || null;

      // 5) fallback: pega nome do coach em athletes (muito mais “à prova” de RLS)
      if (!coachName) {
        const { data: coachAth } = await supabase
          .from("athletes")
          .select("name")
          .eq("id", coachId)
          .maybeSingle();

        coachName = (coachAth?.name || "").trim() || null;
      }

      if (!coachName) coachName = "seu coach";

      const finalText = `Conta vinculada • Monitorado por ${coachName} (Coach)`;

      if (alive) setText(finalText);
    }

    run();

    return () => {
      alive = false;
    };
  }, [supabase]);

  if (!text) return null;

  // pequeno e discreto, central superior
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
