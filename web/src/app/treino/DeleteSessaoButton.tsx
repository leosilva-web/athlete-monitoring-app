"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteSessaoButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    const ok = confirm("Excluir esta sessão de treino? Essa ação não pode ser desfeita.");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/checkins/treino/${id}`, { method: "DELETE" });

      if (!res.ok) {
        let payload: any = null;
        try {
          payload = await res.json();
        } catch {}
        alert(`Falha ao excluir (${res.status}): ${payload?.error || "erro"}`);
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      style={{
        padding: "6px 10px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.22)",
        background: "rgba(255,255,255,0.08)",
        color: "inherit",
        cursor: loading ? "not-allowed" : "pointer",
        fontWeight: 700,
      }}
      title="Excluir"
    >
      {loading ? "Excluindo..." : "Excluir"}
    </button>
  );
}
