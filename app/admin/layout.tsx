'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { LogOut, CreditCard, Users, Ticket, BarChart3 } from 'lucide-react'
import { Loading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { ChatWidget } from '@/components/admin/ChatWidget'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Não verificar autenticação na página de login
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }

    const token = auth.getToken()
    if (!token) {
      router.push('/admin/login')
      return
    }

    api.admin.getMe(token)
      .then(setAdmin)
      .catch(() => {
        auth.removeToken()
        router.push('/admin/login')
      })
      .finally(() => setLoading(false))
  }, [router, pathname])

  const handleLogout = () => {
    auth.removeToken()
    router.push('/admin/login')
  }

  // Se estiver na página de login, renderizar apenas o conteúdo sem o layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (!admin) {
    return null
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/payments', label: 'Pagamentos', icon: CreditCard },
    { href: '/admin/users', label: 'Usuários', icon: Users },
    { href: '/admin/coupons', label: 'Cupons', icon: Ticket },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold">Painel Administrativo</h1>
              <nav className="flex space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{admin.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <ChatWidget />
    </div>
  )
}

