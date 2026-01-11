"use client";

export const dynamic = "force-dynamic";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function CadastroInner() {
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

    if (!token) return setMsg("Token ausente. Use o link do convite.");
    if (!email || !password) return setMsg("Preencha e-mail e senha.");

    setLoading(true);
    try {
      const { error: signUpErr } = await supabase.auth.signUp({ email, password });
if (signUpErr) return setMsg(`Falha no cadastro: ${signUpErr.message}`);

// GARANTE sessão antes de consumir (não confia no "autologin" pós-signup)
const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
if (signInErr) {
  setMsg("Conta criada. Agora faça login para finalizar o convite.");
  router.push("/login");
  return;
}

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

router.push("/perfil");
      });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setMsg("Conta criada. Confirme o e-mail e faça login para finalizar o convite.");
          return;
        }
        setMsg(`Falha ao consumir convite: ${json?.error || "erro"} (${json?.details || ""})`);
        return;
      }

      // Se veio sessão, segue; senão manda pro login.
      if (data.session) router.push("/perfil");
      else router.push("/login");
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
            style={{ padding: 10 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Senha</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
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
