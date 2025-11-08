'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader'
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCPF, formatPhone, formatBirthDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const checkoutSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  birthDate: z.string().optional(),
  cpf: z.string().min(11, 'CPF inválido'),
  paymentMethod: z.enum(['CREDIT_CARD', 'PIX']),
  cardNumber: z.string().optional(),
  cardName: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

const PLAN_AMOUNT = 154.80

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [installments, setInstallments] = useState(12)
  const [discountAmount, setDiscountAmount] = useState(0) // Inicializa sem desconto (cartão padrão)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'CREDIT_CARD',
    },
  })

  const paymentMethod = watch('paymentMethod')
  const installmentValue = PLAN_AMOUNT / installments
  
  // Atualizar desconto quando método de pagamento mudar
  useEffect(() => {
    if (paymentMethod === 'PIX') {
      setDiscountAmount(PLAN_AMOUNT * 0.15)
    } else {
      setDiscountAmount(0)
    }
  }, [paymentMethod])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setValue('phone', formatted.replace(/\D/g, ''))
    e.target.value = formatted
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setValue('cpf', formatted.replace(/\D/g, ''))
    e.target.value = formatted
  }

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBirthDate(e.target.value)
    setValue('birthDate', formatted.replace(/\D/g, ''))
    e.target.value = formatted
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (data.paymentMethod === 'PIX') {
        router.push(`/checkout/pix?name=${encodeURIComponent(data.name)}&email=${encodeURIComponent(data.email)}&phone=${encodeURIComponent(data.phone)}&cpf=${encodeURIComponent(data.cpf)}${data.birthDate ? `&birthDate=${encodeURIComponent(data.birthDate)}` : ''}`)
      } else {
        router.push(`/checkout/cartao?name=${encodeURIComponent(data.name)}&email=${encodeURIComponent(data.email)}&phone=${encodeURIComponent(data.phone)}&cpf=${encodeURIComponent(data.cpf)}&installments=${installments}${data.birthDate ? `&birthDate=${encodeURIComponent(data.birthDate)}` : ''}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar checkout'
      setError(errorMessage)
      toast({
        variant: 'destructive',
        title: 'Erro no checkout',
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const PIX_DISCOUNT_PERCENTAGE = paymentMethod === 'PIX' ? 0.15 : 0
  const currentDiscountAmount = PLAN_AMOUNT * PIX_DISCOUNT_PERCENTAGE
  const currentFinalAmount = PLAN_AMOUNT - currentDiscountAmount

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CheckoutHeader />

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Olá, Nome!</h1>
          <p className="text-gray-600 text-base">Complete seus dados para realizar sua assinatura</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Coluna Esquerda - Formulário */}
          <div className="flex-1">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* ETAPA 1: Informações pessoais */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-gray-900">ETAPA 1</h2>
                  <h3 className="text-sm font-bold text-gray-900">Informações pessoais</h3>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-bold text-gray-900 block">Nome</Label>
                    <Input
                      id="name"
                      placeholder="Digite seu nome completo"
                      className="bg-white border-gray-300 rounded-lg"
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold text-gray-900 block">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Digite seu e-mail"
                      className="bg-white border-gray-300 rounded-lg"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-bold text-gray-900 block">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="Digite seu telefone"
                      className="bg-white border-gray-300 rounded-lg"
                      {...register('phone')}
                      onChange={handlePhoneChange}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate" className="text-sm font-bold text-gray-900 block">Data de nascimento</Label>
                    <Input
                      id="birthDate"
                      placeholder="Digite sua data de nascimento"
                      className="bg-white border-gray-300 rounded-lg"
                      {...register('birthDate')}
                      onChange={handleBirthDateChange}
                      maxLength={10}
                    />
                    {errors.birthDate && (
                      <p className="text-sm text-red-500">{errors.birthDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="text-sm font-bold text-gray-900 block">CPF</Label>
                    <Input
                      id="cpf"
                      placeholder="Digite seu CPF"
                      className="bg-white border-gray-300 rounded-lg"
                      {...register('cpf')}
                      onChange={handleCPFChange}
                    />
                    {errors.cpf && (
                      <p className="text-sm text-red-500">{errors.cpf.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ETAPA 2: Método de pagamento */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-gray-900">ETAPA 2</h2>
                  <h3 className="text-sm font-bold text-gray-900">Método de pagamento</h3>
                </div>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setValue('paymentMethod', value as 'CREDIT_CARD' | 'PIX')}
                  className="space-y-3"
                >
                  <div className={`flex items-center space-x-3 p-4 bg-white border rounded-lg ${paymentMethod === 'CREDIT_CARD' ? 'border-gray-900' : 'border-gray-300'}`}>
                    <RadioGroupItem value="CREDIT_CARD" id="credit-card" />
                    <Label htmlFor="credit-card" className="cursor-pointer text-base font-normal">
                      Cartão de crédito
                    </Label>
                  </div>
                  <div className={`flex items-center space-x-3 p-4 bg-white border rounded-lg ${paymentMethod === 'PIX' ? 'border-gray-900' : 'border-gray-300'}`}>
                    <RadioGroupItem value="PIX" id="pix" />
                    <Label htmlFor="pix" className="cursor-pointer text-base font-normal">
                      Pix
                    </Label>
                    <span className="ml-2 px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-md">
                      15% de desconto
                    </span>
                  </div>
                </RadioGroup>
              </div>

              {/* ETAPA 3: Informações do cartão (quando cartão selecionado) */}
              {paymentMethod === 'CREDIT_CARD' && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-gray-900">ETAPA 3</h2>
                    <h3 className="text-sm font-bold text-gray-900">Informe os dados do cartão</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber" className="text-sm font-bold text-gray-900 block">Número do cartão</Label>
                      <Input
                        id="cardNumber"
                        placeholder="Digite o número do cartão"
                        className="bg-white border-gray-300 rounded-lg"
                        {...register('cardNumber')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardName" className="text-sm font-bold text-gray-900 block">Nome impresso no cartão</Label>
                      <Input
                        id="cardName"
                        placeholder="Digite o nome impresso no cartão"
                        className="bg-white border-gray-300 rounded-lg"
                        {...register('cardName')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardExpiry" className="text-sm font-bold text-gray-900 block">Data de validade</Label>
                        <Input
                          id="cardExpiry"
                          placeholder="00/00"
                          className="bg-white border-gray-300 rounded-lg"
                          {...register('cardExpiry')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardCvv" className="text-sm font-bold text-gray-900 block">Código de segurança</Label>
                        <Input
                          id="cardCvv"
                          placeholder="CVV"
                          className="bg-white border-gray-300 rounded-lg"
                          {...register('cardCvv')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-medium bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {isSubmitting ? 'Processando...' : 'Confirmar assinatura'}
                </Button>
                <p className="text-xs text-gray-600 text-center leading-relaxed">
                  Ao confirmar sua assinatura você concorda com os{' '}
                  <a href="#" className="text-gray-900 font-semibold underline">termos de uso</a> e{' '}
                  <a href="#" className="text-gray-900 font-semibold underline">política de privacidade</a>.
                </p>
              </div>
            </form>
          </div>

          {/* Coluna Direita - Fixa */}
          <div className="w-full lg:w-96 lg:sticky lg:top-8 lg:h-fit">
            {/* Resumo */}
            <CheckoutSummary
              planName="Plano Anual"
              baseAmount={PLAN_AMOUNT}
              discountAmount={currentDiscountAmount}
              finalAmount={currentFinalAmount}
              installments={paymentMethod === 'PIX' ? 1 : installments}
              installmentValue={paymentMethod === 'PIX' ? currentFinalAmount : installmentValue}
              onInstallmentsChange={setInstallments}
              showInstallmentSelector={paymentMethod === 'CREDIT_CARD'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

