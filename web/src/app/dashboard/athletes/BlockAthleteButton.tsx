"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ACTION_W = 124;

const BTN_NEUTRAL = {
  width: ACTION_W,
  height: 34,
  borderRadius: 10,
  padding: "6px 10px",
  fontWeight: 700,
  fontSize: 14,
  lineHeight: "20px",
  whiteSpace: "nowrap",
  border: "1px solid rgba(255,255,255,0.20)",
  background: "rgba(255,255,255,0.08)",
  color: "inherit",
  cursor: "pointer",
} as const;

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
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={toggleBlock} disabled={loading} style={{ ...BTN_NEUTRAL, opacity: loading ? 0.6 : 1 }}>
      {loading ? "..." : initialBlocked ? "Desbloquear" : "Bloquear"}
    </button>
  );
}
