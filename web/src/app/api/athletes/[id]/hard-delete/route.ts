import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createUserClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: athleteId } = await params;

  // 1) Cliente do usuário (pra autenticar e validar permissões via RLS)
  const supabaseUser = await createUserClient();
  const { data: userData, error: userError } = await supabaseUser.auth.getUser();

  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const requesterId = userData.user.id;

  // 2) Só coach/admin pode hard delete
  const { data: profile, error: profErr } = await supabaseUser
    .from("profiles")
    .select("role")
    .eq("id", requesterId)
    .maybeSingle();

  if (profErr) {
    return NextResponse.json({ error: "Falha ao ler perfil", details: profErr.message }, { status: 500 });
  }

  const role = profile?.role ?? null;
  const isCoachOrAdmin = role === "coach" || role === "admin";
  if (!isCoachOrAdmin) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // 3) Validar se esse atleta pertence ao coach (e pegar owner_id dele)
  // Obs: isso aqui depende do SELECT do coach na tabela athletes funcionar via policy.
  const { data: athlete, error: athErr } = await supabaseUser
    .from("athletes")
    .select("id, owner_id, coach_id")
    .eq("id", athleteId)
    .maybeSingle();

  if (athErr) {
    return NextResponse.json({ error: "Falha ao ler atleta", details: athErr.message }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado (ou sem permissão)." }, { status: 404 });
  }

  // Coach: só pode deletar se coach_id do atleta for ele.
  // Admin: pode deletar qualquer (mantendo regra simples).
  if (role === "coach") {
    if (!athlete.coach_id || athlete.coach_id !== requesterId) {
      return NextResponse.json({ error: "Sem permissão para excluir este atleta." }, { status: 403 });
    }
  }

  const athleteOwnerId = athlete.owner_id;

  // 4) Cliente admin (service role) para apagar dados e auth user
  const supabaseAdmin = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });

  // 5) Apagar dados relacionados (ordem: filhos -> pai)
  // Ajuste/adicione aqui se surgirem novas tabelas.
  const del1 = await supabaseAdmin.from("checkins_bem_estar").delete().eq("athlete_id", athleteId);
  if (del1.error) return NextResponse.json({ error: del1.error.message }, { status: 400 });

  const del2 = await supabaseAdmin.from("sessoes_treino").delete().eq("athlete_id", athleteId);
  if (del2.error) return NextResponse.json({ error: del2.error.message }, { status: 400 });

  // se existir a tabela de vínculo, limpamos também
  await supabaseAdmin.from("coach_athletes").delete().eq("athlete_id", athleteId);

  // 6) Apagar o registro do atleta
  const delAth = await supabaseAdmin.from("athletes").delete().eq("id", athleteId);
  if (delAth.error) return NextResponse.json({ error: delAth.error.message }, { status: 400 });

  // 7) Apagar profile (opcional, mas pra "nunca existiu" faz sentido)
  await supabaseAdmin.from("profiles").delete().eq("id", athleteOwnerId);

  // 8) Apagar usuário no Supabase Auth (hard delete real)
  const { error: authDelErr } = await supabaseAdmin.auth.admin.deleteUser(athleteOwnerId);
  if (authDelErr) {
    // Aqui é melhor ser honesto: dados foram apagados, mas auth não.
    return NextResponse.json(
      { error: "Dados apagados, mas falha ao apagar usuário do Auth", details: authDelErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
