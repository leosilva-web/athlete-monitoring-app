"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const TIPOS_TREINO = [
  "Treino de Força",
  "Cardio",
  "Treino Técnico",
  "Treino de Competição",
  "Fisioterapia",
  "Outros",
] as const;

const PSE_OPCOES: Array<[number, string]> = [
  [0, "Descanso"],
  [1, "Muito, muito fácil"],
  [2, "Fácil"],
  [3, "Moderado"],
  [4, "Um pouco difícil"],
  [5, "Difícil"],
  [6, "*"],
  [7, "Muito difícil"],
  [8, "*"],
  [9, "*"],
  [10, "Máxima"],
];

export default function CheckInSessaoTreinoForm({ athleteId }: { athleteId: string }) {
  const router = useRouter();

  const [tipo, setTipo] = useState<string>(TIPOS_TREINO[0]);
  const [minutos, setMinutos] = useState<string>("");
  const [pse, setPse] = useState<string>("");

  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    const min = Number(minutos);
    if (!Number.isFinite(min) || min <= 0) {
      setMsg("Tempo de sessão (min) inválido.");
      return;
    }

    const pseNum = Number(pse);
    if (!Number.isFinite(pseNum) || pse === "" || pseNum < 0 || pseNum > 10) {
      setMsg("PSE-sessão inválida (0 a 10).");
      return;
    }

    setMsg("Salvando...");

    const payload = {
      athlete_id: athleteId,
      tipo_treino: tipo,
      minutos: min,
      pse_sessao: pseNum,
    };

    const { error } = await supabase.from("sessoes_treino").insert(payload);
    if (error) {
      setMsg(`Erro ao salvar: ${error.message}`);
      return;
    }

    setMsg("Salvo ✅");
    setMinutos("");
    setPse("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: 14 }}>
      <h3 style={{ marginTop: 0 }}>Check-in Sessão de Treino</h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <label style={{ display: "block" }}>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>Tipo de treino (obrigatório)</div>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "transparent",
              color: "inherit",
            }}
          >
            {TIPOS_TREINO.map((t) => (
              <option key={t} value={t} style={{ color: "#000" }}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "block" }}>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>Tempo de sessão (min) (obrigatório)</div>
          <input
            value={minutos}
            onChange={(e) => setMinutos(e.target.value)}
            placeholder="ex.: 75"
            inputMode="numeric"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "transparent",
              color: "inherit",
            }}
            required
          />
        </label>

        <label style={{ display: "block" }}>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>PSE-sessão (0–10) (obrigatório)</div>
          <select
            value={pse}
            onChange={(e) => setPse(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "transparent",
              color: "inherit",
            }}
            required
          >
            <option value="" disabled style={{ color: "#000" }}>
              Selecione...
            </option>
            {PSE_OPCOES.map(([n, d]) => (
              <option key={n} value={String(n)} style={{ color: "#000" }}>
                {n} — {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        style={{
          marginTop: 14,
          padding: "10px 14px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.22)",
          background: "rgba(255,255,255,0.10)",
          color: "inherit",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Salvar sessão de treino
      </button>

      {msg && <p style={{ marginTop: 10, opacity: 0.9 }}>{msg}</p>}
    </form>
  );
}
