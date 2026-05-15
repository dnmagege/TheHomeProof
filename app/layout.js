import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'TenantAI — AI Tenancy Management',
  description: 'AI-powered inventories, contract reading, damage detection, and compliance for landlords & tenants.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
