"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditAthleteName({
  athleteId,
  initialName,
}: {
  athleteId: string;
  initialName: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  const btnStyle: React.CSSProperties = {
    height: 36,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "inherit",
    fontWeight: 700,
    fontSize: 14,
    lineHeight: "20px",
    whiteSpace: "nowrap",
    cursor: "pointer",
  };

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      alert("Nome não pode ficar vazio.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("athletes").update({ name: trimmed }).eq("id", athleteId);

    setLoading(false);

    if (error) {
      alert(`Erro ao salvar: ${error.message}`);
      return;
    }

    setEditing(false);
    router.refresh();
  }

  function cancel() {
    setName(initialName);
    setEditing(false);
  }

  // ✅ Quando não estiver editando, NÃO mostra o nome (evita duplicar).
  // Só mostra o botão "Editar".
  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} style={btnStyle}>
        Editar
      </button>
    );
  }

  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{
          padding: "8px 10px",
          height: 36,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "transparent",
          color: "inherit",
          minWidth: 180,
        }}
      />

      <button
        type="button"
        onClick={save}
        disabled={loading}
        style={{ ...btnStyle, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Salvando..." : "Salvar"}
      </button>

      <button
        type="button"
        onClick={cancel}
        disabled={loading}
        style={{ ...btnStyle, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
      >
        Cancelar
      </button>
    </span>
  );
}
