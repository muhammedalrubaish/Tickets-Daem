import './globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'لوحة التحكم للبلاغات | وحدة بلدي',
  description: 'لوحة تحكم تفاعلية لعرض إحصائيات وبلاغات وحدة بلدي',
  icons: {
    icon: [
      { url: '/logo.png', sizes: '32x32' },
      { url: '/logo.png', sizes: '192x192' },
    ],
    apple: '/logo.png',
  },
}

export const viewport: Viewport = {
  width: 1200,
  initialScale: 1,
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  )
}
