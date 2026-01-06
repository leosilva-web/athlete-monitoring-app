"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function todayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AddMeasurementForm({ athleteId }: { athleteId: string }) {
  const supabase = createClient();
  const router = useRouter();

  const [date, setDate] = useState<string>(todayISODate());
  const [weightKg, setWeightKg] = useState<string>("");

  // escalas 1-5
  const [fatigue, setFatigue] = useState<number>(3);
  const [sleepQuality, setSleepQuality] = useState<number>(3);
  const [soreness, setSoreness] = useState<number>(3);
  const [stress, setStress] = useState<number>(3);
  const [mood, setMood] = useState<number>(3);

  const [sessionMinutes, setSessionMinutes] = useState<string>("");
  const [sessionRpe, setSessionRpe] = useState<string>("");

  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const trainingLoad = useMemo(() => {
    const min = Number(sessionMinutes);
    const rpe = Number(sessionRpe);
    if (!Number.isFinite(min) || !Number.isFinite(rpe)) return null;
    if (sessionMinutes.trim() === "" || sessionRpe.trim() === "") return null;
    return Math.round(min * rpe);
  }, [sessionMinutes, sessionRpe]);

  async function onSubmit() {
    setMsg("");

    if (!date) {
      setMsg("Escolha uma data.");
      return;
    }

    // weight opcional
    const weight =
      weightKg.trim() === "" ? null : Number(String(weightKg).replace(",", "."));
    if (weightKg.trim() !== "" && !Number.isFinite(weight)) {
      setMsg("Peso inválido.");
      return;
    }

    // minutos opcional
    const minutes = sessionMinutes.trim() === "" ? null : Number(sessionMinutes);
    if (sessionMinutes.trim() !== "" if (sessionMinutes.trim() !== "" && (!Number.isFinite(minutes) || minutes < 0)) {if (sessionMinutes.trim() !== "" && (!Number.isFinite(minutes) || minutes < 0)) { (!Number.isFinite(minutes as number) || (minutes as number) < 0)) {
      setMsg("Tempo de sessão inválido.");
      return;
    }

    // rpe opcional (0-10)
    const rpe = sessionRpe.trim() === "" ? null : Number(sessionRpe);
    if (
      sessionRpe.trim() !== "" &&
      (!Number.isFinite(rpe) || rpe < 0 || rpe > 10)
    ) {
      setMsg("Session-RPE inválido (0 a 10).");
      return;
    }

    setLoading(true);
    setMsg("Salvando...");

    const { error } = await supabase.from("athlete_measurements").insert({
      athlete_id: athleteId,
      date,
      weight_kg: weight,
      fatigue,
      sleep_quality: sleepQuality,
      general_muscle_soreness: soreness,
      stress_levels: stress,
      mood,
      session_time_minutes: minutes,
      session_rpe: rpe,
      // owner_id fica automático (default auth.uid())
    });

    setLoading(false);

    if (error) {
      setMsg(`Erro: ${error.message}`);
      return;
    }

    setMsg("Salvo ✅");

    // opcional: limpar alguns campos
    setWeightKg("");
    setSessionMinutes("");
    setSessionRpe("");

    router.refresh();
  }

  return (
    <div style={{ marginTop: 16, padding: 12, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10 }}>
      <h3 style={{ marginTop: 0 }}>Novo check-in</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label>Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </div>

        <div>
          <label>Peso (kg)</label>
          <input
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="ex: 78.5"
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </div>

        <div>
          <label>Fadiga (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={fatigue}
            onChange={(e) => setFatigue(Number(e.target.value))}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </div>

        <div>
          <label>Qualidade do sono (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={sleepQuality}
            onChange={(e) => setSleepQuality(Number(e.target.value))}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </div>

        <div>
          <label>Dor muscular geral (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={soreness}
            onChange={(e) => setSoreness(Number(e.target.value))}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </div>

        <div>
          <label>Nível de estresse (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={stress}
            onChange={(e) => setStress(Number(e.target.value))}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </div>

        <div>
          <label>Humor (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={mood}
            onChange={(e) => setMood(Number(e.target.value))}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </div>

        <div />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <div>
          <label>Tempo da sessão (min)</label>
          <input
            value={sessionMinutes}
            onChange={(e) => setSessionMinutes(e.target.value)}
            placeholder="ex: 60"
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </div>

        <div>
          <label>Session-RPE (0–10)</label>
          <input
            value={sessionRpe}
            onChange={(e) => setSessionRpe(e.target.value)}
            placeholder="ex: 7"
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </div>
      </div>

      <div style={{ marginTop: 10, opacity: 0.85 }}>
        {trainingLoad !== null && (
          <div>Training Load (min × RPE): <b>{trainingLoad}</b></div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
        <button type="button" onClick={onSubmit} disabled={loading}>
          {loading ? "Salvando..." : "Salvar check-in"}
        </button>
        <span style={{ opacity: 0.85 }}>{msg}</span>
      </div>
    </div>
  );
}
