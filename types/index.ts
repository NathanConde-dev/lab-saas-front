export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'
export type PaymentMethod = 'PIX' | 'CREDIT_CARD'
export type DiscountType = 'PERCENTAGE' | 'FIXED'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  cpf: string
  createdAt: string
  updatedAt?: string
}

export interface Payment {
  id: string
  userId: string
  amount: number
  discountAmount: number
  finalAmount: number
  paymentMethod: PaymentMethod
  installments: number
  status: PaymentStatus
  couponCode?: string
  efiTransactionId?: string
  pixQrCode?: string
  pixKey?: string
  pixExpiresAt?: string
  createdAt: string
  updatedAt: string
  user?: User
}

export interface Coupon {
  code: string
  description?: string
  discountType: DiscountType
  discountValue: number
  minAmount?: number
  maxDiscount?: number
  validFrom: string
  validUntil?: string
  maxUses?: number
  currentUses: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaymentStats {
  total: number
  byStatus: Record<PaymentStatus, number>
  byMethod: Record<PaymentMethod, number>
  totalAmount: number
  approvedAmount: number
}

