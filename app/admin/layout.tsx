'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, FileText, LogOut, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const nav = [
  { href: '/admin/statistics', label: 'Relatorios', Icon: BarChart3 },
  { href: '/admin/faqs', label: 'Conteudo', Icon: FileText },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#f5f7f9] lg:flex">
      <aside className="hidden w-64 flex-col border-r-2 border-[#ef4650] bg-[#142338] lg:flex">
        <div className="border-b border-white/10 p-6">
          <img src="/logo-minerva.webp" alt="Minerva Foods" className="h-11 w-auto brightness-0 invert" />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.25em] text-white/45">Admin FAQ</p>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map(({ href, label, Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition"
                style={{ background: active ? '#ef4650' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,.7)' }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-3">
          <Link href="/chat" className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10">
            <MessageSquare className="h-4 w-4" />
            Ver FAQ
          </Link>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10">
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b-2 border-[#ef4650] bg-[#142338] lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <img src="/logo-minerva.webp" alt="Minerva Foods" className="h-9 w-auto brightness-0 invert" />
          <div className="flex gap-1">
            {nav.map(({ href, Icon }) => (
              <Link key={href} href={href} className="rounded-lg p-2" style={{ background: pathname === href ? '#ef4650' : 'transparent' }}>
                <Icon className="h-4 w-4 text-white" />
              </Link>
            ))}
          </div>
        </div>
      </header>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
