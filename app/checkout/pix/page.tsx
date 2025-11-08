'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader'
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import QRCodeSVG from 'react-qr-code'
import { Loader2, Copy, Check } from 'lucide-react'
import { differenceInSeconds, addMinutes } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

const PLAN_AMOUNT = 154.80
const PIX_DISCOUNT_PERCENTAGE = 0.15
const PIX_DISCOUNT = PLAN_AMOUNT * PIX_DISCOUNT_PERCENTAGE
const FINAL_AMOUNT = PLAN_AMOUNT - PIX_DISCOUNT

function CheckoutPixContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string>('')
  const [pixKey, setPixKey] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(3600) // 60 minutos em segundos
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const name = searchParams.get('name') || ''
  const email = searchParams.get('email') || ''
  const phone = searchParams.get('phone') || ''
  const cpf = searchParams.get('cpf') || ''

  useEffect(() => {
    const createCheckout = async () => {
      if (!name || !email || !phone || !cpf) {
        router.push('/checkout')
        return
      }

      try {
        setIsLoading(true)
        const response = await api.checkout.create({
          customer: {
            name,
            email,
            phone: phone.replace(/\D/g, ''),
            cpf: cpf.replace(/\D/g, ''),
          },
          amount: PLAN_AMOUNT,
          paymentMethod: 'PIX',
          installments: 1,
        })

        setPaymentId(response.id)
        if (response.pix) {
          setQrCode(response.pix.qrCode)
          setPixKey(response.pix.key)
          setExpiresAt(new Date(response.pix.expiresAt))
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar checkout'
        setError(errorMessage)
        toast({
          variant: 'destructive',
          title: 'Erro ao gerar Pix',
          description: errorMessage,
        })
      } finally {
        setIsLoading(false)
      }
    }

    createCheckout()
  }, [name, email, phone, cpf, router, toast])

  useEffect(() => {
    if (!expiresAt) return

    const interval = setInterval(() => {
      const now = new Date()
      const remaining = differenceInSeconds(expiresAt, now)
      setTimeRemaining(Math.max(0, remaining))

      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  useEffect(() => {
    if (!paymentId || timeRemaining <= 0) return

    const interval = setInterval(async () => {
      try {
        const status = await api.checkout.getPaymentStatus(paymentId)
        if (status.status === 'APPROVED') {
          router.push(`/checkout/success?id=${paymentId}`)
        }
      } catch (err) {
        console.error('Erro ao verificar status:', err)
        toast({
          variant: 'destructive',
          title: 'Erro ao verificar pagamento',
          description: 'Não foi possível verificar o status do pagamento. Tente novamente.',
        })
      }
    }, 5000) // Verifica a cada 5 segundos

    return () => clearInterval(interval)
  }, [paymentId, timeRemaining, router, toast])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleCopyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/checkout')}>Voltar</Button>
        </div>
      </div>
    )
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
                <span className="text-base font-normal">Pix</span>
                <span className="ml-2 px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-md">
                  15% de desconto
                </span>
              </div>
            </div>

            {/* ETAPA 3: Informações para pagamento */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-900">ETAPA 3: Informações para pagamento</h2>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-shrink-0">
                    {qrCode && <QRCodeSVG value={qrCode} size={200} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-4">
                      Realize o pagamento do pix para concluir sua assinatura
                    </p>
                    <div className="mb-2">
                      <p className="text-4xl font-bold text-gray-900">{formatTime(timeRemaining)}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Aguardando pagamento</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Pix copia e cola</p>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 break-all text-sm font-mono text-gray-700">
                  {pixKey}
                </div>
                <Button
                  onClick={handleCopyPixCode}
                  variant="outline"
                  className="w-full h-11 border-gray-300"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Código copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar código do pix
                    </>
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Ao concluir o pagamento da sua assinatura você concorda com os{' '}
              <a href="#" className="text-gray-900 font-semibold underline">termos de uso</a> e{' '}
              <a href="#" className="text-gray-900 font-semibold underline">política de privacidade</a>.
            </p>
          </div>

          <div className="lg:sticky lg:top-8 lg:h-fit">
            <CheckoutSummary
              planName="Plano Anual"
              baseAmount={PLAN_AMOUNT}
              discountAmount={PIX_DISCOUNT}
              finalAmount={FINAL_AMOUNT}
              installments={1}
              installmentValue={FINAL_AMOUNT}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPixPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    }>
      <CheckoutPixContent />
    </Suspense>
  )
}
