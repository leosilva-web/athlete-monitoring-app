import Link from "next/link";

export default function TreinoPage() {
  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Sessão de Treino</h1>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/inicio">Início</Link>
          <Link href="/perfil">Perfil</Link>
        </nav>
      </header>

      <p style={{ opacity: 0.8, marginTop: 10 }}>
        Em construção: registro da sessão de treino.
      </p>
    </div>
  );
}
