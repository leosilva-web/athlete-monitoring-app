"use client";

export const dynamic = "force-dynamic";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function CadastroInner() {
  const router = useRouter();
  const params = useSearchParams();

  const token = useMemo(() => params.get("token")?.trim() || "", [params]);

  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!token) {
      setMsg("Token ausente. Abra o link do convite.");
      return;
    }
    if (!email || !password) {
      setMsg("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      // 1) cria conta
      const { error: signUpErr } = await supabase.auth.signUp({ email, password });
      if (signUpErr) {
        setMsg(`Falha no cadastro: ${signUpErr.message}`);
        return;
      }

      // 2) garante sessão (não confia no auto-login do signup)
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setMsg("Conta criada. Agora faça login para finalizar o convite.");
        router.push("/login");
        return;
      }

      // 3) consome convite (agora o server consegue ler a sessão via cookies)
      const res = await fetch("/api/invites/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const json = await res.json();

      if (!res.ok) {
        setMsg(`Falha ao consumir convite: ${json?.error || "erro"} (${json?.details || ""})`);
        return;
      }

      // 4) sucesso
      router.push("/perfil");
    } catch (err: any) {
      setMsg(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 520 }}>
      <h1>Cadastro</h1>

      <p style={{ opacity: 0.8 }}>
        {token ? "Token do convite detectado. Complete seu cadastro." : "Token ausente. Abra o link do convite."}
      </p>

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

export default function CadastroPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16, fontFamily: "system-ui" }}>Carregando…</div>}>
      <CadastroInner />
    </Suspense>
  );
}
