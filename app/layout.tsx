import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Naruto vs Sasuke - 2D Fighter',
  description: 'MUGEN-style 2D fighting game featuring Naruto and Sasuke',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
