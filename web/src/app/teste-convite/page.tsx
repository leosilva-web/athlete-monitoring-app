"use client";

import { useState } from "react";

export default function TesteConvitePage() {
  const [result, setResult] = useState<any>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  async function gerarConviteAthlete() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: "athlete" }),
      });

      const json = await res.json();
      setResult({ status: res.status, json });

      // Extrair token automaticamente do inviteUrl, se existir
      const inviteUrl: string | undefined = json?.inviteUrl;
      if (inviteUrl) {
        const url = new URL(inviteUrl);
        const t = url.searchParams.get("token");
        if (t) setToken(t);
      }
    } catch (e: any) {
      setResult({ status: "erro", json: String(e) });
    } finally {
      setLoading(false);
    }
  }

  async function consumirConvite() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/invites/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const json = await res.json();
      setResult({ status: res.status, json });
    } catch (e: any) {
      setResult({ status: "erro", json: String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h1>Teste de Convite</h1>

      <p>
        <b>NEXT_PUBLIC_SUPABASE_URL:</b> {process.env.NEXT_PUBLIC_SUPABASE_URL}
      </p>

      <p>
        Gera convite (coach) e consome convite (usuário autenticado) usando{" "}
        <code>/api/invites</code> e <code>/api/invites/consume</code>.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <button onClick={gerarConviteAthlete} disabled={loading}>
          {loading ? "..." : "Gerar convite de Athlete"}
        </button>

        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="token do convite"
          style={{ minWidth: 420, padding: 8 }}
        />

        <button onClick={consumirConvite} disabled={loading || !token}>
          {loading ? "..." : "Consumir convite"}
        </button>
      </div>

      <pre
        style={{
          marginTop: 16,
          background: "#111",
          color: "#0f0",
          padding: 12,
          borderRadius: 8,
          overflow: "auto",
          whiteSpace: "pre-wrap",
        }}
      >
        {result ? JSON.stringify(result, null, 2) : "Sem resultado ainda."}
      </pre>
    </div>
  );
}
