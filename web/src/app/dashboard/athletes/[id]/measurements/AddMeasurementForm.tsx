"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  athleteId: string;
};

function isIntInRange(n: number, min: number, max: number) {
  return Number.isInteger(n) && n >= min && n <= max;
}

export default function AddMeasurementForm({ athleteId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [date, setDate] = useState(""); // yyyy-mm-dd
  const [weightKg, setWeightKg] = useState("");

  // Escalas 1–5 (obrigatórias)
  const [fatigue, setFatigue] = useState("3");
  const [sleepQuality, setSleepQuality] = useState("3");
  const [generalMuscleSoreness, setGeneralMuscleSoreness] = useState("3");
  const [stressLevels, setStressLevels] = useState("3");
  const [mood, setMood] = useState("3");

  // Sessão (obrigatórias)
  const [sessionMinutes, setSessionMinutes] = useState("");
  const [sessionRpe, setSessionRpe] = useState("");

  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    // DATE obrigatório
    if (date.trim() === "") {
      setMsg("Data do check-in é obrigatória.");
      return;
    }

    // WEIGHT obrigatório (aceita vírgula)
    const weight = Number(weightKg.replace(",", "."));
    if (weightKg.trim() === "" || !Number.isFinite(weight) || weight <= 0) {
      setMsg("Peso inválido. Ex.: 82.5");
      return;
    }

    // Escalas 1–5 obrigatórias
    const f = Number(fatigue);
    const sq = Number(sleepQuality);
    const gms = Number(generalMuscleSoreness);
    const st = Number(stressLevels);
    const md = Number(mood);

    if (!isIntInRange(f, 1, 5)) return setMsg("Fatigue inválido (1 a 5).");
    if (!isIntInRange(sq, 1, 5)) return setMsg("Sleep quality inválido (1 a 5).");
    if (!isIntInRange(gms, 1, 5)) return setMsg("Muscle soreness inválido (1 a 5).");
    if (!isIntInRange(st, 1, 5)) return setMsg("Stress levels inválido (1 a 5).");
    if (!isIntInRange(md, 1, 5)) return setMsg("Mood inválido (1 a 5).");

    // MINUTES obrigatório
    const minutes = Number(sessionMinutes);
    if (sessionMinutes.trim() === "" || !Number.isFinite(minutes) || minutes <= 0) {
      setMsg("Tempo de sessão inválido (minutos > 0).");
      return;
    }

    // RPE obrigatório (0–10)
    const rpe = Number(sessionRpe);
    if (sessionRpe.trim() === "" || !Number.isFinite(rpe) || rpe < 0 || rpe > 10) {
      setMsg("Session-RPE inválido (0 a 10).");
      return;
    }

    setMsg("Salvando...");

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      setMsg("Sessão expirada. Faça login novamente.");
      return;
    }

    const payload = {
      athlete_id: athleteId,
      owner_id: userData.user.id,
      date, // yyyy-mm-dd
      weight_kg: weight,
      fatigue: f,
      sleep_quality: sq,
      general_muscle_soreness: gms,
      stress_levels: st,
      mood: md,
      session_minutes: Math.trunc(minutes),
      session_rpe: rpe,
    };

    const { error } = await supabase.from("athlete_measurements").insert(payload);
    if (error) {
      setMsg(`Erro ao salvar: ${error.message}`);
      return;
    }

    setMsg("Salvo ✅");
    // limpa os campos do dia
    setWeightKg("");
    setSessionMinutes("");
    setSessionRpe("");

    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} style={{ border: "1px solid rgba(255,255,255,0.12)", padding: 12, borderRadius: 10 }}>
      <h3 style={{ marginTop: 0 }}>Novo check-in</h3>

      <div style={{ display: "grid", gap: 10 }}>
        <label>
          Data (obrigatório)
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
            required
          />
        </label>

        <label>
          Peso (kg) (obrigatório)
          <input
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="ex: 82.5"
            style={{ width: "100%", padding: 8, marginTop: 6 }}
            required
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label>
            Fatigue (1–5)
            <select value={fatigue} onChange={(e) => setFatigue(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 6 }}>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </label>

          <label>
            Sleep quality (1–5)
            <select value={sleepQuality} onChange={(e) => setSleepQuality(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 6 }}>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </label>

          <label>
            Muscle soreness (1–5)
            <select value={generalMuscleSoreness} onChange={(e) => setGeneralMuscleSoreness(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 6 }}>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </label>

          <label>
            Stress levels (1–5)
            <select value={stressLevels} onChange={(e) => setStressLevels(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 6 }}>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </label>

          <label>
            Mood (1–5)
            <select value={mood} onChange={(e) => setMood(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 6 }}>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </label>
        </div>

        <label>
          Tempo de sessão (min) (obrigatório)
          <input
            value={sessionMinutes}
            onChange={(e) => setSessionMinutes(e.target.value)}
            placeholder="ex: 75"
            style={{ width: "100%", padding: 8, marginTop: 6 }}
            required
          />
        </label>

        <label>
          Session-RPE (0–10) (obrigatório)
          <input
            value={sessionRpe}
            onChange={(e) => setSessionRpe(e.target.value)}
            placeholder="ex: 7"
            style={{ width: "100%", padding: 8, marginTop: 6 }}
            required
          />
        </label>

        <button type="submit" style={{ padding: "10px 12px", cursor: "pointer" }}>
          Salvar check-in
        </button>

        {msg && <p style={{ margin: 0, opacity: 0.9 }}>{msg}</p>}
      </div>
    </form>
  );
}
