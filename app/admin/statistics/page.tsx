'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, FileQuestion, FolderOpen, Loader2, MessageSquare, ThumbsUp, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Range = '7d' | '30d' | 'all'

type UsageLog = {
  session_id: string
  detected_language: string
  event_type: string
  theme_id: string | null
  faq_matched_id: string | null
  was_helpful: boolean | null
  created_at: string
}

type Faq = {
  id: string
  question_pt: string
}

type Theme = {
  id: string
  title_pt: string
}

function since(range: Range) {
  if (range === 'all') return '1970-01-01T00:00:00.000Z'
  const date = new Date()
  date.setDate(date.getDate() - (range === '7d' ? 7 : 30))
  return date.toISOString()
}

function Kpi({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg border border-[#dfe6ec] bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${color}18` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
      </div>
      <p className="text-3xl font-bold text-[#142338]">{value}</p>
    </div>
  )
}

function Bar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-sm">
        <span className="font-semibold text-[#142338]">{label}</span>
        <span className="text-slate-500">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${(count / Math.max(max, 1)) * 100}%`, background: color }} />
      </div>
    </div>
  )
}

export default function AdminStatisticsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [range, setRange] = useState<Range>('7d')
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<UsageLog[]>([])
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [themes, setThemes] = useState<Theme[]>([])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const from = since(range)
      const [{ data: logRows }, { data: faqRows }, { data: themeRows }] = await Promise.all([
        supabase.from('usage_logs').select('*').gte('created_at', from),
        supabase.from('faqs').select('id, question_pt'),
        supabase.from('themes').select('id, title_pt'),
      ])

      setLogs(logRows ?? [])
      setFaqs(faqRows ?? [])
      setThemes(themeRows ?? [])
      setLoading(false)
    })()
  }, [range, supabase])

  const stats = useMemo(() => {
    const sessions = new Set(logs.map((log) => log.session_id)).size
    const feedback = logs.filter((log) => log.was_helpful !== null)
    const helpful = feedback.filter((log) => log.was_helpful).length
    const helpfulRate = feedback.length ? Math.round((helpful / feedback.length) * 100) : 0

    const langCounts = new Map<string, number>()
    const faqCounts = new Map<string, number>()
    const themeCounts = new Map<string, number>()

    logs.forEach((log) => {
      langCounts.set(log.detected_language, (langCounts.get(log.detected_language) ?? 0) + 1)
      if (log.faq_matched_id) faqCounts.set(log.faq_matched_id, (faqCounts.get(log.faq_matched_id) ?? 0) + 1)
      if (log.theme_id) themeCounts.set(log.theme_id, (themeCounts.get(log.theme_id) ?? 0) + 1)
    })

    const topFaqs = [...faqCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ label: faqs.find((faq) => faq.id === id)?.question_pt ?? id, count }))

    const topThemes = [...themeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ label: themes.find((theme) => theme.id === id)?.title_pt ?? id, count }))

    const langs = [...langCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label: label.toUpperCase(), count }))

    return { sessions, helpfulRate, topFaqs, topThemes, langs }
  }, [faqs, logs, themes])

  const maxFaq = Math.max(1, ...stats.topFaqs.map((item) => item.count))
  const maxTheme = Math.max(1, ...stats.topThemes.map((item) => item.count))
  const maxLang = Math.max(1, ...stats.langs.map((item) => item.count))

  return (
    <main className="min-h-screen bg-[#f5f7f9] p-4 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142338]">Relatorios de Uso</h1>
          <p className="mt-1 text-sm text-slate-500">Acompanhe temas abertos, perguntas acessadas, sessoes e feedback dos colaboradores.</p>
        </div>
        <div className="flex overflow-hidden rounded-lg border border-[#dfe6ec] bg-white">
          {(['7d', '30d', 'all'] as Range[]).map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className="px-4 py-2 text-sm font-bold"
              style={{ background: range === item ? '#142338' : 'transparent', color: range === item ? '#fff' : '#475569' }}
            >
              {item === '7d' ? '7 dias' : item === '30d' ? '30 dias' : 'Total'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-80 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2f5b7c]" />
        </div>
      ) : (
        <>
          <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={MessageSquare} label="Eventos registrados" value={logs.length} color="#2f5b7c" />
            <Kpi icon={Users} label="Sessoes unicas" value={stats.sessions} color="#142338" />
            <Kpi icon={FolderOpen} label="Temas ativos" value={themes.length} color="#b9b49a" />
            <Kpi icon={ThumbsUp} label="Satisfacao" value={`${stats.helpfulRate}%`} color="#ef4650" />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-lg border border-[#dfe6ec] bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-[#142338]">
                <FolderOpen className="h-5 w-5 text-[#2f5b7c]" />
                Temas mais acessados
              </h2>
              <div className="space-y-4">
                {stats.topThemes.length ? stats.topThemes.map((item) => <Bar key={item.label} {...item} max={maxTheme} color="#2f5b7c" />) : <p className="text-sm text-slate-500">Sem dados no periodo.</p>}
              </div>
            </div>

            <div className="rounded-lg border border-[#dfe6ec] bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-[#142338]">
                <FileQuestion className="h-5 w-5 text-[#ef4650]" />
                Perguntas mais acessadas
              </h2>
              <div className="space-y-4">
                {stats.topFaqs.length ? stats.topFaqs.map((item) => <Bar key={item.label} {...item} max={maxFaq} color="#ef4650" />) : <p className="text-sm text-slate-500">Sem dados no periodo.</p>}
              </div>
            </div>

            <div className="rounded-lg border border-[#dfe6ec] bg-white p-5 shadow-sm xl:col-span-2">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-[#142338]">
                <BarChart3 className="h-5 w-5 text-[#2f5b7c]" />
                Uso por idioma
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {stats.langs.length ? stats.langs.map((item) => <Bar key={item.label} {...item} max={maxLang} color="#2f5b7c" />) : <p className="text-sm text-slate-500">Sem dados no periodo.</p>}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
