"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HardDeleteAthleteButton({
  athleteId,
  athleteName,
}: {
  athleteId: string;
  athleteName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onHardDelete() {
    // 1) Confirmação forte (duas etapas)
    const ok = confirm(
      `DELETAR DEFINITIVAMENTE "${athleteName}"?\n\nIsso apaga TODOS os dados e a conta do atleta.\nNão pode ser desfeito.`
    );
    if (!ok) return;

    const typed = prompt(`Para confirmar, digite APAGAR (em maiúsculas):`);
    if (typed !== "APAGAR") return;

    setLoading(true);

    try {
      const res = await fetch(`/api/athletes/${athleteId}/hard-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        let msg = "Falha ao deletar definitivamente.";
        try {
          const j = await res.json();
          msg = j?.error ? `${msg} ${j.error}` : msg;
          if (j?.details) msg += `\n\nDetalhes: ${String(j.details)}`;
        } catch {
          // ignore
        }
        alert(msg);
        return;
      }

      alert("Atleta deletado definitivamente.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onHardDelete}
      disabled={loading}
      style={{
        opacity: loading ? 0.6 : 1,
        border: "1px solid rgba(255,80,80,0.35)",
        background: "rgba(255,80,80,0.10)",
        borderRadius: 10,
        padding: "6px 10px",
        fontWeight: 700,
      }}
      title="Apaga tudo (dados + conta). Irreversível."
    >
      {loading ? "Deletando..." : "Deletar"}
    </button>
  );
}
