import type { CSSProperties } from "react";

export const ACTION_BTN: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 36,
  padding: "0 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)", // cinza claro translúcido
  color: "inherit",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
  lineHeight: "20px",
  textDecoration: "none",
  whiteSpace: "nowrap",
  userSelect: "none",
};

export const ACTION_BTN_DANGER: CSSProperties = {
  ...ACTION_BTN,
  border: "1px solid rgba(255,80,80,0.35)",
  background: "rgba(255,80,80,0.18)", // vermelho translúcido (igual ao “Deletar”)
};

export const ACTION_BTN_DISABLED: CSSProperties = {
  opacity: 0.6,
  cursor: "not-allowed",
};
