import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

export function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function formatExpiryDate(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4)
  }
  return cleaned
}

export function formatBirthDate(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 2) {
    return cleaned
  }
  if (cleaned.length <= 4) {
    return cleaned.slice(0, 2) + '/' + cleaned.slice(2)
  }
  return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8)
}

