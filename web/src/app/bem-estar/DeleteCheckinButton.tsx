"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteCheckinButton({ checkinId }: { checkinId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    const ok = confirm("Excluir este registro? Essa ação não pode ser desfeita.");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/checkins/bem-estar/${checkinId}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(`Erro ao excluir: ${json?.error || "erro"} ${json?.details ? `(${json.details})` : ""}`);
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
        background: "rgba(255,80,80,0.15)",
        color: "inherit",
        cursor: "pointer",
        fontWeight: 700,
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "Excluindo..." : "Excluir"}
    </button>
  );
}
