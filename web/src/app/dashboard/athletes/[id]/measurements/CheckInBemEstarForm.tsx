"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const OPCOES_1_A_5 = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
];

const FASES_CICLO = [
  "Menstruação",
  "Fase folicular",
  "Ovulação",
  "Fase lútea",
  "TPM",
] as const;

const INTENSIDADES_DOR = [
  "Sem dor",
  "Leve",
  "Moderada",
  "Forte",
  "Muito forte",
] as const;

function isRlsError(message: string) {
  const m = (message || "").toLowerCase();
  return (
    m.includes("row-level security") ||
    m.includes("violates row-level security") ||
    m.includes("rls") ||
    m.includes("policy")
  );
}

function friendlyErrorMessage(message: string) {
  const m = message || "";
  if (isRlsError(m)) return "Acesso suspenso. Fale com seu treinador.";
  return m;
}

function mapSexo(value: any) {
  const v = String(value ?? "")
    .toLowerCase()
    .trim();
  if (!v) return { isFeminino: false };
  if (v === "f" || v === "feminino" || v === "female" || v === "mulher") return { isFeminino: true };
  return { isFeminino: false };
}

function getLocalDateTime(tz: string | null | undefined) {
  // Usa Intl para produzir data/hora no timezone IANA do atleta.
  // Se tz for inválido, cai no horário local do servidor/navegador.
  const now = new Date();
  try {
    const timeZone = tz || undefined;

    const dateParts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);

    const y = dateParts.find((p) => p.type === "year")?.value || "0000";
    const mo = dateParts.find((p) => p.type === "month")?.value || "00";
    const d = dateParts.find((p) => p.type === "day")?.value || "00";

    const timeStr = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);

    return { data_local: `${y}-${mo}-${d}`, hora_local: timeStr };
  } catch {
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = now.getFullYear();
    const mo = pad(now.getMonth() + 1);
    const d = pad(now.getDate());
    const hh = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    return { data_local: `${y}-${mo}-${d}`, hora_local: `${hh}:${mm}:${ss}` };
  }
}

function SelectEscala({
  label,
  value,
  onChange,
  opcoes,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  opcoes: { value: string; label: string }[];
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
      >
        {opcoes.map((o) => (
          <option key={o.value} value={o.value} style={{ color: "#000" }}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function CheckInBemEstarForm(props: any) {
  const router = useRouter();
  const supabase = createClient();

  // Aceita variações de props pra não quebrar chamadas existentes:
  const athleteId: string = props?.athleteId ?? props?.athlete_id ?? props?.id ?? "";
  const sexo: any = props?.sexo ?? props?.gender ?? null;
  const timezone: string | null = props?.timezone ?? props?.tz ?? null;

  const { isFeminino } = mapSexo(sexo);

  const [pesoKg, setPesoKg] = useState("");
  const [fadiga, setFadiga] = useState("3");
  const [sono, setSono] = useState("3");
  const [dor, setDor] = useState("3");
  const [estresse, setEstresse] = useState("3");
  const [humor, setHumor] = useState("3");

  const [fase, setFase] = useState("");
  const [intensidade, setIntensidade] = useState("");

  const [msg, setMsg] = useState<string | null>(null);

  const prontidao = useMemo(() => {
    const nums = [fadiga, sono, dor, estresse, humor].map((v) => Number(v || 0));
    const valid = nums.every((n) => Number.isFinite(n) && n > 0);
    if (!valid) return "-";
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return avg.toFixed(1);
  }, [fadiga, sono, dor, estresse, humor]);

  const precisaIntensidade = useMemo(() => {
    // Ajuste a regra conforme quiser. Mantive simples: pede intensidade quando houver "Menstruação" ou "TPM".
    if (!isFeminino) return false;
    return fase === "Menstruação" || fase === "TPM";
  }, [fase, isFeminino]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!athleteId) {
      setMsg("Erro: athleteId ausente.");
      return;
    }

    const peso = Number(String(pesoKg).replace(",", "."));
    if (!Number.isFinite(peso) || peso <= 0) {
      setMsg("Informe um peso válido (ex.: 75,2).");
      return;
    }

    if (isFeminino) {
      if (!fase) {
        setMsg("Selecione a fase do ciclo menstrual (obrigatório).");
        return;
      }
      if (precisaIntensidade && !intensidade) {
        setMsg("Selecione o nível de intensidade da dor (obrigatório para esta fase).");
        return;
      }
    }

    setMsg("Salvando...");

    const { data_local, hora_local } = getLocalDateTime(timezone);

    const payload: any = {
      athlete_id: athleteId,
      data_local,
      hora_local,
      peso_kg: peso,
      fadiga: Number(fadiga),
      qualidade_sono: Number(sono),
      dor_muscular: Number(dor),
      nivel_estresse: Number(estresse),
      humor: Number(humor),
      fase_ciclo_menstrual: isFeminino ? fase : null,
      intensidade_dor: isFeminino && precisaIntensidade ? intensidade : null,
    };

    // 1 registro por dia (se já existir, atualiza)
    const { error } = await supabase
      .from("checkins_bem_estar")
      .upsert(payload, { onConflict: "athlete_id,data_local" });

    if (error) {
      setMsg(`Erro ao salvar: ${friendlyErrorMessage(error.message)}`);
      return;
    }

    setMsg("Salvo.");
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
        <SelectEscala label="Fadiga (1–5)" value={fadiga} onChange={setFadiga} opcoes={OPCOES_1_A_5} />
        <SelectEscala label="Qualidade do Sono (1–5)" value={sono} onChange={setSono} opcoes={OPCOES_1_A_5} />
        <SelectEscala label="Dor Muscular (1–5)" value={dor} onChange={setDor} opcoes={OPCOES_1_A_5} />
        <SelectEscala label="Nível de Estresse (1–5)" value={estresse} onChange={setEstresse} opcoes={OPCOES_1_A_5} />
        <SelectEscala label="Humor (1–5)" value={humor} onChange={setHumor} opcoes={OPCOES_1_A_5} />
      </div>

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
