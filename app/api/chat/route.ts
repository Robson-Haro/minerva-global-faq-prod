import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Lang = 'pt' | 'en' | 'es'

type FaqRow = {
  id: string
  theme_id: string | null
  question_pt: string
  question_en: string
  question_es: string
  answer_pt: string
  answer_en: string
  answer_es: string
}

function detectLanguage(text: string): Lang {
  const value = text.toLowerCase()
  const en = /\b(how|what|when|where|why|policy|request|office|hours|vacation)\b/.test(value)
  const es = /\b(como|cual|cuando|donde|politica|solicitar|vacaciones|oficina)\b|[¿¡ñ]/.test(value)
  const pt = /\b(como|qual|quando|onde|politica|solicitar|ferias|escritorio)\b|[ãõç]/.test(value)
  if (en) return 'en'
  if (es && !pt) return 'es'
  return 'pt'
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
}

function score(query: string, content: string) {
  const q = normalize(query)
  const c = new Set(normalize(content))
  if (!q.length || !c.size) return 0
  const hits = q.filter((word) => c.has(word)).length
  return hits / Math.max(q.length, c.size)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email?.toLowerCase().endsWith('@minervafoods.com')) {
    return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 })
  }

  const { query, sessionId } = (await request.json()) as {
    query?: string
    sessionId?: string
  }

  if (!query || query.length > 500 || !sessionId) {
    return NextResponse.json({ error: 'Consulta invalida.' }, { status: 400 })
  }

  const lang = detectLanguage(query)
  const { data: faqs, error } = await supabase.from('faqs').select('*').eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: 'Erro ao consultar FAQs.' }, { status: 500 })
  }

  const ranked = ((faqs ?? []) as FaqRow[])
    .map((faq) => {
      const content = [
        faq[`question_${lang}`],
        faq.question_pt,
        faq.question_en,
        faq.question_es,
        faq[`answer_${lang}`],
      ].join(' ')

      return { faq, confidence: score(query, content) }
    })
    .sort((a, b) => b.confidence - a.confidence)

  const best = ranked[0]?.confidence > 0 ? ranked[0] : null

  await supabase.from('usage_logs').insert({
    user_id: user.id,
    session_id: sessionId,
    event_type: 'question',
    query_text: query.slice(0, 500),
    detected_language: lang,
    theme_id: best?.faq.theme_id ?? null,
    faq_matched_id: best?.faq.id ?? null,
    confidence: best?.confidence ?? 0,
  })

  if (!best) {
    const fallback = {
      pt: 'Nao encontrei uma resposta cadastrada para essa pergunta. Procure o tema mais proximo ou acione o responsavel pelo conteudo.',
      en: 'I could not find a registered answer for this question. Please check the closest topic or contact the content owner.',
      es: 'No encontre una respuesta registrada para esta pregunta. Revise el tema mas cercano o contacte al responsable del contenido.',
    }

    return NextResponse.json({ answer: fallback[lang], confidence: 0, faqId: null, detectedLanguage: lang })
  }

  return NextResponse.json({
    answer: best.faq[`answer_${lang}`] ?? best.faq.answer_pt,
    confidence: best.confidence,
    faqId: best.faq.id,
    detectedLanguage: lang,
  })
}
