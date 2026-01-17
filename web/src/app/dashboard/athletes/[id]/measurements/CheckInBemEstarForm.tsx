"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const OPCOES_FADIGA: Array<[number, string]> = [
  [5, "Muito Descansado"],
  [4, "Descansado"],
  [3, "Normal"],
  [2, "Cansado"],
  [1, "Muito Cansado"],
];

const OPCOES_SONO: Array<[number, string]> = [
  [5, "Sono Tranquilo"],
  [4, "Boa"],
  [3, "Dificuldade"],
  [2, "Sono Agitado"],
  [1, "Insônia"],
];

const OPCOES_DOR_MUSCULAR: Array<[number, string]> = [
  [5, "Sentindo-se Ótimo"],
  [4, "Sentindo-se Bem"],
  [3, "Normal"],
  [2, "Dolorido"],
  [1, "Muito Dolorido"],
];

const OPCOES_ESTRESSE: Array<[number, string]> = [
  [5, "Muito Relaxado"],
  [4, "Relaxado"],
  [3, "Normal"],
  [2, "Estressado"],
  [1, "Muito Estressado"],
];

const OPCOES_HUMOR: Array<[number, string]> = [
  [5, "Muito Positivo"],
  [4, "Bom Humor"],
  [3, "Menos Interessado"],
  [2, "Mal Humorado"],
  [1, "Muito Irritado"],
];

const FASES_CICLO = ["Fase Menstrual", "Fase Folicular", "Fase Ovulatória", "Fase Lútea"] as const;
const INTENSIDADES_DOR = ["Sem dor", "Leve", "Moderada", "Intensa", "Severa"] as const;

function SelectEscala({
  label,
  value,
  onChange,
  opcoes,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  opcoes: Array<[number, string]>;
}) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
        {opcoes.map(([n, d]) => (
          <option key={n} value={String(n)} style={{ color: "#000" }}>
            {n} — {d}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function CheckInBemEstarForm({
  athleteId,
  athleteSexo,
}: {
  athleteId: string;
  athleteSexo: string;
}) {
  const router = useRouter();
  const sexo = (athleteSexo || "").toLowerCase();
  const isFeminino = sexo === "feminino";

  const [pesoKg, setPesoKg] = useState("");

  // defaults “neutros” (não ficam vazios)
  const [fadiga, setFadiga] = useState("3");
  const [sono, setSono] = useState("3");
  const [dor, setDor] = useState("3");
  const [estresse, setEstresse] = useState("3");
  const [humor, setHumor] = useState("3");

  const [fase, setFase] = useState<string>("");
  const [intensidade, setIntensidade] = useState<string>("");

  const precisaIntensidade = useMemo(() => {
    return fase === "Fase Menstrual" || fase === "Fase Ovulatória" || fase === "Fase Lútea";
  }, [fase]);

  // ✅ Prontidão automática (média simples 1–5)
  const prontidao = useMemo(() => {
    const v =
      (Number(fadiga) + Number(sono) + Number(dor) + Number(estresse) + Number(humor)) / 5;
    return Math.round(v * 10) / 10; // 1 casa decimal
  }, [fadiga, sono, dor, estresse, humor]);

  const [msg, setMsg] = useState<string>("");

  function friendlyErrorMessage(raw: string) {
    const s = raw.toLowerCase();

    if (s.includes("duplicate key") || s.includes("unique") || s.includes("checkins_bem_estar_unique")) {
      return "Você já tem um check-in de bem-estar para hoje. Vamos atualizar o mesmo registro.";
    }
    if (s.includes("fase") && s.includes("obrig")) {
      return "Fase do ciclo menstrual é obrigatória para atletas do sexo feminino.";
    }
    if (s.includes("intensidade") && s.includes("obrig")) {
      return "Nível de intensidade da dor é obrigatório para esta fase do ciclo.";
    }
    return raw;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    const peso = Number(pesoKg.replace(",", "."));
    if (!Number.isFinite(peso) || peso <= 0) {
      setMsg("Peso inválido.");
      return;
    }

    if (isFeminino) {
      if (!fase) {
        setMsg("Selecione a Fase do ciclo menstrual (obrigatório).");
        return;
      }
      if (precisaIntensidade && !intensidade) {
        setMsg("Selecione o Nível de intensidade da dor (obrigatório para esta fase).");
        return;
      }
    }

    setMsg("Salvando...");

    const payload: any = {
      athlete_id: athleteId,
      peso_kg: peso,
      fadiga: Number(fadiga),
      qualidade_sono: Number(sono),
      dor_muscular: Number(dor),
      nivel_estresse: Number(estresse),
      humor: Number(humor),
      fase_ciclo_menstrual: isFeminino ? fase : null,
      intensidade_dor: isFeminino && precisaIntensidade ? intensidade : null,
    };

    // ✅ 1 registro por dia (atualiza o mesmo ao salvar novamente)
    // Requer UNIQUE (athlete_id, data_local) no banco (que você já tem/quer).
    const { error } = await supabase
      .from("checkins_bem_estar")
      .upsert(payload, { onConflict: "athlete_id,data_local" });

    const raw = (error.message || "").toLowerCase();

  // Quando o atleta está bloqueado, o RLS dispara exatamente esse tipo de erro
  if (raw.includes("row-level security") || raw.includes("violates row-level security")) {
    setMsg("Acesso suspenso pelo coach. Fale com ele para reativar.");
    return;
  }

  setMsg(`Erro ao salvar: ${friendlyErrorMessage(error.message)}`);
  return;
}

    setMsg("Salvo ✅");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: 14 }}
    >
      <h3 style={{ marginTop: 0 }}>Check-in Bem-Estar</h3>

      <label style={{ display: "block", marginBottom: 14 }}>
        <div style={{ marginBottom: 6, fontWeight: 600 }}>Peso (kg) (obrigatório)</div>
        <input
          value={pesoKg}
          onChange={(e) => setPesoKg(e.target.value)}
          placeholder="ex.: 75,2"
          inputMode="decimal"
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <SelectEscala label="Fadiga (1–5)" value={fadiga} onChange={setFadiga} opcoes={OPCOES_FADIGA} />
        <SelectEscala label="Qualidade do Sono (1–5)" value={sono} onChange={setSono} opcoes={OPCOES_SONO} />
        <SelectEscala label="Dor Muscular (1–5)" value={dor} onChange={setDor} opcoes={OPCOES_DOR_MUSCULAR} />
        <SelectEscala label="Nível de Estresse (1–5)" value={estresse} onChange={setEstresse} opcoes={OPCOES_ESTRESSE} />
        <SelectEscala label="Humor (1–5)" value={humor} onChange={setHumor} opcoes={OPCOES_HUMOR} />
      </div>

      {/* ✅ Prontidão automática */}
      <div style={{ marginTop: 12, opacity: 0.9 }}>
        <b>Prontidão (média):</b> {prontidao}
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
          Calculado automaticamente como a média de Fadiga, Sono, Dor, Estresse e Humor.
        </div>
      </div>

      {isFeminino && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            <label style={{ display: "block" }}>
              <div style={{ marginBottom: 6, fontWeight: 600 }}>Ciclo menstrual (obrigatório)</div>
              <select
                value={fase}
                onChange={(e) => setFase(e.target.value)}
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
                {FASES_CICLO.map((f) => (
                  <option key={f} value={f} style={{ color: "#000" }}>
                    {f}
                  </option>
                ))}
              </select>
            </label>

            {precisaIntensidade && (
              <label style={{ display: "block" }}>
                <div style={{ marginBottom: 6, fontWeight: 600 }}>Nível de intensidade da dor (obrigatório)</div>
                <select
                  value={intensidade}
                  onChange={(e) => setIntensidade(e.target.value)}
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
                  {INTENSIDADES_DOR.map((d) => (
                    <option key={d} value={d} style={{ color: "#000" }}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
      )}

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
        Salvar check-in (Bem-Estar)
      </button>

      {msg && <p style={{ marginTop: 10, opacity: 0.9 }}>{msg}</p>}
    </form>
  );
}
