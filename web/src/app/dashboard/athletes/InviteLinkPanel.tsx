"use client";

import { useState } from "react";

export default function InviteLinkPanel() {
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
    <section style={{ border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>Link de convite (Atleta)</h3>
      <p style={{ opacity: 0.85, marginTop: 6 }}>
        Gere um link para enviar ao atleta se cadastrar e já ficar vinculado a você.
      </p>

      <button onClick={gerarConviteAthlete} disabled={loading} style={{ padding: "10px 14px", borderRadius: 12 }}>
        {loading ? "Gerando..." : "Gerar link de convite"}
      </button>

      {inviteUrl && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Link do convite:</div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              readOnly
              value={inviteUrl}
              style={{
                padding: 10,
                minWidth: 520,
                flex: 1,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "transparent",
                color: "inherit",
              }}
            />
            <button onClick={copiarLink} style={{ padding: "10px 14px", borderRadius: 12 }}>
              Copiar
            </button>
          </div>
        </div>
      )}

      {/* Debug opcional (se quiser esconder depois, eu removo) */}
      <pre
        style={{
          marginTop: 14,
          padding: 12,
          borderRadius: 10,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          opacity: 0.85,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        {result ? JSON.stringify(result, null, 2) : "Sem resultado ainda."}
      </pre>
    </section>
  );
}
