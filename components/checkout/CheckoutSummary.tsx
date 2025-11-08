'use client'

import { formatCurrency } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CheckoutSummaryProps {
  planName: string
  baseAmount: number
  discountAmount?: number
  finalAmount: number
  installments: number
  installmentValue: number
  onInstallmentsChange?: (installments: number) => void
  showInstallmentSelector?: boolean
}

export function CheckoutSummary({
  planName,
  baseAmount,
  discountAmount = 0,
  finalAmount,
  installments,
  installmentValue,
  onInstallmentsChange,
  showInstallmentSelector = false,
}: CheckoutSummaryProps) {
  const installmentOptions = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="w-full bg-white rounded-lg p-6 space-y-6 border border-gray-200 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold uppercase mb-3 tracking-wide text-gray-600">RESUMO</h2>
        <p className="text-sm text-gray-600 mb-3">{planName}</p>
        {installments > 1 ? (
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{installments}x {formatCurrency(installmentValue)}</p>
            <p className="text-sm text-gray-500">ou {formatCurrency(baseAmount)} à vista</p>
          </div>
        ) : (
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(baseAmount)}</p>
        )}
      </div>

      {showInstallmentSelector && onInstallmentsChange && (
        <div className="space-y-2">
          <label className="text-sm text-gray-700 block">Selecione o número de parcelas</label>
          <Select
            value={installments.toString()}
            onValueChange={(value) => onInstallmentsChange(parseInt(value))}
          >
            <SelectTrigger className="w-full bg-white border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {installmentOptions.map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}x de {formatCurrency(baseAmount / num)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="text-right font-medium text-gray-900">{formatCurrency(baseAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Parcelas:</span>
          <span className="text-right font-medium text-gray-900">{installments}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Desconto do pix:</span>
            <span className="text-right font-medium text-green-600">- {formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between pt-3 border-t border-gray-200">
          <span className="font-semibold text-gray-900">Total:</span>
          <span className="font-bold text-xl text-gray-900">{formatCurrency(finalAmount)}</span>
        </div>
      </div>

      <div className="pt-4 text-xs text-gray-500 space-y-1 leading-relaxed text-center">
        <p>Musitech Studio Digital LTDA - CNPJ 40.126.747/0001-05</p>
        <p>Todos os direitos reservados © 2025</p>
      </div>
    </div>
  )
}

