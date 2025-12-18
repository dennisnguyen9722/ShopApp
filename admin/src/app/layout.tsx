import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/AuthContext' // 👈 1. IMPORT CÁI NÀY

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'SuperMall Admin',
  description: 'Hệ thống quản lý SuperMall'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 👇 2. BỌC PROVIDER Ở ĐÂY */}
        <AuthProvider>{children}</AuthProvider>

        {/* Toaster để ngoài Provider hay trong đều được, để cuối body là chuẩn */}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
