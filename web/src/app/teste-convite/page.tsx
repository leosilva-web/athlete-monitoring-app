"use client";

import { useState } from "react";

export default function TesteConvitePage() {
  const [result, setResult] = useState<any>(null);
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
    } catch (e: any) {
      setResult({ status: "erro", json: String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h1>Teste de Convite</h1>
      <p>Gera um convite de ATHLETE usando <code>/api/invites</code>.</p>

      <button onClick={gerarConviteAthlete} disabled={loading}>
        {loading ? "Gerando..." : "Gerar convite de Athlete"}
      </button>

      <pre style={{ marginTop: 16, background: "#111", color: "#0f0", padding: 12, borderRadius: 8 }}>
        {result ? JSON.stringify(result, null, 2) : "Sem resultado ainda."}
      </pre>
    </div>
  );
}
