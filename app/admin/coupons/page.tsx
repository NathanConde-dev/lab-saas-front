'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { auth } from '@/lib/auth'
import { api } from '@/lib/api'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react'

// Schema de validação com validação de datas
const couponSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório').min(3, 'Código deve ter pelo menos 3 caracteres'),
  description: z.string().optional().or(z.literal('')),
  discountType: z.enum(['PERCENTAGE', 'FIXED'], {
    required_error: 'Tipo de desconto é obrigatório'
  }),
  discountValue: z.number({
    required_error: 'Valor do desconto é obrigatório',
    invalid_type_error: 'Valor deve ser um número'
  }).min(0.01, 'Valor deve ser maior que zero'),
  minAmount: z.number().optional().nullable(),
  maxDiscount: z.number().optional().nullable(),
  validFrom: z.string().optional().or(z.literal('')),
  validUntil: z.string().optional().or(z.literal('')),
  maxUses: z.number().optional().nullable(),
  isActive: z.boolean().default(true),
}).refine((data) => {
  // Validar que validUntil seja após validFrom se ambos estiverem preenchidos
  if (data.validFrom && data.validUntil && data.validFrom.trim() && data.validUntil.trim()) {
    return new Date(data.validUntil) > new Date(data.validFrom)
  }
  return true
}, {
  message: 'Data de término deve ser posterior à data de início',
  path: ['validUntil'],
})

type CouponFormData = z.infer<typeof couponSchema>

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null)
  const [deletingCoupon, setDeletingCoupon] = useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      discountType: 'PERCENTAGE',
      isActive: true,
    },
  })

  const discountType = watch('discountType')
  const validFrom = watch('validFrom')
  const validUntil = watch('validUntil')

  const loadCoupons = async () => {
    const token = auth.getToken()
    if (!token) {
      setError('Não autenticado')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await api.admin.coupons.list(token)
      setCoupons(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading coupons:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar cupons'
      setError(errorMessage)
      
      // Se for erro de autenticação, redirecionar para login
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        auth.removeToken()
        window.location.href = '/admin/login'
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  // Converter data ISO para formato datetime-local
  const formatDateForInput = (isoDate: string): string => {
    if (!isoDate) return ''
    const date = new Date(isoDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleCreate = () => {
    setEditingCoupon(null)
    reset({
      discountType: 'PERCENTAGE',
      isActive: true,
    })
    setDialogOpen(true)
  }

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon)
    reset({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minAmount: coupon.minAmount || undefined,
      maxDiscount: coupon.maxDiscount || undefined,
      validFrom: coupon.validFrom ? formatDateForInput(coupon.validFrom) : '',
      validUntil: coupon.validUntil ? formatDateForInput(coupon.validUntil) : '',
      maxUses: coupon.maxUses || undefined,
      isActive: coupon.isActive ?? true,
    })
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (coupon: any) => {
    setDeletingCoupon(coupon)
    setDeleteDialogOpen(true)
  }

  const preparePayload = (data: CouponFormData, isEdit: boolean = false) => {
    const payload: any = {}

    if (!isEdit) {
      // Criar: campos obrigatórios
      payload.code = data.code.trim().toUpperCase()
      payload.discountType = data.discountType
      payload.discountValue = Number(data.discountValue)
      payload.isActive = data.isActive ?? true
    } else {
      // Editar: sempre incluir campos principais (mesmo que não tenham mudado)
      // Isso garante que sempre temos um objeto válido
      payload.discountType = data.discountType !== undefined ? data.discountType : editingCoupon?.discountType
      payload.discountValue = data.discountValue !== undefined ? Number(data.discountValue) : Number(editingCoupon?.discountValue)
      payload.isActive = data.isActive !== undefined ? data.isActive : (editingCoupon?.isActive ?? true)
    }

    // Campos opcionais
    // Descrição
    if (data.description !== undefined) {
      payload.description = data.description && data.description.trim() ? data.description.trim() : (isEdit ? null : undefined)
    } else if (isEdit && editingCoupon?.description !== undefined) {
      payload.description = editingCoupon.description || null
    }
    
    // Valor mínimo
    if (data.minAmount !== undefined) {
      if (data.minAmount && !isNaN(Number(data.minAmount)) && Number(data.minAmount) > 0) {
        payload.minAmount = Number(data.minAmount)
      } else {
        payload.minAmount = isEdit ? null : undefined
      }
    } else if (isEdit && editingCoupon?.minAmount !== undefined) {
      payload.minAmount = editingCoupon.minAmount || null
    }
    
    // Desconto máximo
    if (data.maxDiscount !== undefined) {
      if (data.maxDiscount && !isNaN(Number(data.maxDiscount)) && Number(data.maxDiscount) > 0) {
        payload.maxDiscount = Number(data.maxDiscount)
      } else {
        payload.maxDiscount = isEdit ? null : undefined
      }
    } else if (isEdit && editingCoupon?.maxDiscount !== undefined) {
      payload.maxDiscount = editingCoupon.maxDiscount || null
    }
    
    // Data de início
    if (data.validFrom !== undefined) {
      if (data.validFrom && data.validFrom.trim()) {
        try {
          const date = new Date(data.validFrom)
          if (!isNaN(date.getTime())) {
            payload.validFrom = date.toISOString()
          }
        } catch (e) {
          console.error('Invalid validFrom date:', e)
        }
      } else {
        payload.validFrom = isEdit ? null : undefined
      }
    } else if (isEdit && editingCoupon?.validFrom) {
      payload.validFrom = new Date(editingCoupon.validFrom).toISOString()
    }
    
    // Data de término
    if (data.validUntil !== undefined) {
      if (data.validUntil && data.validUntil.trim()) {
        try {
          const date = new Date(data.validUntil)
          if (!isNaN(date.getTime())) {
            payload.validUntil = date.toISOString()
          }
        } catch (e) {
          console.error('Invalid validUntil date:', e)
        }
      } else {
        payload.validUntil = isEdit ? null : undefined
      }
    } else if (isEdit && editingCoupon?.validUntil) {
      payload.validUntil = new Date(editingCoupon.validUntil).toISOString()
    }
    
    // Máximo de usos
    if (data.maxUses !== undefined) {
      if (data.maxUses && !isNaN(Number(data.maxUses)) && Number(data.maxUses) > 0) {
        payload.maxUses = Number(data.maxUses)
      } else {
        payload.maxUses = isEdit ? null : undefined
      }
    } else if (isEdit && editingCoupon?.maxUses !== undefined) {
      payload.maxUses = editingCoupon.maxUses || null
    }

    return payload
  }

  const onSubmit = async (data: CouponFormData) => {
    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const token = auth.getToken()
      if (!token) {
        setError('Não autenticado')
        setIsSubmitting(false)
        return
      }

      const payload = preparePayload(data, false)
      console.log('Payload sendo enviado:', JSON.stringify(payload, null, 2))
      
      await api.admin.coupons.create(token, payload)
      
      setSuccessMessage('Cupom criado com sucesso!')
      reset()
      setDialogOpen(false)
      setTimeout(() => {
        setSuccessMessage(null)
        loadCoupons()
      }, 1500)
    } catch (err) {
      console.error('Error creating coupon:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cupom'
      setError(errorMessage)
      
      if (errorMessage.includes('Bad Request') || errorMessage.includes('400')) {
        setError('Erro de validação. Verifique se todos os campos obrigatórios estão preenchidos corretamente.')
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        auth.removeToken()
        window.location.href = '/admin/login'
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const onEditSubmit = async (data: CouponFormData) => {
    if (!editingCoupon) return

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const token = auth.getToken()
      if (!token) {
        setError('Não autenticado')
        setIsSubmitting(false)
        return
      }

      const payload = preparePayload(data, true)
      
      // Remover campos undefined do payload para garantir objeto válido
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== undefined)
      )

      console.log('Payload de edição (antes da limpeza):', JSON.stringify(payload, null, 2))
      console.log('Payload de edição (após limpeza):', JSON.stringify(cleanPayload, null, 2))
      
      // Garantir que temos pelo menos os campos principais
      if (!cleanPayload.discountType || cleanPayload.discountValue === undefined) {
        setError('Campos obrigatórios não foram preenchidos corretamente')
        setIsSubmitting(false)
        return
      }

      await api.admin.coupons.update(token, editingCoupon.code, cleanPayload)
      
      setSuccessMessage('Cupom atualizado com sucesso!')
      setEditDialogOpen(false)
      setEditingCoupon(null)
      setTimeout(() => {
        setSuccessMessage(null)
        loadCoupons()
      }, 1500)
    } catch (err) {
      console.error('Error updating coupon:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar cupom'
      setError(errorMessage)
      
      if (errorMessage.includes('404')) {
        setError('Cupom não encontrado')
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        auth.removeToken()
        window.location.href = '/admin/login'
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCoupon) return

    setIsDeleting(true)
    setError(null)

    try {
      const token = auth.getToken()
      if (!token) {
        setError('Não autenticado')
        setIsDeleting(false)
        return
      }

      await api.admin.coupons.delete(token, deletingCoupon.code)
      
      setSuccessMessage('Cupom deletado com sucesso!')
      setDeleteDialogOpen(false)
      setDeletingCoupon(null)
      setTimeout(() => {
        setSuccessMessage(null)
        loadCoupons()
      }, 1500)
    } catch (err) {
      console.error('Error deleting coupon:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar cupom'
      setError(errorMessage)
      
      if (errorMessage.includes('404')) {
        setError('Cupom não encontrado')
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        auth.removeToken()
        window.location.href = '/admin/login'
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const getDiscountTypeLabel = (type: string) => {
    return type === 'PERCENTAGE' ? 'Percentual' : 'Fixo'
  }

  const getStatusBadge = (coupon: any) => {
    const now = new Date()
    const validFrom = new Date(coupon.validFrom)
    const validUntil = coupon.validUntil ? new Date(coupon.validUntil) : null

    if (!coupon.isActive) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Inativo</span>
    }

    if (now < validFrom) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Agendado</span>
    }

    if (validUntil && now > validUntil) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Expirado</span>
    }

    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Ativo</span>
  }

  const renderCouponForm = (onSubmitHandler: (data: CouponFormData) => void, isEdit: boolean = false) => (
    <form onSubmit={handleSubmit(onSubmitHandler, (formErrors) => {
      console.log('Form validation errors:', formErrors)
      const firstError = Object.values(formErrors)[0]
      if (firstError) {
        setError(firstError.message || 'Por favor, preencha todos os campos obrigatórios corretamente.')
      }
    })} className="space-y-4">
      {!isEdit && (
        <div className="space-y-2">
          <Label htmlFor="code">Código do Cupom *</Label>
          <Input
            id="code"
            placeholder="PROMO2025"
            {...register('code')}
          />
          {errors.code && (
            <p className="text-sm text-red-500">{errors.code.message}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {isEdit && (
          <div className="space-y-2">
            <Label>Código</Label>
            <Input value={editingCoupon?.code} disabled className="bg-gray-50" />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            placeholder="Promoção especial"
            {...register('description')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipo de Desconto *</Label>
        <RadioGroup
          value={discountType}
          onValueChange={(value) => setValue('discountType', value as 'PERCENTAGE' | 'FIXED')}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="PERCENTAGE" id={`${isEdit ? 'edit-' : ''}percentage`} />
            <Label htmlFor={`${isEdit ? 'edit-' : ''}percentage`} className="cursor-pointer">Percentual (%)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="FIXED" id={`${isEdit ? 'edit-' : ''}fixed`} />
            <Label htmlFor={`${isEdit ? 'edit-' : ''}fixed`} className="cursor-pointer">Valor Fixo (R$)</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discountValue">
            {discountType === 'PERCENTAGE' ? 'Percentual (%) *' : 'Valor (R$) *'}
          </Label>
          <Input
            id="discountValue"
            type="number"
            step="0.01"
            min="0.01"
            placeholder={discountType === 'PERCENTAGE' ? '15' : '50.00'}
            {...register('discountValue', { 
              valueAsNumber: true,
              required: 'Este campo é obrigatório',
              min: { value: 0.01, message: 'Valor deve ser maior que zero' }
            })}
          />
          {errors.discountValue && (
            <p className="text-sm text-red-500">{errors.discountValue.message}</p>
          )}
        </div>

        {discountType === 'PERCENTAGE' && (
          <div className="space-y-2">
            <Label htmlFor="maxDiscount">Desconto Máximo (R$)</Label>
            <Input
              id="maxDiscount"
              type="number"
              step="0.01"
              placeholder="100.00"
              {...register('maxDiscount', { valueAsNumber: true })}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minAmount">Valor Mínimo (R$)</Label>
          <Input
            id="minAmount"
            type="number"
            step="0.01"
            placeholder="100.00"
            {...register('minAmount', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxUses">Máximo de Usos</Label>
          <Input
            id="maxUses"
            type="number"
            placeholder="1000"
            {...register('maxUses', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="validFrom">Válido a partir de</Label>
          <Input
            id="validFrom"
            type="datetime-local"
            {...register('validFrom')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="validUntil">Válido até</Label>
          <Input
            id="validUntil"
            type="datetime-local"
            {...register('validUntil')}
          />
          {errors.validUntil && (
            <p className="text-sm text-red-500">{errors.validUntil.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              id={`${isEdit ? 'edit-' : ''}isActive`}
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          )}
        />
        <Label htmlFor={`${isEdit ? 'edit-' : ''}isActive`} className="cursor-pointer">Cupom ativo</Label>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setEditDialogOpen(false)
              setEditingCoupon(null)
            } else {
              setDialogOpen(false)
            }
            reset()
            setError(null)
            setSuccessMessage(null)
          }}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEdit ? 'Atualizando...' : 'Criando...'}
            </>
          ) : (
            isEdit ? 'Atualizar Cupom' : 'Criar Cupom'
          )}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cupons</h1>
          <p className="text-gray-600 mt-2">Gerencie cupons de desconto</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {/* Dialog Criar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Cupom</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo cupom de desconto
            </DialogDescription>
          </DialogHeader>
          {renderCouponForm(onSubmit, false)}
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cupom</DialogTitle>
            <DialogDescription>
              Atualize os dados do cupom {editingCoupon?.code}
            </DialogDescription>
          </DialogHeader>
          {editingCoupon && renderCouponForm(onEditSubmit, true)}
        </DialogContent>
      </Dialog>

      {/* Dialog Deletar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o cupom <strong>{deletingCoupon?.code}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeletingCoupon(null)
                setError(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-600 mt-2">Carregando cupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Nenhum cupom cadastrado</p>
            <Button onClick={handleCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Cupom
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Código</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Descrição</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Valor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Usos</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Validade</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.code} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium">{coupon.code}</td>
                    <td className="py-3 px-4 text-sm">{coupon.description || '-'}</td>
                    <td className="py-3 px-4 text-sm">{getDiscountTypeLabel(coupon.discountType)}</td>
                    <td className="py-3 px-4 text-sm">
                      {coupon.discountType === 'PERCENTAGE'
                        ? `${coupon.discountValue}%`
                        : `R$ ${coupon.discountValue.toFixed(2)}`}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {coupon.currentUses || 0} / {coupon.maxUses || '∞'}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(coupon)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {coupon.validUntil
                        ? format(new Date(coupon.validUntil), "dd/MM/yyyy", { locale: ptBR })
                        : 'Sem limite'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(coupon)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(coupon)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
