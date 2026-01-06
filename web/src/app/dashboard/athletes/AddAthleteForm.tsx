"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AddAthleteForm() {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function addAthlete() {
    setMsg("Salvando...");
    const trimmed = name.trim();
    if (!trimmed) {
      setMsg("Digite um nome.");
      return;
    }

    // Se você colocou DEFAULT auth.uid() no owner_id, NÃO precisa enviar owner_id aqui.
    const { error } = await supabase.from("athletes").insert({ name: trimmed });

    if (error) {
      setMsg(`Erro: ${error.message}`);
      return;
    }

    setName("");
    setMsg("Atleta criado ✅");
    router.refresh(); // recarrega a lista server-side
  }

  return (
    <div style={{ marginTop: 12, padding: 12, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          style={{ flex: 1, padding: 8 }}
          placeholder="Nome do atleta"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="button" onClick={addAthlete}>
          Adicionar
        </button>
      </div>

      {msg ? <div style={{ marginTop: 8, opacity: 0.85 }}>{msg}</div> : null}
    </div>
  );
}
