import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

const PUBLIC_PATHS = ['/login', '/register']

function isCorporateEmail(email?: string | null) {
  return Boolean(email?.toLowerCase().endsWith('@minervafoods.com'))
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const path = request.nextUrl.pathname
  const isProtected = path.startsWith('/chat') || path.startsWith('/admin')
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', path)
    return NextResponse.redirect(url)
  }

  if (user && !isCorporateEmail(user.email)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=domain', request.url))
  }

  if (user && PUBLIC_PATHS.includes(path)) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  if (user && path.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/chat', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo-minerva.webp|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
