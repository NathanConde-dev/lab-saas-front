'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const suggestions = [
  'Qual é a taxa de aprovação dos pagamentos?',
  'Quantos pagamentos foram feitos via Pix?',
  'Qual método de pagamento é mais usado?',
  'Me dê um resumo dos pagamentos recentes',
]

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const checkStatus = async () => {
      const token = auth.getToken()
      if (!token) return

      try {
        const status = await api.admin.chat.getStatus(token)
        setConfigured(status.configured)
      } catch (err) {
        console.error('Erro ao verificar status do chat:', err)
        setConfigured(false)
      } finally {
        setCheckingStatus(false)
      }
    }

    checkStatus()
  }, [])

  useEffect(() => {
    // Carregar histórico do localStorage
    const saved = localStorage.getItem('admin_chat_history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })))
      } catch (e) {
        console.error('Erro ao carregar histórico:', e)
      }
    }
  }, [])

  useEffect(() => {
    // Salvar histórico no localStorage
    if (messages.length > 0) {
      localStorage.setItem('admin_chat_history', JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    if (!input.trim() || loading || !configured) return

    const token = auth.getToken()
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa estar autenticado para usar o chat',
      })
      return
    }

    // Validar tamanho da mensagem
    if (input.length > 500) {
      toast({
        variant: 'destructive',
        title: 'Mensagem muito longa',
        description: 'A mensagem deve ter no máximo 500 caracteres',
      })
      return
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    const currentInput = input.trim()
    setInput('')
    setLoading(true)

    try {
      // Garantir que a mensagem está sendo enviada corretamente
      console.log('Enviando mensagem:', { message: currentInput, length: currentInput.length })
      const { response } = await api.admin.chat.sendMessage(token, currentInput.trim())

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage = error.message || 'Erro ao enviar mensagem'
      
      // Remover mensagem do usuário em caso de erro
      setMessages((prev) => prev.filter((msg) => msg.id !== userMsg.id))
      
      if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        toast({
          variant: 'destructive',
          title: 'Erro na requisição',
          description: 'Verifique se a mensagem está correta. Se o problema persistir, recarregue a página.',
        })
      } else if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
        setConfigured(false)
        toast({
          variant: 'destructive',
          title: 'Serviço não disponível',
          description: 'O serviço de IA não está configurado ou indisponível',
        })
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        toast({
          variant: 'destructive',
          title: 'Não autenticado',
          description: 'Sua sessão expirou. Por favor, faça login novamente.',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao enviar mensagem',
          description: errorMessage,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  const handleClearHistory = () => {
    setMessages([])
    localStorage.removeItem('admin_chat_history')
  }

  if (checkingStatus) {
    return null
  }

  if (!configured) {
    return null // Não mostrar o botão se não estiver configurado
  }

  return (
    <>
      {/* Botão flutuante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
          aria-label="Abrir chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Widget do chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Chat com IA</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 rounded-full p-1 transition-colors"
              aria-label="Fechar chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">
                  Olá! Como posso ajudar você hoje?
                </p>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Sugestões:</p>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span
                    className={`text-xs mt-1 block ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    <span className="text-sm text-gray-600">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Pergunte sobre os pagamentos..."
                disabled={loading}
                className="flex-1"
                maxLength={500}
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Limpar histórico
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

