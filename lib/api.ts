const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export interface ApiError {
  error: string
}

export interface Customer {
  name: string
  email: string
  phone: string
  cpf: string
}

export interface CheckoutRequest {
  customer: Customer
  amount: number
  paymentMethod: 'PIX' | 'CREDIT_CARD'
  installments?: number
  couponCode?: string
  creditCard?: {
    paymentToken: string
    billingAddress: {
      street: string
      number: string
      neighborhood: string
      zipcode: string
      city: string
      state: string
    }
  }
  pixKey?: string
}

export interface CheckoutResponse {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'
  amount: number
  discountAmount: number
  finalAmount: number
  paymentMethod: 'PIX' | 'CREDIT_CARD'
  installments: number
  createdAt: string
  pix?: {
    qrCode: string
    key: string
    expiresAt: string
  }
}

export interface CouponValidation {
  valid: boolean
  discountAmount?: number
  finalAmount?: number
  coupon?: {
    code: string
    discountType: 'PERCENTAGE' | 'FIXED'
    discountValue: number
  }
  error?: string
}

export interface PaymentStatus {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED'
  amount: number
  discountAmount: number
  finalAmount: number
  paymentMethod: 'PIX' | 'CREDIT_CARD'
  installments: number
  createdAt: string
  updatedAt: string
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Garantir que Content-Type está presente para requisições POST/PUT/PATCH com body
  const hasBody = options?.body !== undefined && options?.body !== null
  const isMethodWithBody = options?.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase())
  
  const headers: HeadersInit = {
    ...((hasBody || isMethodWithBody) && { 'Content-Type': 'application/json' }),
    ...options?.headers,
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorMessage = 'Erro na requisição'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`
    } catch (e) {
      errorMessage = `Erro ${response.status}: ${response.statusText}`
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export const api = {
  checkout: {
    create: (data: CheckoutRequest): Promise<CheckoutResponse> =>
      fetchApi('/checkout', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    validateCoupon: (code: string, amount: number): Promise<CouponValidation> =>
      fetchApi('/checkout/validate-coupon', {
        method: 'POST',
        body: JSON.stringify({ code, amount }),
      }),

    getPaymentStatus: (id: string): Promise<PaymentStatus> =>
      fetchApi(`/checkout/payment/${id}`),
  },

  admin: {
    login: async (email: string, password: string) => {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error: ApiError = await response.json()
        throw new Error(error.error || 'Erro no login')
      }

      return response.json()
    },

    getMe: (token: string) =>
      fetchApi('/admin/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),

    payments: {
      list: (token: string, params?: { status?: string; paymentMethod?: string; page?: number; limit?: number }) => {
        const queryParams = new URLSearchParams()
        if (params?.status) queryParams.append('status', params.status)
        if (params?.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod)
        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())

        const queryString = queryParams.toString()
        const url = queryString ? `/admin/payments?${queryString}` : '/admin/payments'

        return fetchApi(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      },

      get: (token: string, id: string) =>
        fetchApi(`/admin/payments/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

      updateStatus: (token: string, id: string, status: string) =>
        fetchApi(`/admin/payments/${id}/status`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }),

      getStats: (token: string) =>
        fetchApi('/admin/payments/stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
    },

    users: {
      list: (token: string, params?: { page?: number; limit?: number; search?: string }) => {
        const queryParams = new URLSearchParams()
        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())
        if (params?.search) queryParams.append('search', params.search)

        return fetchApi(`/admin/users?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      },

      get: (token: string, id: string) =>
        fetchApi(`/admin/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

      update: (token: string, id: string, data: Partial<Customer>) =>
        fetchApi(`/admin/users/${id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }),

      delete: (token: string, id: string) =>
        fetchApi(`/admin/users/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
    },

    coupons: {
      list: (token: string) =>
        fetchApi('/coupons', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

      get: (token: string, code: string) =>
        fetchApi(`/coupons/${code}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

      create: (token: string, data: any) =>
        fetchApi('/coupons', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }),

      update: (token: string, code: string, data: any) =>
        fetchApi(`/admin/coupons/${code}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }),

      delete: (token: string, code: string) =>
        fetchApi(`/admin/coupons/${code}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
    },

    chat: {
      sendMessage: (token: string, message: string) => {
        // Garantir que a mensagem está presente e não vazia
        const trimmedMessage = message?.trim()
        if (!trimmedMessage) {
          throw new Error('A mensagem não pode estar vazia')
        }

        // Validar tamanho
        if (trimmedMessage.length > 500) {
          throw new Error('A mensagem deve ter no máximo 500 caracteres')
        }

        // Garantir que o body está no formato correto
        const requestBody = { message: trimmedMessage }
        const bodyString = JSON.stringify(requestBody)
        
        // Validar que o JSON é válido
        try {
          JSON.parse(bodyString)
        } catch (e) {
          throw new Error('Erro ao serializar mensagem')
        }

        console.log('Chat API Request:', {
          url: `${API_URL}/admin/chat`,
          method: 'POST',
          contentType: 'application/json',
          body: bodyString,
          bodyParsed: requestBody,
          hasToken: !!token,
        })

        return fetchApi<{ response: string }>('/admin/chat', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: bodyString,
        })
      },

      getStatus: (token: string) =>
        fetchApi<{ configured: boolean; message: string }>('/admin/chat/status', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
    },
  },
}

