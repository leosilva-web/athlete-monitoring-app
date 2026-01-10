"use client";

import { useState } from "react";

export default function InvitesPage() {
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

  const inviteUrl = result?.json?.inviteUrl as string | undefined;

  async function copiarLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    alert("Link copiado!");
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 900 }}>
      <h1>Convites</h1>
      <p>Gere um convite de atleta para enviar o link de cadastro.</p>

      <button onClick={gerarConviteAthlete} disabled={loading}>
        {loading ? "Gerando..." : "Gerar convite de Athlete"}
      </button>

      {inviteUrl && (
        <div style={{ marginTop: 16 }}>
          <p>
            <b>Link do convite:</b>
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              readOnly
              value={inviteUrl}
              style={{ padding: 10, minWidth: 520, flex: 1 }}
            />
            <button onClick={copiarLink}>Copiar</button>
          </div>
        </div>
      )}

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
