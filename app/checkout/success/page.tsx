'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('id')
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (paymentId) {
      api.checkout.getPaymentStatus(paymentId)
        .then(setPayment)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [paymentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h1 className="text-3xl font-bold">Pagamento Aprovado!</h1>
        <p className="text-gray-600">
          Sua assinatura foi confirmada com sucesso.
        </p>
        {payment && (
          <div className="bg-gray-50 rounded-lg p-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Valor:</span>
              <span className="font-semibold">{formatCurrency(payment.finalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Método:</span>
              <span className="font-semibold">
                {payment.paymentMethod === 'PIX' ? 'Pix' : 'Cartão de Crédito'}
              </span>
            </div>
            {payment.paymentMethod === 'CREDIT_CARD' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Parcelas:</span>
                <span className="font-semibold">{payment.installments}x</span>
              </div>
            )}
          </div>
        )}
        <Button onClick={() => window.location.href = '/'} className="w-full">
          Voltar ao início
        </Button>
      </div>
    </div>
  )
}

