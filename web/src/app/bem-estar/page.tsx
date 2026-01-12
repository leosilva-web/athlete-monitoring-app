"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Wellness = {
  id: string;
  athlete_id: string;
  entry_date: string; // yyyy-mm-dd
  sleep_quality: number | null;
  fatigue: number | null;
  soreness: number | null;
  stress: number | null;
  mood: number | null;
  prs: number | null;
  note: string | null;
  created_at: string;
};

function getLocalISODate(timeZone: string) {
  // Retorna yyyy-mm-dd do "hoje" no fuso do atleta
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(new Date()); // "YYYY-MM-DD" em en-CA
}

function clamp0to10(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(10, n));
}

export default function BemEstarPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [timezone, setTimezone] = useState<string>("America/Fortaleza");
  const [entryDate, setEntryDate] = useState<string>("");

  const [existingId, setExistingId] = useState<string | null>(null);

  // Campos (0–10)
  const [sleepQuality, setSleepQuality] = useState<number>(5);
  const [fatigue, setFatigue] = useState<number>(5);
  const [soreness, setSoreness] = useState<number>(5);
  const [stress, setStress] = useState<number>(5);
  const [mood, setMood] = useState<number>(5);
  const [prs, setPrs] = useState<number>(5);
  const [note, setNote] = useState<string>("");

  const headerLinks = useMemo(
    () => (
      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/inicio">Início</Link>
        <Link href="/bem-estar">Bem-estar</Link>
        <Link href="/treino">Treino</Link>
        <Link href="/perfil">Perfil</Link>
      </nav>
    ),
    []
  );

  async function load() {
    setLoading(true);
    setMsg(null);

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      router.push("/login");
      router.refresh();
      return;
    }

    setUserId(auth.user.id);
    setEmail(auth.user.email ?? "");

    // Pega timezone do profile
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("timezone, role")
      .eq("id", auth.user.id)
      .single();

    if (profErr) {
      setMsg("Erro ao carregar perfil (timezone): " + profErr.message);
      setLoading(false);
      return;
    }

    // Se for coach/admin, essa tela não é o foco agora (evita confusão)
    if (prof?.role === "coach" || prof?.role === "admin") {
      router.push("/dashboard");
      return;
    }

    const tz = (prof?.timezone || "America/Fortaleza") as string;
    setTimezone(tz);

    const localDate = getLocalISODate(tz);
    setEntryDate(localDate);

    // Busca registro do dia
    const { data: rows, error: wErr } = await supabase
      .from("wellness_entries")
      .select("*")
      .eq("athlete_id", auth.user.id)
      .eq("entry_date", localDate)
      .limit(1);

    if (wErr) {
      setMsg("Erro ao carregar bem-estar do dia: " + wErr.message);
      setLoading(false);
      return;
    }

    const existing = (rows?.[0] as Wellness | undefined) ?? null;

    if (existing) {
      setExistingId(existing.id);
      setSleepQuality(existing.sleep_quality ?? 5);
      setFatigue(existing.fatigue ?? 5);
      setSoreness(existing.soreness ?? 5);
      setStress(existing.stress ?? 5);
      setMood(existing.mood ?? 5);
      setPrs(existing.prs ?? 5);
      setNote(existing.note ?? "");
    } else {
      setExistingId(null);
      // mantém defaults
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvar() {
    if (!userId) return;

    setSaving(true);
    setMsg(null);

    const payload = {
      id: existingId ?? undefined, // se tiver, atualiza; se não, cria
      athlete_id: userId,
      entry_date: entryDate,
      sleep_quality: clamp0to10(sleepQuality),
      fatigue: clamp0to10(fatigue),
      soreness: clamp0to10(soreness),
      stress: clamp0to10(stress),
      mood: clamp0to10(mood),
      prs: clamp0to10(prs),
      note: note.trim() ? note.trim() : null,
    };

    // upsert pelo índice único (athlete_id, entry_date)
    const { data, error } = await supabase
      .from("wellness_entries")
      .upsert(payload, { onConflict: "athlete_id,entry_date" })
      .select("id")
      .single();

    if (error) {
      setMsg("Erro ao salvar: " + error.message);
      setSaving(false);
      return;
    }

    setExistingId(data?.id ?? existingId ?? null);
    setMsg(existingId ? "Bem-estar atualizado com sucesso." : "Bem-estar salvo com sucesso.");
    setSaving(false);
  }

  function RangeField({
    label,
    value,
    setValue,
    hint,
  }: {
    label: string;
    value: number;
    setValue: (v: number) => void;
    hint?: string;
  }) {
    return (
      <div style={{ display: "grid", gap: 8, padding: 12, border: "1px solid #333", borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600 }}>{label}</div>
            {hint ? <div style={{ opacity: 0.75, fontSize: 12 }}>{hint}</div> : null}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
        </div>

        <input
          type="range"
          min={0}
          max={10}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.75 }}>
          <span>0</span>
          <span>10</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 16, fontFamily: "system-ui" }}>Carregando…</div>;
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Bem-estar</h1>
          <div style={{ opacity: 0.8, marginTop: 6, fontSize: 14 }}>
            Logado como: <b>{email || "sem email"}</b>
          </div>
          <div style={{ opacity: 0.8, marginTop: 4, fontSize: 13 }}>
            Dia local: <b>{entryDate}</b> • Fuso: <b>{timezone}</b>
          </div>
        </div>

        {headerLinks}
      </header>

      {msg && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid #333" }}>
          {msg}
        </div>
      )}

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <RangeField label="Qualidade do sono" value={sleepQuality} setValue={setSleepQuality} hint="0 = péssimo, 10 = excelente" />
        <RangeField label="Fadiga" value={fatigue} setValue={setFatigue} hint="0 = nenhum, 10 = extremo" />
        <RangeField label="Dor muscular" value={soreness} setValue={setSoreness} hint="0 = nenhuma, 10 = muita" />
        <RangeField label="Estresse" value={stress} setValue={setStress} hint="0 = baixo, 10 = alto" />
        <RangeField label="Humor" value={mood} setValue={setMood} hint="0 = ruim, 10 = ótimo" />
        <RangeField label="Prontidão (PRS)" value={prs} setValue={setPrs} hint="0 = baixa, 10 = alta" />

        <div style={{ padding: 12, border: "1px solid #333", borderRadius: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Observação (opcional)</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: 10 }}
            placeholder="Algo relevante sobre sono, treino, dor, estresse, etc."
          />
        </div>
      </div>

      <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={salvar} disabled={saving} style={{ padding: "12px 16px" }}>
          {saving ? "Salvando..." : existingId ? "Salvar alterações" : "Salvar bem-estar"}
        </button>
      </div>
    </div>
  );
}
