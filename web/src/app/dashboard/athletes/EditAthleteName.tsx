"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const BTN_SMALL = {
  height: 32,
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

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} style={BTN_NEUTRAL}>
        Editar
      </button>
    );
  }

  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{
          height: 32,
          borderRadius: 10,
          padding: "6px 10px",
          border: "1px solid rgba(255,255,255,0.20)",
          background: "rgba(255,255,255,0.04)",
          color: "inherit",
          minWidth: 180,
        }}
      />
      <button type="button" onClick={save} disabled={loading} style={{ ...BTN_SMALL, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Salvando..." : "Salvar"}
      </button>
      <button type="button" onClick={cancel} disabled={loading} style={{ ...BTN_SMALL, opacity: loading ? 0.6 : 1 }}>
        Cancelar
      </button>
    </span>
  );
}
