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
        opacity: loading ? 0.6 : 1,
        cursor: loading ? "not-allowed" : "pointer",
        height: 36,
        padding: "0 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.08)", // cinza translúcido
        color: "inherit",
        fontWeight: 700,
        fontSize: 14,
        lineHeight: "20px",
        whiteSpace: "nowrap",
      }}
      title={initialBlocked ? "Liberar acesso do atleta" : "Suspender acesso do atleta"}
    >
      {loading ? "..." : initialBlocked ? "Desbloquear" : "Bloquear"}
    </button>
  );
}
