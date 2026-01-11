import Link from "next/link";

export default function InicioAtletaPage() {
  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Área do Atleta</h1>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/perfil">Perfil</Link>
          <Link href="/login">Login</Link>
        </nav>
      </header>

      <p style={{ opacity: 0.8, marginTop: 10 }}>
        Escolha o que deseja preencher hoje:
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <Link
          href="/bem-estar"
          style={{
            padding: 14,
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          <b>Bem-estar</b>
          <div style={{ opacity: 0.8, marginTop: 6 }}>
            Sono, humor, dor, fadiga, prontidão…
          </div>
        </Link>

        <Link
          href="/treino"
          style={{
            padding: 14,
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          <b>Sessão de Treino</b>
          <div style={{ opacity: 0.8, marginTop: 6 }}>
            Registro da sessão: carga, duração, RPE, notas…
          </div>
        </Link>
      </div>
    </div>
  );
}
