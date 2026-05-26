'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle, FolderPlus, HelpCircle, Loader2, Plus, Save, Search, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Theme = {
  id: string
  title_pt: string
  title_en: string
  title_es: string
  description_pt: string | null
  description_en: string | null
  description_es: string | null
  sort_order: number
  is_active: boolean
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
  sort_order: number
  is_active: boolean
}

const emptyTheme = {
  title_pt: '',
  title_en: '',
  title_es: '',
  description_pt: '',
  description_en: '',
  description_es: '',
  sort_order: 0,
  is_active: true,
}

const emptyFaq = {
  theme_id: '',
  question_pt: '',
  question_en: '',
  question_es: '',
  answer_pt: '',
  answer_en: '',
  answer_es: '',
  sort_order: 0,
  is_active: true,
}

type ContentLang = 'pt' | 'en' | 'es'
type ThemeForm = typeof emptyTheme
type FaqForm = typeof emptyFaq

export default function AdminFaqsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [themes, setThemes] = useState<Theme[]>([])
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [themeForm, setThemeForm] = useState(emptyTheme)
  const [faqForm, setFaqForm] = useState(emptyFaq)
  const [editingTheme, setEditingTheme] = useState<string | null>(null)
  const [editingFaq, setEditingFaq] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: themeRows }, { data: faqRows }, { data: auth }] = await Promise.all([
      supabase.from('themes').select('*').order('sort_order'),
      supabase.from('faqs').select('*').order('sort_order'),
      supabase.auth.getUser(),
    ])
    setThemes(themeRows ?? [])
    setFaqs(faqRows ?? [])
    setUserId(auth.user?.id ?? null)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredFaqs = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return faqs
    return faqs.filter((faq) =>
      [faq.question_pt, faq.question_en, faq.question_es, faq.answer_pt, faq.answer_en, faq.answer_es]
        .join(' ')
        .toLowerCase()
        .includes(term)
    )
  }, [faqs, query])

  const saveTheme = async () => {
    if (!userId) return
    if (!themeForm.title_pt || !themeForm.title_en || !themeForm.title_es) {
      setMessage('Preencha o titulo do tema nos tres idiomas.')
      return
    }

    setSaving(true)
    const payload = { ...themeForm, created_by: userId }
    const { error } = editingTheme
      ? await supabase.from('themes').update(themeForm).eq('id', editingTheme)
      : await supabase.from('themes').insert(payload)

    setSaving(false)
    if (error) {
      setMessage('Erro ao salvar tema.')
      return
    }
    setThemeForm(emptyTheme)
    setEditingTheme(null)
    setMessage('Tema salvo com sucesso.')
    await loadData()
  }

  const saveFaq = async () => {
    if (!userId) return
    const required = ['question_pt', 'question_en', 'question_es', 'answer_pt', 'answer_en', 'answer_es'] as const
    if (required.some((field) => !faqForm[field])) {
      setMessage('Preencha pergunta e resposta nos tres idiomas.')
      return
    }

    setSaving(true)
    const payload = { ...faqForm, theme_id: faqForm.theme_id || null, created_by: userId }
    const { error } = editingFaq
      ? await supabase.from('faqs').update({ ...faqForm, theme_id: faqForm.theme_id || null }).eq('id', editingFaq)
      : await supabase.from('faqs').insert(payload)

    setSaving(false)
    if (error) {
      setMessage('Erro ao salvar pergunta.')
      return
    }
    setFaqForm(emptyFaq)
    setEditingFaq(null)
    setMessage('Pergunta salva com sucesso.')
    await loadData()
  }

  const removeTheme = async (id: string) => {
    if (!confirm('Excluir este tema? As perguntas ficam sem tema.')) return
    await supabase.from('themes').delete().eq('id', id)
    await loadData()
  }

  const removeFaq = async (id: string) => {
    if (!confirm('Excluir esta pergunta?')) return
    await supabase.from('faqs').delete().eq('id', id)
    await loadData()
  }

  const editTheme = (theme: Theme) => {
    setEditingTheme(theme.id)
    setThemeForm({
      title_pt: theme.title_pt,
      title_en: theme.title_en,
      title_es: theme.title_es,
      description_pt: theme.description_pt ?? '',
      description_en: theme.description_en ?? '',
      description_es: theme.description_es ?? '',
      sort_order: theme.sort_order,
      is_active: theme.is_active,
    })
  }

  const editFaq = (faq: Faq) => {
    setEditingFaq(faq.id)
    setFaqForm({
      theme_id: faq.theme_id ?? '',
      question_pt: faq.question_pt,
      question_en: faq.question_en,
      question_es: faq.question_es,
      answer_pt: faq.answer_pt,
      answer_en: faq.answer_en,
      answer_es: faq.answer_es,
      sort_order: faq.sort_order,
      is_active: faq.is_active,
    })
  }

  return (
    <main className="min-h-screen bg-[#f5f7f9] p-4 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#142338]">Cadastro de Temas e Perguntas</h1>
          <p className="mt-1 text-sm text-slate-500">Estruture o FAQ em tema, pergunta prevista e resposta correta nos tres idiomas.</p>
        </div>
        {message && (
          <button onClick={() => setMessage(null)} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#2f5b7c] shadow-sm">
            <CheckCircle className="h-4 w-4" />
            {message}
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex h-80 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#2f5b7c]" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="space-y-6">
            <div className="rounded-lg border border-[#dfe6ec] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-[#ef4650]" />
                <h2 className="font-bold text-[#142338]">{editingTheme ? 'Editar tema' : 'Novo tema'}</h2>
              </div>
              <div className="space-y-3">
                {(['pt', 'en', 'es'] as ContentLang[]).map((lang) => (
                  <div key={lang} className="space-y-2">
                    <input
                      value={themeForm[`title_${lang}` as keyof ThemeForm] as string}
                      onChange={(e) => setThemeForm((prev) => ({ ...prev, [`title_${lang}`]: e.target.value }))}
                      placeholder={`Titulo ${lang.toUpperCase()}`}
                      className="w-full rounded-lg border border-[#dfe6ec] px-3 py-2 text-sm outline-none focus:border-[#2f5b7c]"
                    />
                    <textarea
                      value={themeForm[`description_${lang}` as keyof ThemeForm] as string}
                      onChange={(e) => setThemeForm((prev) => ({ ...prev, [`description_${lang}`]: e.target.value }))}
                      placeholder={`Descricao ${lang.toUpperCase()}`}
                      rows={2}
                      className="w-full rounded-lg border border-[#dfe6ec] px-3 py-2 text-sm outline-none focus:border-[#2f5b7c]"
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#142338]">
                    <input
                      type="checkbox"
                      checked={themeForm.is_active}
                      onChange={(e) => setThemeForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                    />
                    Tema ativo
                  </label>
                  <button onClick={saveTheme} disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#2f5b7c] px-4 py-2 text-sm font-bold text-white">
                    <Save className="h-4 w-4" />
                    Salvar
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#dfe6ec] bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-bold text-[#142338]">Temas cadastrados</h2>
              <div className="space-y-2">
                {themes.map((theme) => (
                  <div key={theme.id} className="flex items-start justify-between gap-3 rounded-lg border border-[#dfe6ec] p-3">
                    <button onClick={() => editTheme(theme)} className="text-left">
                      <p className="font-semibold text-[#142338]">{theme.title_pt}</p>
                      <p className="text-xs text-slate-500">{theme.is_active ? 'Ativo' : 'Inativo'}</p>
                    </button>
                    <button onClick={() => removeTheme(theme.id)} className="rounded-lg p-2 text-[#ef4650] hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-lg border border-[#dfe6ec] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#ef4650]" />
                <h2 className="font-bold text-[#142338]">{editingFaq ? 'Editar pergunta' : 'Nova pergunta'}</h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <select
                  value={faqForm.theme_id}
                  onChange={(e) => setFaqForm((prev) => ({ ...prev, theme_id: e.target.value }))}
                  className="rounded-lg border border-[#dfe6ec] px-3 py-2 text-sm outline-none focus:border-[#2f5b7c] lg:col-span-2"
                >
                  <option value="">Sem tema</option>
                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.title_pt}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#142338]">
                  <input
                    type="checkbox"
                    checked={faqForm.is_active}
                    onChange={(e) => setFaqForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  />
                  Pergunta ativa
                </label>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {(['pt', 'en', 'es'] as ContentLang[]).map((lang) => (
                  <div key={lang} className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{lang}</p>
                    <textarea
                      value={faqForm[`question_${lang}` as keyof FaqForm] as string}
                      onChange={(e) => setFaqForm((prev) => ({ ...prev, [`question_${lang}`]: e.target.value }))}
                      placeholder="Pergunta prevista"
                      rows={3}
                      className="w-full rounded-lg border border-[#dfe6ec] px-3 py-2 text-sm outline-none focus:border-[#2f5b7c]"
                    />
                    <textarea
                      value={faqForm[`answer_${lang}` as keyof FaqForm] as string}
                      onChange={(e) => setFaqForm((prev) => ({ ...prev, [`answer_${lang}`]: e.target.value }))}
                      placeholder="Resposta correta"
                      rows={6}
                      className="w-full rounded-lg border border-[#dfe6ec] px-3 py-2 text-sm outline-none focus:border-[#2f5b7c]"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={saveFaq} disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#ef4650] px-4 py-2 text-sm font-bold text-white">
                  <Plus className="h-4 w-4" />
                  {editingFaq ? 'Salvar alteracoes' : 'Criar pergunta'}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-[#dfe6ec] bg-white shadow-sm">
              <div className="border-b border-[#dfe6ec] p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar pergunta"
                    className="w-full rounded-lg border border-[#dfe6ec] py-2 pl-10 pr-3 text-sm outline-none focus:border-[#2f5b7c]"
                  />
                </div>
              </div>
              <div className="divide-y divide-[#dfe6ec]">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id} className="flex items-start justify-between gap-4 p-4">
                    <button onClick={() => editFaq(faq)} className="text-left">
                      <p className="font-semibold text-[#142338]">{faq.question_pt}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{faq.answer_pt}</p>
                      <p className="mt-2 text-xs text-slate-400">{faq.is_active ? 'Ativa' : 'Inativa'}</p>
                    </button>
                    <button onClick={() => removeFaq(faq.id)} className="rounded-lg p-2 text-[#ef4650] hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
