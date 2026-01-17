"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  sex: string | null;
  birth_date: string | null; // yyyy-mm-dd
  team_name: string | null;
  timezone: string | null;
  avatar_path: string | null;
  role: string | null;
};

type CoachLabelRow = {
  coach_id: string | null;
  coach_name: string | null;
};

function CoachLinkBannerClient({ role, userId }: { role: string | null; userId: string | null }) {
  const supabase = createClient();
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      setText(null);

      // ✅ Só atleta
      if (role !== "athlete" || !userId) return;

      // ✅ "DB manda": pega o nome do coach via RPC (security definer)
      const { data, error } = await supabase.rpc("get_my_coach_label");

      if (error) return;

      const row = (Array.isArray(data) ? data[0] : data) as CoachLabelRow | null;
      const coachName = (row?.coach_name || "").trim();

      // Se não veio nome real, não mostra banner (melhor que "seu coach")
      if (!coachName) return;

      if (!alive) return;

      setText(`Conta vinculada • Monitorado por ${coachName} (Coach)`);
    }

    run();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, userId]);

  if (!text) return null;

  return (
    <div
      style={{
        margin: "10px auto 0",
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.05)",
        fontSize: 12,
        opacity: 0.9,
        maxWidth: 520,
        textAlign: "center",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
      aria-label="Conta vinculada ao coach"
      title={text}
    >
      {text}
    </div>
  );
}

export default function PerfilPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  // Campos do perfil
  const [fullName, setFullName] = useState("");
  const [sex, setSex] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [teamName, setTeamName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [role, setRole] = useState<string | null>(null);

  // Bloqueio híbrido (se atleta estiver bloqueado)
  const [isBlocked, setIsBlocked] = useState(false);

  // Foto
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Senha
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  // Lista de fusos (IANA) suportados pelo navegador
  const tzOptions = useMemo(() => {
    try {
      const anyIntl = Intl as any;
      if (typeof anyIntl.supportedValuesOf === "function") {
        const list = anyIntl.supportedValuesOf("timeZone") as string[];
        return Array.from(new Set(list)).sort();
      }
    } catch {
      // ignore
    }
    return [
      "America/Fortaleza",
      "America/Sao_Paulo",
      "America/Recife",
      "America/Manaus",
      "America/Rio_Branco",
      "Europe/Lisbon",
      "Europe/London",
      "UTC",
    ];
  }, []);

  async function loadProfile() {
    setLoading(true);
    setMsg(null);
    setIsBlocked(false);

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      router.push("/login");
      router.refresh();
      return;
    }

    setUserId(auth.user.id);
    setEmail(auth.user.email ?? "");

    const { data: p, error } = await supabase
      .from("profiles")
      .select("id, full_name, sex, birth_date, team_name, timezone, avatar_path, role")
      .eq("id", auth.user.id)
      .single();

    if (error) {
      setMsg("Erro ao carregar perfil: " + error.message);
      setLoading(false);
      return;
    }

    const profile = p as Profile;

    // role primeiro (pra UI saber)
    setRole(profile.role);

    // ✅ Bloqueio híbrido: se atleta bloqueado, derruba sessão e mostra aviso
    if (profile.role === "athlete") {
      const { data: ath, error: athErr } = await supabase
        .from("athletes")
        .select("is_blocked")
        .eq("owner_id", auth.user.id)
        .single();

      if (!athErr && ath?.is_blocked) {
        await supabase.auth.signOut();
        setIsBlocked(true);
        setMsg("Acesso suspenso pelo coach. Fale com ele para reativar.");
        setLoading(false);
        return;
      }
    }

    setFullName(profile.full_name ?? "");
    setSex(profile.sex ?? "");
    setBirthDate(profile.birth_date ?? "");
    setTeamName(profile.team_name ?? "");
    setTimezone(profile.timezone ?? "");
    setAvatarPath(profile.avatar_path);

    // Preview da foto (bucket privado -> signed url)
    if (profile.avatar_path) {
      const { data: signed, error: signedErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(profile.avatar_path, 60 * 10);

      if (!signedErr) setAvatarUrl(signed?.signedUrl ?? null);
      else setAvatarUrl(null);
    } else {
      setAvatarUrl(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    if (!userId) return;

    setSaving(true);
    setMsg(null);

    try {
      // ✅ Validação: tudo em "Dados" obrigatório
      const missing: string[] = [];
      if (!fullName.trim()) missing.push("Nome");
      if (sex !== "male" && sex !== "female") missing.push("Sexo");
      if (!birthDate) missing.push("Data de nascimento");
      if (!teamName.trim()) missing.push("Equipe");
      if (!timezone) missing.push("Fuso horário (IANA)");

      if (missing.length) {
        setMsg(`Preencha antes de salvar: ${missing.join(", ")}.`);
        return;
      }

      // 1) sempre atualiza profiles (coach e athlete)
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          sex,
          birth_date: birthDate,
          team_name: teamName.trim(),
          timezone,
        })
        .eq("id", userId);

      if (profileErr) {
        setMsg("Erro ao salvar: " + profileErr.message);
        return;
      }

      // 2) se for atleta, espelha o nome na tabela athletes também
      // (obs: se estiver bloqueado, a RLS vai impedir o update — e isso é desejado)
      if (role === "athlete") {
        const { error: athErr } = await supabase
          .from("athletes")
          .update({ name: fullName.trim() })
          .eq("owner_id", userId);

        if (athErr) {
          setMsg("Perfil salvo, mas falha ao atualizar nome do atleta: " + athErr.message);
          return;
        }
      }

      setMsg("Perfil salvo com sucesso.");
    } finally {
      setSaving(false);
    }
  }

  function getFileExt(name: string) {
    const parts = name.split(".");
    if (parts.length < 2) return "jpg";
    const ext = parts[parts.length - 1].toLowerCase();
    return ext || "jpg";
  }

  async function uploadAvatar(file: File) {
    if (!userId) return;

    setUploading(true);
    setMsg(null);

    try {
      const ext = getFileExt(file.name);
      const path = `${userId}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

      if (upErr) {
        setMsg("Erro ao enviar foto: " + upErr.message);
        return;
      }

      const { error: profErr } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", userId);

      if (profErr) {
        setMsg("Foto enviada, mas falha ao salvar no perfil: " + profErr.message);
        return;
      }

      setAvatarPath(path);

      const { data: signed, error: signedErr } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 10);

      if (signedErr) {
        setMsg("Foto enviada, mas falha ao gerar preview: " + signedErr.message);
        return;
      }

      setAvatarUrl(signed?.signedUrl ?? null);
      setMsg("Foto atualizada com sucesso.");
    } finally {
      setUploading(false);
    }
  }

  async function changePassword() {
    setChangingPass(true);
    setMsg(null);

    try {
      if (!newPassword || newPassword.length < 6) {
        setMsg("A nova senha deve ter pelo menos 6 caracteres.");
        return;
      }
      if (newPassword !== newPassword2) {
        setMsg("As senhas não coincidem.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setMsg("Erro ao trocar senha: " + error.message);
        return;
      }

      setNewPassword("");
      setNewPassword2("");
      setMsg("Senha atualizada com sucesso.");
    } finally {
      setChangingPass(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 16, fontFamily: "system-ui" }}>Carregando perfil…</div>;
  }

  // ✅ Se bloqueado, mostra só a tela de suspensão (não renderiza o app)
  if (role === "athlete" && isBlocked) {
    return (
      <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 520, margin: "40px auto" }}>
        <h1 style={{ marginTop: 0 }}>Acesso suspenso</h1>
        <p style={{ opacity: 0.9 }}>Acesso suspenso pelo coach. Fale com ele para reativar.</p>
        <Link href="/login">Voltar para o login</Link>
      </div>
    );
  }

  const isCoachOrAdmin = role === "coach" || role === "admin";

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Perfil</h1>

        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/inicio">Início</Link>
          <Link href="/bem-estar">Bem-estar</Link>
          <Link href="/treino">Treino</Link>
          {isCoachOrAdmin ? <Link href="/dashboard">Dashboard</Link> : null}
        </nav>
      </header>

      {/* ✅ Banner discreto (só atleta, só se tiver coach_id) */}
      <CoachLinkBannerClient role={role} userId={userId} />

      <p style={{ opacity: 0.8, marginTop: 10 }}>
        Logado como: <b>{email || "sem email"}</b>
      </p>

      {msg && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid #333" }}>
          {msg}
        </div>
      )}

      {/* FOTO */}
      <section style={{ marginTop: 18, padding: 14, border: "1px solid #333", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Foto de perfil</h2>

        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              overflow: "hidden",
              border: "1px solid #444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ opacity: 0.7, fontSize: 12 }}>Sem foto</span>
            )}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar(file);
              }}
            />
            <div style={{ opacity: 0.8, fontSize: 12 }}>
              {uploading ? "Enviando..." : avatarPath ? "Enviar outra imagem substitui a atual." : "Escolha uma imagem (JPG/PNG)."}
            </div>
          </div>
        </div>
      </section>

      {/* DADOS */}
      <section style={{ marginTop: 18, padding: 14, border: "1px solid #333", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Dados</h2>

        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Nome</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ padding: 10 }} required />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Sexo</span>
            <select value={sex} onChange={(e) => setSex(e.target.value)} style={{ padding: 10 }} required>
              <option value="">Selecionar</option>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Data de nascimento</span>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} style={{ padding: 10 }} required />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Equipe</span>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} style={{ padding: 10 }} required />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Fuso horário (IANA)</span>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={{ padding: 10 }} required>
              <option value="">Selecionar</option>
              {tzOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <small style={{ opacity: 0.75 }}>Se não encontrar, role a lista (padrão IANA).</small>
          </label>
        </div>
      </section>

      {/* SENHA */}
      <section style={{ marginTop: 18, padding: 14, border: "1px solid #333", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Segurança</h2>

        <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Nova senha</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
              style={{ padding: 10 }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Confirmar nova senha</span>
            <input
              type="password"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              placeholder="repita a senha"
              style={{ padding: 10 }}
            />
          </label>

          <button onClick={changePassword} disabled={changingPass} style={{ padding: "10px 14px" }}>
            {changingPass ? "Atualizando..." : "Trocar senha"}
          </button>
        </div>
      </section>

      {/* BOTÃO SALVAR (rodapé) */}
      <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={saveProfile} disabled={saving} style={{ padding: "12px 16px" }}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
