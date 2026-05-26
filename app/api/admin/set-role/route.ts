import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, fullName } = (await request.json()) as {
      userId?: string
      email?: string
      fullName?: string
    }

    if (!userId || !email) {
      return NextResponse.json({ error: 'Dados invalidos.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail.endsWith('@minervafoods.com')) {
      return NextResponse.json(
        { error: 'Use apenas e-mail corporativo @minervafoods.com.' },
        { status: 403 }
      )
    }

    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)

    const role = adminEmails.includes(normalizedEmail) ? 'admin' : 'user'
    const supabase = createAdminClient()

    const { error } = await supabase.from('user_profiles').upsert(
      {
        id: userId,
        email: normalizedEmail,
        full_name: fullName?.trim() || null,
        role,
        language_preference: 'pt',
      },
      { onConflict: 'id' }
    )

    if (error) {
      console.error('[set-role] profile upsert failed', error)
      return NextResponse.json({ error: 'Erro ao configurar perfil.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, role })
  } catch (error) {
    console.error('[set-role] unexpected error', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
