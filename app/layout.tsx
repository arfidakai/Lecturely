import './globals.css'
import { AuthProvider } from './contexts/AuthContext'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lecturely - Record, Transcribe, Learn',
  description: 'Your AI-powered lecture recording and transcription companion',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}