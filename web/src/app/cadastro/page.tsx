"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function CadastroPage() {
  const params = useSearchParams();
  const router = useRouter();

  const token = useMemo(() => params.get("token")?.trim() || "", [params]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!token) {
      setMsg("Token ausente. Use o link do convite.");
      return;
    }

    if (!email || !password) {
      setMsg("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      // 1) cria conta (signup)
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpErr) {
        setMsg(`Falha no cadastro: ${signUpErr.message}`);
        return;
      }

      // Se o projeto estiver com confirmação de e-mail ligada, user pode existir
      // mas a sessão pode não vir. A gente trata isso com mensagem clara.
      const hasSession = !!signUpData.session;

      // 2) tenta consumir convite (precisa estar autenticado)
      // Se não houver sessão, isso vai retornar 401 e a gente avisa o usuário.
      const consumeRes = await fetch("/api/invites/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const consumeJson = await consumeRes.json();

      if (!consumeRes.ok) {
        if (consumeRes.status === 401) {
          setMsg(
            "Conta criada. Agora confirme o e-mail e faça login para finalizar o convite."
          );
          return;
        }
        setMsg(
          `Falha ao consumir convite: ${
            consumeJson?.error || "erro"
          } (${consumeJson?.details || ""})`
        );
        return;
      }

      // 3) sucesso: convite consumido + vínculo criado no DB (para athlete)
      // Agora manda pro /perfil (Fase 2 vai obrigar timezone etc.)
      if (hasSession) {
        router.push("/perfil");
      } else {
        setMsg(
          "Conta criada e convite consumido. Agora faça login para continuar."
        );
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 520 }}>
      <h1>Cadastro</h1>

      {!token ? (
        <p style={{ color: "crimson" }}>
          Token ausente. Abra o link do convite.
        </p>
      ) : (
        <p style={{ opacity: 0.8 }}>
          Token do convite detectado. Complete seu cadastro.
        </p>
      )}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>E-mail</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="seuemail@exemplo.com"
            style={{ padding: 10 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Senha</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="mínimo 6 caracteres"
            style={{ padding: 10 }}
          />
        </label>

        <button disabled={loading || !token} type="submit">
          {loading ? "Criando..." : "Criar conta"}
        </button>

        {msg && (
          <p style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
            <b>Info:</b> {msg}
          </p>
        )}
      </form>
    </div>
  );
}
