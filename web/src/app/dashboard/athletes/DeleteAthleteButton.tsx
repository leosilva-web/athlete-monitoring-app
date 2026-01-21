"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ACTION_W = 124;

const BTN_DANGER = {
  width: ACTION_W,
  height: 34,
  borderRadius: 10,
  padding: "6px 10px",
  fontWeight: 700,
  fontSize: 14,
  lineHeight: "20px",
  whiteSpace: "nowrap",
  border: "1px solid rgba(255,80,80,0.35)",
  background: "rgba(255,80,80,0.10)",
  color: "inherit",
  cursor: "pointer",
} as const;

export default function DeleteAthleteButton({
  athleteId,
  athleteName,
}: {
  athleteId: string;
  athleteName: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    const ok = confirm(`Deletar "${athleteName}"?\n\nEssa ação não pode ser desfeita.`);
    if (!ok) return;

    setLoading(true);

    const { data, error } = await supabase.from("athletes").delete().eq("id", athleteId).select("id");

    setLoading(false);

    if (error) {
      alert(`Erro ao deletar: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      alert("Não foi possível deletar: sem permissão (RLS) ou atleta não encontrado.");
      return;
    }

    router.refresh();
  }

  return (
    <button type="button" onClick={onDelete} disabled={loading} style={{ ...BTN_DANGER, opacity: loading ? 0.6 : 1 }}>
      {loading ? "Deletando..." : "Deletar"}
    </button>
  );
}
