'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'domain') {
      setError('Acesso permitido apenas para @minervafoods.com.')
    }
  }, [])

  const login = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail.endsWith('@minervafoods.com')) {
      setError('Use apenas seu e-mail corporativo @minervafoods.com.')
      setLoading(false)
      return
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (signInError) {
      setError(signInError.message.includes('Invalid') ? 'E-mail ou senha incorretos.' : signInError.message)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase.from('user_profiles').select('role').eq('id', data.user.id).maybeSingle()
    router.push(profile?.role === 'admin' ? '/admin/statistics' : '/chat')
    router.refresh()
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[46%_1fr]">
      <section className="hidden bg-[#142338] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <img src="/logo-minerva.webp" alt="Minerva Foods" className="h-14 w-fit brightness-0 invert" />
        <div>
          <p className="mb-5 w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-[#b9b49a]">
            International Offices
          </p>
          <h1 className="max-w-md text-5xl font-bold leading-tight">
            FAQ Global
            <span className="block text-[#ef4650]">Minerva Foods</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
            Respostas oficiais para colaboradores em Portugues, English e Espanol, com acesso protegido por dominio corporativo.
          </p>
        </div>
        <p className="text-xs text-white/45">Minerva Foods S.A.</p>
      </section>

      <section className="flex items-center justify-center bg-[#f5f7f9] px-4 py-10">
        <div className="w-full max-w-md">
          <img src="/logo-minerva.webp" alt="Minerva Foods" className="mx-auto mb-8 h-12 w-auto lg:hidden" />
          <h2 className="text-2xl font-bold text-[#142338]">Entrar</h2>
          <p className="mt-1 text-sm text-slate-500">Acesse com sua conta corporativa.</p>

          <form onSubmit={login} className="mt-6 rounded-lg border border-[#dfe6ec] bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-[#142338]">E-mail corporativo</span>
                <span className="relative block">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nome@minervafoods.com"
                    className="w-full rounded-lg border border-[#dfe6ec] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#2f5b7c]"
                    required
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-[#142338]">Senha</span>
                <span className="relative block">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-[#dfe6ec] py-2.5 pl-10 pr-10 text-sm outline-none focus:border-[#2f5b7c]"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              {error && (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-[#9f1724]">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button disabled={loading || !email || !password} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#ef4650] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Entrar
              </button>
            </div>

            <p className="mt-5 border-t border-[#dfe6ec] pt-5 text-center text-sm text-slate-500">
              Nao tem conta?{' '}
              <Link href="/register" className="font-bold text-[#2f5b7c]">
                Cadastre-se
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
