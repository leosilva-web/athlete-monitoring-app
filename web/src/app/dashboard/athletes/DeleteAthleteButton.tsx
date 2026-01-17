"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    const ok = confirm(`Excluir "${athleteName}"?\n\nEssa ação não pode ser desfeita.`);
    if (!ok) return;

    setLoading(true);

    // IMPORTANTE: usar .select("id") para saber se deletou de verdade.
    const { data, error } = await supabase
      .from("athletes")
      .delete()
      .eq("id", athleteId)
      .select("id");

    setLoading(false);

    if (error) {
      alert(`Erro ao excluir: ${error.message}`);
      return;
    }

    // Se não veio linha deletada, o delete NÃO aconteceu (RLS/sem permissão).
    if (!data || data.length === 0) {
      alert("Não foi possível excluir: sem permissão (RLS) ou atleta não encontrado.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      style={{ opacity: loading ? 0.6 : 1 }}
    >
      {loading ? "Excluindo..." : "Excluir"}
    </button>
  );
}
