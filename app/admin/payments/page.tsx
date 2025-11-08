'use client'

import { useEffect, useState, useCallback } from 'react'
import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: 'all',
    paymentMethod: 'all',
    page: 1,
    limit: 20,
  })

  const loadPayments = useCallback(async () => {
    const token = auth.getToken()
    if (!token) {
      setError('Não autenticado')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const params: any = {}
      
      if (filters.page) params.page = filters.page
      if (filters.limit) params.limit = filters.limit
      if (filters.status && filters.status !== 'all') params.status = filters.status
      if (filters.paymentMethod && filters.paymentMethod !== 'all') params.paymentMethod = filters.paymentMethod
      
      console.log('Loading payments with params:', params)
      const data: any = await api.admin.payments.list(token, params)
      console.log('Payments data received:', data)
      
      // Tratar diferentes formatos de resposta
      if (Array.isArray(data)) {
        // Se a resposta for um array direto (sem paginação)
        setPayments(data)
        setPagination(null)
      } else if (data && typeof data === 'object') {
        // Se a resposta tiver estrutura de paginação
        setPayments(Array.isArray(data.payments) ? data.payments : [])
        setPagination(data.pagination || null)
      } else {
        setPayments([])
        setPagination(null)
      }
    } catch (err) {
      console.error('Error loading payments:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar pagamentos'
      setError(errorMessage)
      
      // Se for erro de autenticação, redirecionar para login
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        auth.removeToken()
        window.location.href = '/admin/login'
      }
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      REJECTED: 'bg-red-100 text-red-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pagamentos</h1>
        <p className="text-gray-600 mt-2">Gerencie todos os pagamentos</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="PROCESSING">Processando</SelectItem>
              <SelectItem value="APPROVED">Aprovado</SelectItem>
              <SelectItem value="REJECTED">Rejeitado</SelectItem>
              <SelectItem value="EXPIRED">Expirado</SelectItem>
              <SelectItem value="CANCELLED">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.paymentMethod}
            onValueChange={(value) => setFilters({ ...filters, paymentMethod: value, page: 1 })}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="CREDIT_CARD">Cartão</SelectItem>
              <SelectItem value="PIX">Pix</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Carregando pagamentos...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Nenhum pagamento encontrado</p>
            {(filters.status !== 'all' || filters.paymentMethod !== 'all') && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setFilters({ status: 'all', paymentMethod: 'all', page: 1, limit: 20 })}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Valor</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Método</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-mono">
                        {payment.id ? `${payment.id.slice(0, 8)}...` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {payment.user?.name || 'N/A'}
                        {payment.user?.email && (
                          <>
                            <br />
                            <span className="text-gray-500 text-xs">{payment.user.email}</span>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold">
                        {formatCurrency(payment.finalAmount || payment.amount || 0)}
                        {payment.discountAmount && payment.discountAmount > 0 && (
                          <span className="block text-xs text-green-600 font-normal">
                            Desconto: {formatCurrency(payment.discountAmount)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {payment.paymentMethod === 'PIX' 
                          ? 'Pix' 
                          : `Cartão${payment.installments ? ` (${payment.installments}x)` : ''}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status || 'PENDING')}`}>
                          {payment.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {payment.createdAt 
                          ? format(new Date(payment.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.total !== undefined && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p>
                    Mostrando {((pagination.page || 1) - 1) * (pagination.limit || 20) + 1} a{' '}
                    {Math.min((pagination.page || 1) * (pagination.limit || 20), pagination.total)} de {pagination.total} pagamentos
                  </p>
                  {pagination.totalPages > 1 && (
                    <p className="mt-1">Página {pagination.page || 1} de {pagination.totalPages}</p>
                  )}
                </div>
                {pagination.totalPages > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={(pagination.page || 1) === 1}
                      onClick={() => setFilters({ ...filters, page: (pagination.page || 1) - 1 })}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      disabled={(pagination.page || 1) === pagination.totalPages}
                      onClick={() => setFilters({ ...filters, page: (pagination.page || 1) + 1 })}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

