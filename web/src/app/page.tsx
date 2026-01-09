'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function signUp() {
    setLoading(true); setMsg(null)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) return setMsg(error.message)
    setMsg('Cadastro OK. Agora faça login.')
  }

  async function signIn() {
    setLoading(true); setMsg(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setMsg(error.message)
    router.push('/')
  }

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: 16 }}>
      <h1>Login</h1>

      <label>Email</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', padding: 10, margin: '8px 0 16px' }}
      />

      <label>Senha</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', padding: 10, margin: '8px 0 16px' }}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={signIn} disabled={loading}>Entrar</button>
        <button onClick={signUp} disabled={loading}>Cadastrar</button>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  )
}
