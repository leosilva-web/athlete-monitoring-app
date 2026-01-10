"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpErr) {
        setMsg(`Falha no cadastro: ${signUpErr.message}`);
        return;
      }

      const hasSession = !!signUpData.session;

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
