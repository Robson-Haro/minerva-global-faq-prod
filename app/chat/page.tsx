'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Globe2,
  HelpCircle,
  LogOut,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Lang = 'pt' | 'en' | 'es'

type Theme = {
  id: string
  title_pt: string
  title_en: string
  title_es: string
  description_pt: string | null
  description_en: string | null
  description_es: string | null
}

type Faq = {
  id: string
  theme_id: string | null
  question_pt: string
  question_en: string
  question_es: string
  answer_pt: string
  answer_en: string
  answer_es: string
}

const COPY = {
  pt: {
    hello: 'Bem-vindo ao FAQ Global Minerva Foods',
    subtitle: 'Escolha um tema para encontrar rapidamente a pergunta prevista e a resposta correta.',
    themes: 'Temas disponiveis',
    questions: 'Perguntas provaveis',
    search: 'Buscar por tema, pergunta ou palavra-chave',
    back: 'Voltar aos temas',
    helpful: 'Esta resposta foi util?',
    thanks: 'Obrigado pelo feedback.',
    empty: 'Nenhum conteudo encontrado.',
  },
  en: {
    hello: 'Welcome to the Minerva Foods Global FAQ',
    subtitle: 'Choose a topic to quickly find the expected question and the correct answer.',
    themes: 'Available topics',
    questions: 'Expected questions',
    search: 'Search by topic, question or keyword',
    back: 'Back to topics',
    helpful: 'Was this answer helpful?',
    thanks: 'Thank you for the feedback.',
    empty: 'No content found.',
  },
  es: {
    hello: 'Bienvenido al FAQ Global de Minerva Foods',
    subtitle: 'Elija un tema para encontrar rapidamente la pregunta prevista y la respuesta correcta.',
    themes: 'Temas disponibles',
    questions: 'Preguntas probables',
    search: 'Buscar por tema, pregunta o palabra clave',
    back: 'Volver a temas',
    helpful: 'Esta respuesta fue util?',
    thanks: 'Gracias por el feedback.',
    empty: 'No se encontro contenido.',
  },
} as const

function pick(item: Theme | Faq, field: 'title' | 'description' | 'question' | 'answer', lang: Lang) {
  return String((item as Record<string, unknown>)[`${field}_${lang}`] ?? (item as Record<string, unknown>)[`${field}_pt`] ?? '')
}

export default function ChatPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [lang, setLang] = useState<Lang>('pt')
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [themes, setThemes] = useState<Theme[]>([])
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null)
  const [query, setQuery] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionId] = useState(() => `s-${Date.now()}-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, language_preference')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.language_preference) setLang(profile.language_preference)
      setIsAdmin(profile?.role === 'admin')

      const [{ data: themeRows }, { data: faqRows }] = await Promise.all([
        supabase.from('themes').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('faqs').select('*').eq('is_active', true).order('sort_order'),
      ])

      setThemes(themeRows ?? [])
      setFaqs(faqRows ?? [])
      setLoading(false)
    })()
  }, [router, supabase])

  const copy = COPY[lang]

  const filteredThemes = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return themes

    return themes.filter((theme) => {
      const text = [
        theme.title_pt,
        theme.title_en,
        theme.title_es,
        theme.description_pt,
        theme.description_en,
        theme.description_es,
        ...faqs
          .filter((faq) => faq.theme_id === theme.id)
          .flatMap((faq) => [faq.question_pt, faq.question_en, faq.question_es, faq.answer_pt, faq.answer_en, faq.answer_es]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return text.includes(term)
    })
  }, [faqs, query, themes])

  const visibleFaqs = useMemo(() => {
    const base = selectedTheme ? faqs.filter((faq) => faq.theme_id === selectedTheme.id) : faqs
    const term = query.trim().toLowerCase()
    if (!term || !selectedTheme) return base
    return base.filter((faq) =>
      [faq.question_pt, faq.question_en, faq.question_es, faq.answer_pt, faq.answer_en, faq.answer_es]
        .join(' ')
        .toLowerCase()
        .includes(term)
    )
  }, [faqs, query, selectedTheme])

  const logEvent = useCallback(
    async (event: 'theme_opened' | 'question_opened', themeId: string | null, faqId?: string | null) => {
      if (!userId) return
      await supabase.from('usage_logs').insert({
        user_id: userId,
        session_id: sessionId,
        event_type: event,
        detected_language: lang,
        theme_id: themeId,
        faq_matched_id: faqId ?? null,
        query_text: query.trim() || null,
        confidence: faqId ? 1 : null,
      })
    },
    [lang, query, sessionId, supabase, userId]
  )

  const openTheme = async (theme: Theme) => {
    setSelectedTheme(theme)
    setSelectedFaq(null)
    setFeedbackSent(false)
    await logEvent('theme_opened', theme.id)
  }

  const openFaq = async (faq: Faq) => {
    setSelectedFaq(faq)
    setFeedbackSent(false)
    await logEvent('question_opened', faq.theme_id, faq.id)
  }

  const sendFeedback = async (helpful: boolean) => {
    if (!selectedFaq || !userId) return
    setFeedbackSent(true)
    await supabase
      .from('usage_logs')
      .update({ was_helpful: helpful })
      .eq('session_id', sessionId)
      .eq('faq_matched_id', selectedFaq.id)
      .eq('user_id', userId)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-[#f5f7f9]">
      <header className="border-b border-[#dfe6ec] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-4">
            <img src="/logo-minerva.webp" alt="Minerva Foods" className="h-10 w-auto" />
            <div className="hidden border-l border-[#dfe6ec] pl-4 sm:block">
              <p className="text-sm font-bold text-[#142338]">FAQ Global</p>
              <p className="text-xs text-slate-500">International Offices</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-[#dfe6ec] bg-[#f5f7f9]">
              {(['pt', 'en', 'es'] as Lang[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setLang(item)}
                  className="px-3 py-1.5 text-xs font-bold"
                  style={{
                    background: lang === item ? '#2f5b7c' : 'transparent',
                    color: lang === item ? '#fff' : '#475569',
                  }}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>
            {isAdmin && (
              <button
                onClick={() => router.push('/admin/statistics')}
                className="rounded-lg p-2 text-[#2f5b7c] hover:bg-[#eef3f6]"
                title="Admin"
              >
                <BarChart3 className="h-5 w-5" />
              </button>
            )}
            <button onClick={logout} className="rounded-lg p-2 text-[#9f1724] hover:bg-red-50" title="Sair">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[380px_1fr] lg:px-8">
        <aside className="space-y-5">
          <div className="rounded-lg bg-[#142338] p-5 text-white shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#ef4650]">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold leading-tight">{copy.hello}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-200">{copy.subtitle}</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.search}
              className="w-full rounded-lg border border-[#dfe6ec] bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-[#2f5b7c] focus:ring-2 focus:ring-[#2f5b7c]/15"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{copy.themes}</p>
            <div className="space-y-2">
              {loading ? (
                <div className="rounded-lg border border-[#dfe6ec] bg-white p-4 text-sm text-slate-500">Carregando...</div>
              ) : filteredThemes.length ? (
                filteredThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => openTheme(theme)}
                    className="w-full rounded-lg border border-[#dfe6ec] bg-white p-4 text-left shadow-sm transition hover:border-[#2f5b7c]"
                    style={{ borderColor: selectedTheme?.id === theme.id ? '#2f5b7c' : undefined }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#142338]">{pick(theme, 'title', lang)}</p>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{pick(theme, 'description', lang)}</p>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-[#ef4650]" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-lg border border-[#dfe6ec] bg-white p-4 text-sm text-slate-500">{copy.empty}</div>
              )}
            </div>
          </div>
        </aside>

        <section className="min-h-[620px] rounded-lg border border-[#dfe6ec] bg-white shadow-sm">
          <div className="border-b border-[#dfe6ec] p-5">
            {selectedTheme ? (
              <button onClick={() => setSelectedTheme(null)} className="mb-3 flex items-center gap-2 text-sm font-bold text-[#2f5b7c]">
                <ArrowLeft className="h-4 w-4" />
                {copy.back}
              </button>
            ) : null}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef3f6] text-[#2f5b7c]">
                <Globe2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#142338]">
                  {selectedTheme ? pick(selectedTheme, 'title', lang) : copy.themes}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedTheme ? pick(selectedTheme, 'description', lang) : copy.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="grid min-h-[540px] lg:grid-cols-[minmax(280px,420px)_1fr]">
            <div className="border-b border-[#dfe6ec] p-5 lg:border-b-0 lg:border-r">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{copy.questions}</p>
              <div className="space-y-2">
                {visibleFaqs.length ? (
                  visibleFaqs.map((faq) => (
                    <button
                      key={faq.id}
                      onClick={() => openFaq(faq)}
                      className="w-full rounded-lg border border-[#dfe6ec] p-3 text-left text-sm transition hover:border-[#ef4650] hover:bg-red-50/40"
                      style={{ background: selectedFaq?.id === faq.id ? '#fff5f5' : '#fff' }}
                    >
                      <div className="flex items-start gap-2">
                        <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ef4650]" />
                        <span className="font-semibold text-[#142338]">{pick(faq, 'question', lang)}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="rounded-lg bg-[#f5f7f9] p-4 text-sm text-slate-500">{copy.empty}</p>
                )}
              </div>
            </div>

            <article className="p-6">
              {selectedFaq ? (
                <div className="animate-fade-up">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#ef4650]">Resposta oficial</p>
                  <h3 className="mt-2 text-2xl font-bold leading-tight text-[#142338]">{pick(selectedFaq, 'question', lang)}</h3>
                  <div className="mt-5 whitespace-pre-wrap rounded-lg border border-[#dfe6ec] bg-[#f8fafc] p-5 text-[15px] leading-7 text-slate-700">
                    {pick(selectedFaq, 'answer', lang)}
                  </div>

                  <div className="mt-5 rounded-lg border border-[#dfe6ec] p-4">
                    {feedbackSent ? (
                      <p className="text-sm font-semibold text-[#2f5b7c]">{copy.thanks}</p>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#142338]">{copy.helpful}</p>
                        <div className="flex gap-2">
                          <button onClick={() => sendFeedback(true)} className="rounded-lg border border-[#dfe6ec] p-2 text-[#2f5b7c] hover:bg-[#eef3f6]">
                            <ThumbsUp className="h-4 w-4" />
                          </button>
                          <button onClick={() => sendFeedback(false)} className="rounded-lg border border-[#dfe6ec] p-2 text-[#ef4650] hover:bg-red-50">
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[450px] items-center justify-center rounded-lg border border-dashed border-[#dfe6ec] bg-[#f8fafc] p-8 text-center">
                  <div>
                    <HelpCircle className="mx-auto h-10 w-10 text-[#2f5b7c]" />
                    <p className="mt-3 text-sm font-semibold text-[#142338]">{copy.subtitle}</p>
                  </div>
                </div>
              )}
            </article>
          </div>
        </section>
      </section>
    </main>
  )
}
