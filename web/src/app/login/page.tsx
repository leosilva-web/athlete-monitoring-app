'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string>('')

  async function signUp() {
    setMsg('Criando conta...')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return setMsg(`Erro: ${error.message}`)
    setMsg('Conta criada! (se o projeto exigir confirmação por e-mail, confira sua caixa de entrada)')
  }

  async function signIn() {
    setMsg('Entrando...')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return setMsg(`Erro: ${error.message}`)
    setMsg('Login OK ✅')
  }

  async function signOut() {
    await supabase.auth.signOut()
    setMsg('Saiu da conta.')
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h1>Login</h1>

      <label>Email</label>
      <input
        style={{ width: '100%', padding: 8, margin: '6px 0 12px' }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seuemail@exemplo.com"
      />

      <label>Senha</label>
      <input
        style={{ width: '100%', padding: 8, margin: '6px 0 12px' }}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="mínimo 6 caracteres"
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={signIn}>Entrar</button>
        <button onClick={signUp}>Criar conta</button>
        <button onClick={signOut}>Sair</button>
      </div>

      <p style={{ marginTop: 12 }}>{msg}</p>
    </div>
  )
}
