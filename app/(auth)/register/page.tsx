'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailOk = email.trim().toLowerCase().endsWith('@minervafoods.com')
  const passwordOk = password.length >= 8
  const matchOk = password === confirm && confirm.length > 0

  const register = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()
    if (!fullName.trim()) return setError('Informe seu nome completo.')
    if (!emailOk) return setError('Use apenas e-mail @minervafoods.com.')
    if (!passwordOk) return setError('A senha deve ter pelo menos 8 caracteres.')
    if (!matchOk) return setError('As senhas nao coincidem.')

    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: { full_name: fullName.trim() } },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    const roleResponse = await fetch('/api/admin/set-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: data.user.id, email: normalizedEmail, fullName: fullName.trim() }),
    })

    if (!roleResponse.ok) {
      const body = await roleResponse.json().catch(() => ({}))
      setError(body.error ?? 'Erro ao criar perfil.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/login'), 2200)
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7f9] px-4">
        <div className="max-w-sm text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-[#2f5b7c]" />
          <h1 className="mt-4 text-2xl font-bold text-[#142338]">Conta criada</h1>
          <p className="mt-2 text-sm text-slate-500">Verifique seu e-mail caso a confirmacao esteja habilitada no Supabase.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[46%_1fr]">
      <section className="hidden bg-[#142338] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <img src="/logo-minerva.webp" alt="Minerva Foods" className="h-14 w-fit brightness-0 invert" />
        <div>
          <p className="mb-5 w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[#b9b49a]">
            Corporate Access
          </p>
          <h1 className="max-w-md text-5xl font-bold leading-tight">
            Cadastro seguro
            <span className="block text-[#ef4650]">Minerva Foods</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
            Somente colaboradores com dominio @minervafoods.com podem acessar o FAQ Global.
          </p>
        </div>
        <p className="text-xs text-white/45">Minerva Foods S.A.</p>
      </section>

      <section className="flex items-center justify-center bg-[#f5f7f9] px-4 py-10">
        <div className="w-full max-w-md">
          <img src="/logo-minerva.webp" alt="Minerva Foods" className="mx-auto mb-8 h-12 w-auto lg:hidden" />
          <h2 className="text-2xl font-bold text-[#142338]">Criar conta</h2>
          <p className="mt-1 text-sm text-slate-500">Use seu e-mail corporativo.</p>

          <form onSubmit={register} className="mt-6 space-y-4 rounded-lg border border-[#dfe6ec] bg-white p-6 shadow-sm">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#142338]">Nome completo</span>
              <span className="relative block">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-lg border border-[#dfe6ec] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#2f5b7c]" required />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#142338]">E-mail corporativo</span>
              <span className="relative block">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@minervafoods.com" className="w-full rounded-lg border border-[#dfe6ec] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#2f5b7c]" required />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#142338]">Senha</span>
              <span className="relative block">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-[#dfe6ec] py-2.5 pl-10 pr-10 text-sm outline-none focus:border-[#2f5b7c]" required />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#142338]">Confirmar senha</span>
              <input type={showPassword ? 'text' : 'password'} value={confirm} onChange={(event) => setConfirm(event.target.value)} className="w-full rounded-lg border border-[#dfe6ec] px-3 py-2.5 text-sm outline-none focus:border-[#2f5b7c]" required />
            </label>

            {error && (
              <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-[#9f1724]">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button disabled={loading || !emailOk || !passwordOk || !matchOk || !fullName.trim()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#ef4650] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Criar conta
            </button>

            <p className="border-t border-[#dfe6ec] pt-5 text-center text-sm text-slate-500">
              Ja tem conta?{' '}
              <Link href="/login" className="font-bold text-[#2f5b7c]">
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
