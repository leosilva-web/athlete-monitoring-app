"use client";

import { useState } from "react";
import CheckInBemEstarForm from "./CheckInBemEstarForm";
import CheckInSessaoTreinoForm from "./CheckInSessaoTreinoForm";

export default function MedicoesTabs({
  athleteId,
  athleteSexo,
}: {
  athleteId: string;
  athleteSexo: string;
}) {
  const [tab, setTab] = useState<"bem_estar" | "sessao">("bem_estar");

  const btn = (active: boolean): React.CSSProperties => ({
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: active ? "rgba(255,255,255,0.10)" : "transparent",
    color: "inherit",
    cursor: "pointer",
    fontWeight: 600,
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setTab("bem_estar")} style={btn(tab === "bem_estar")}>
          Check-in Bem-Estar
        </button>
        <button type="button" onClick={() => setTab("sessao")} style={btn(tab === "sessao")}>
          Check-in Sessão de Treino
        </button>
      </div>

      <div style={{ marginTop: 12, opacity: 0.8, fontSize: 13 }}>
        {tab === "bem_estar" ? (
          <div>
            Registre <b>1 vez por dia</b>, somente <b>até 12:00</b> (hora local do atleta).
          </div>
        ) : (
          <div>
            Pode registrar <b>várias sessões por dia</b> (cada registro conta como uma sessão).
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        {tab === "bem_estar" ? (
          <CheckInBemEstarForm athleteId={athleteId} athleteSexo={athleteSexo} />
        ) : (
          <CheckInSessaoTreinoForm athleteId={athleteId} />
        )}
      </div>
    </div>
  );
}
