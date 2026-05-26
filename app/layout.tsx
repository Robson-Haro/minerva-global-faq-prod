import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FAQ Global | Minerva Foods',
  description:
    'Central de perguntas e respostas para escritorios internacionais Minerva Foods em Portugues, English e Espanol.',
  icons: { icon: '/logo-minerva.webp' },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
