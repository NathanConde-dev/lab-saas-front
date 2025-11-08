'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, Users, Ticket, TrendingUp } from 'lucide-react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = auth.getToken()
    if (!token) return

    api.admin.payments.getStats(token)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  const statCards = [
    {
      title: 'Total de Pagamentos',
      value: stats?.total || 0,
      icon: CreditCard,
      color: 'bg-blue-500',
    },
    {
      title: 'Pagamentos Aprovados',
      value: stats?.byStatus?.APPROVED || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Cartão de Crédito',
      value: stats?.byMethod?.CREDIT_CARD || 0,
      icon: CreditCard,
      color: 'bg-purple-500',
    },
    {
      title: 'Pix',
      value: stats?.byMethod?.PIX || 0,
      icon: CreditCard,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Valores</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold">{formatCurrency(stats.totalAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Aprovado:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(stats.approvedAmount || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Status</h2>
            <div className="space-y-2">
              {Object.entries(stats.byStatus || {}).map(([status, count]: [string, any]) => (
                <div key={status} className="flex justify-between">
                  <span className="text-gray-600">{status}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

