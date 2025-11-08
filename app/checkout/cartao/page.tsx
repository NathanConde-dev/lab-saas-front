'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader'
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatCurrency, formatCardNumber, formatExpiryDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const PLAN_AMOUNT = 154.80

const cardSchema = z.object({
  cardNumber: z.string().min(13, 'Número do cartão inválido'),
  cardName: z.string().min(3, 'Nome inválido'),
  cardExpiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Data inválida'),
  cardCvv: z.string().min(3, 'CVV inválido'),
})

type CardFormData = z.infer<typeof cardSchema>

export default function CheckoutCartaoPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const name = searchParams.get('name') || ''
  const email = searchParams.get('email') || ''
  const phone = searchParams.get('phone') || ''
  const cpf = searchParams.get('cpf') || ''
  const installments = parseInt(searchParams.get('installments') || '12')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
  })

  const installmentValue = PLAN_AMOUNT / installments

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    setValue('cardNumber', formatted.replace(/\s/g, ''))
    e.target.value = formatted
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value)
    setValue('cardExpiry', formatted.replace(/\D/g, ''))
    e.target.value = formatted
  }

  const onSubmit = async (data: CardFormData) => {
    if (!name || !email || !phone || !cpf) {
      router.push('/checkout')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Em produção, aqui você geraria o token do cartão com o gateway de pagamento
      // Por enquanto, vamos simular
      const paymentToken = 'token-simulado-' + Date.now()

      const response = await api.checkout.create({
        customer: {
          name,
          email,
          phone: phone.replace(/\D/g, ''),
          cpf: cpf.replace(/\D/g, ''),
        },
        amount: PLAN_AMOUNT,
        paymentMethod: 'CREDIT_CARD',
        installments,
        creditCard: {
          paymentToken,
          billingAddress: {
            street: 'Rua Exemplo',
            number: '123',
            neighborhood: 'Centro',
            zipcode: '01234567',
            city: 'São Paulo',
            state: 'SP',
          },
        },
      })

      router.push(`/checkout/success?id=${response.id}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar pagamento'
      setError(errorMessage)
      toast({
        variant: 'destructive',
        title: 'Erro no pagamento',
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CheckoutHeader />

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Olá, {name}!</h1>
          <p className="text-gray-600 text-base">Complete seus dados para realizar sua assinatura</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="flex-1 max-w-2xl space-y-8">
            {/* ETAPA 1: Informações pessoais */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-900">ETAPA 1</h2>
                <h3 className="text-sm font-bold text-gray-900">Informações pessoais</h3>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-900">Nome</p>
                  <p className="text-gray-900 text-base bg-white border border-gray-300 rounded-lg px-4 py-2.5">{name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-900">E-mail</p>
                  <p className="text-gray-900 text-base bg-white border border-gray-300 rounded-lg px-4 py-2.5">{email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-900">Telefone</p>
                  <p className="text-gray-900 text-base bg-white border border-gray-300 rounded-lg px-4 py-2.5">{phone}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-900">CPF</p>
                  <p className="text-gray-900 text-base bg-white border border-gray-300 rounded-lg px-4 py-2.5">{cpf}</p>
                </div>
              </div>
            </div>

            {/* ETAPA 2: Método de pagamento */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-900">ETAPA 2: Método de pagamento</h2>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="h-4 w-4 rounded-full border-2 border-gray-900 bg-gray-900"></div>
                <span className="text-base font-normal">Cartão de crédito</span>
              </div>
            </div>

            {/* ETAPA 3: Informações do cartão */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-900">ETAPA 3: Informe os dados do cartão</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">Número do cartão</Label>
                  <Input
                    id="cardNumber"
                    placeholder="Digite o número do cartão"
                    className="bg-gray-50 border-gray-300"
                    {...register('cardNumber')}
                    onChange={handleCardNumberChange}
                  />
                  {errors.cardNumber && (
                    <p className="text-sm text-red-500">{errors.cardNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName" className="text-sm font-medium text-gray-700">Nome impresso no cartão</Label>
                  <Input
                    id="cardName"
                    placeholder="Digite o nome impresso no cartão"
                    className="bg-gray-50 border-gray-300"
                    {...register('cardName')}
                  />
                  {errors.cardName && (
                    <p className="text-sm text-red-500">{errors.cardName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiry" className="text-sm font-medium text-gray-700">Data de validade</Label>
                    <Input
                      id="cardExpiry"
                      placeholder="00/00"
                      className="bg-gray-50 border-gray-300"
                      {...register('cardExpiry')}
                      onChange={handleExpiryChange}
                    />
                    {errors.cardExpiry && (
                      <p className="text-sm text-red-500">{errors.cardExpiry.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardCvv" className="text-sm font-medium text-gray-700">Código de segurança</Label>
                    <Input
                      id="cardCvv"
                      placeholder="CVV"
                      maxLength={4}
                      className="bg-gray-50 border-gray-300"
                      {...register('cardCvv')}
                    />
                    {errors.cardCvv && (
                      <p className="text-sm text-red-500">{errors.cardCvv.message}</p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-medium"
                >
                  {isSubmitting ? 'Processando...' : 'Confirmar assinatura'}
                </Button>
              </form>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Ao confirmar sua assinatura você concorda com os{' '}
              <a href="#" className="text-gray-900 font-semibold underline">termos de uso</a> e{' '}
              <a href="#" className="text-gray-900 font-semibold underline">política de privacidade</a>.
            </p>
          </div>

          <div className="lg:sticky lg:top-8 lg:h-fit">
            <CheckoutSummary
              planName="Plano Anual"
              baseAmount={PLAN_AMOUNT}
              finalAmount={PLAN_AMOUNT}
              installments={installments}
              installmentValue={installmentValue}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

