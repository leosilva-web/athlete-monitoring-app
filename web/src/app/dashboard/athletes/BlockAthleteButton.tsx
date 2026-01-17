"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BlockAthleteButton({
  athleteId,
  athleteName,
  initialBlocked,
  onChanged,
}: {
  athleteId: string;
  athleteName: string;
  initialBlocked: boolean;
  onChanged?: (blocked: boolean) => void;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function toggleBlock() {
    const next = !initialBlocked;
    const ok = confirm(
      next
        ? `Bloquear acesso de "${athleteName}"?\n\nEle não conseguirá usar o app até ser desbloqueado.`
        : `Desbloquear acesso de "${athleteName}"?\n\nEle voltará a conseguir usar o app.`
    );
    if (!ok) return;

    setLoading(true);
    try {
      const { error } = await supabase.rpc("set_athlete_blocked", {
        p_athlete_id: athleteId,
        p_blocked: next,
      });

      if (error) {
        alert(`Erro ao ${next ? "bloquear" : "desbloquear"}: ${error.message}`);
        return;
      }

      onChanged?.(next);
      // fallback simples se você não tiver state ainda:
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleBlock}
      disabled={loading}
      style={{
        marginLeft: 8,
        padding: "6px 10px",
        borderRadius: 10,
        border: "1px solid rgba(0,0,0,0.15)",
      }}
    >
      {loading ? "..." : initialBlocked ? "Desbloquear" : "Bloquear"}
    </button>
  );
}
