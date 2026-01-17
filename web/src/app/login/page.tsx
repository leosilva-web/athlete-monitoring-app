"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function signUp() {
    setMsg("Criando conta...");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setMsg(`Erro: ${error.message}`);
    setMsg("Conta criada! (se exigir confirmação por e-mail, confira sua caixa de entrada)");
  }

  async function signIn() {
    setMsg("Entrando...");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(`Erro: ${error.message}`);

    const userId = data.user?.id;
    if (!userId) {
      await supabase.auth.signOut();
      return setMsg("Erro: usuário inválido após login.");
    }

    // Bloqueio híbrido: se atleta estiver bloqueado, derruba a sessão e mostra mensagem correta
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profErr) {
      await supabase.auth.signOut();
      return setMsg("Erro ao verificar perfil. Tente novamente.");
    }

    if (prof?.role === "athlete") {
      const { data: ath, error: athErr } = await supabase
        .from("athletes")
        .select("is_blocked")
        .eq("owner_id", userId)
        .single();

      if (athErr) {
        await supabase.auth.signOut();
        return setMsg("Erro ao verificar status do atleta. Tente novamente.");
      }

      if (ath?.is_blocked) {
        await supabase.auth.signOut();
        return setMsg("Acesso suspenso pelo coach. Fale com ele para reativar.");
      }
    }

    setMsg("Login successful");
    router.push("/dashboard/athletes");
    router.refresh();
  }

  async function signOut() {
    await supabase.auth.signOut();
    setMsg("Saiu da conta.");
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1>Login</h1>

      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seuemail@exemplo.com"
        autoComplete="email"
      />

      <label htmlFor="password">Senha</label>
      <input
        id="password"
        name="password"
        style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="mínimo 6 caracteres"
        autoComplete="current-password"
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={signIn}>
          Entrar
        </button>
        <button type="button" onClick={signUp}>
          Criar conta
        </button>
        <button type="button" onClick={signOut}>
          Sair
        </button>
      </div>

      <p style={{ marginTop: 12 }}>{msg}</p>
    </div>
  );
}
