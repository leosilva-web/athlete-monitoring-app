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

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      alert("Nome não pode ficar vazio.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("athletes")
      .update({ name: trimmed })
      .eq("id", athleteId);

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
      <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        <b>{initialName}</b>
        <button type="button" onClick={() => setEditing(true)}>
          Editar
        </button>
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: 6 }}
      />
      <button type="button" onClick={save} disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </button>
      <button type="button" onClick={cancel} disabled={loading}>
        Cancelar
      </button>
    </span>
  );
}
