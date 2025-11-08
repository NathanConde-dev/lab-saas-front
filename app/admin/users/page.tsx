'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    page: 1,
    search: '',
  })

  useEffect(() => {
    const token = auth.getToken()
    if (!token) return

    setLoading(true)
    api.admin.users.list(token, filters)
      .then((data: any) => {
        setUsers(data.users || [])
        setPagination(data.pagination)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filters])

  const handleSearch = () => {
    setFilters({ ...filters, search, page: 1 })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuários</h1>
        <p className="text-gray-600 mt-2">Gerencie todos os usuários</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch}>Buscar</Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Nome</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Telefone</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">CPF</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Pagamentos</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{user.name}</td>
                      <td className="py-3 px-4 text-sm">{user.email}</td>
                      <td className="py-3 px-4 text-sm">{user.phone}</td>
                      <td className="py-3 px-4 text-sm">{user.cpf}</td>
                      <td className="py-3 px-4 text-sm">{user._count?.payments || 0}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-gray-600">
                  Página {pagination.page} de {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

