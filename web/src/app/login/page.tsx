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
  console.log("Cliquei Entrar. Email:", email);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  console.log("Retorno signInWithPassword:", { data, error });

  if (error) return setMsg(`Erro: ${error.message}`);

  setMsg("Login OK ✅");
  router.push("/dashboard");
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
      <button
  type="button"
  onClick={() => {
    console.log("✅ CLIQUEI NO BOTÃO ENTRAR");
    <button type="button" onClick={signIn}>Entrar</button>
  }}
>
  Entrar
</button>

      <button type="button" onClick={signUp}>Cadastrar</button>
      <button type="button" onClick={signOut}>Sair</button>
    </div>

    <p style={{ marginTop: 12 }}>{msg}</p>
  </div>
);
}
