# Integração do Chat com IA no Frontend - Guia Objetivo

## 📋 Resumo

O chat permite que administradores façam perguntas sobre pagamentos e recebam análises da IA baseadas em dados reais do sistema.

---

## 🔗 Endpoints

### 1. Enviar Mensagem
```
POST /admin/chat
Authorization: Bearer <token>
Content-Type: application/json

Body: { "message": "sua pergunta aqui" }

Response: { "response": "resposta da IA" }
```

### 2. Verificar Status
```
GET /admin/chat/status
Authorization: Bearer <token>

Response: { "configured": true/false, "message": "..." }
```

---

## 💻 Implementação Básica

### 1. Função para Enviar Mensagem

```typescript
async function sendChatMessage(token: string, message: string) {
  const response = await fetch('http://localhost:3000/admin/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao enviar mensagem');
  }

  return response.json(); // { response: "..." }
}
```

### 2. Função para Verificar Status

```typescript
async function checkChatStatus(token: string) {
  const response = await fetch('http://localhost:3000/admin/chat/status', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json(); // { configured: boolean, message: string }
}
```

---

## 🎨 Estrutura do Componente

### Estados Necessários

```typescript
const [messages, setMessages] = useState<Array<{
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}>>([]);

const [input, setInput] = useState('');
const [loading, setLoading] = useState(false);
const [configured, setConfigured] = useState(false);
```

### Fluxo de Funcionamento

1. **Ao montar componente:**
   ```typescript
   useEffect(() => {
     checkChatStatus(token).then((status) => {
       setConfigured(status.configured);
     });
   }, []);
   ```

2. **Ao enviar mensagem:**
   ```typescript
   const handleSend = async () => {
     // 1. Adicionar mensagem do usuário à lista
     const userMsg = {
       id: Date.now().toString(),
       role: 'user' as const,
       content: input,
       timestamp: new Date(),
     };
     setMessages(prev => [...prev, userMsg]);
     setInput('');
     setLoading(true);

     try {
       // 2. Enviar para API
       const { response } = await sendChatMessage(token, input);
       
       // 3. Adicionar resposta da IA
       const aiMsg = {
         id: (Date.now() + 1).toString(),
         role: 'assistant' as const,
         content: response,
         timestamp: new Date(),
       };
       setMessages(prev => [...prev, aiMsg]);
     } catch (error) {
       // 4. Tratar erro
       console.error(error);
     } finally {
       setLoading(false);
     }
   };
   ```

---

## 🎯 UI Básica

### Estrutura HTML

```html
<div class="chat-container">
  <!-- Área de mensagens -->
  <div class="messages">
    {messages.map(msg => (
      <div class={`message ${msg.role}`}>
        <p>{msg.content}</p>
        <span>{msg.timestamp.toLocaleTimeString()}</span>
      </div>
    ))}
    {loading && <div class="loading">Pensando...</div>}
  </div>

  <!-- Input -->
  <div class="input-area">
    <input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      placeholder="Pergunte sobre os pagamentos..."
      disabled={loading}
    />
    <button onClick={handleSend} disabled={loading || !input.trim()}>
      Enviar
    </button>
  </div>
</div>
```

### Verificação de Configuração

```typescript
if (!configured) {
  return (
    <div class="warning">
      <p>⚠️ Serviço de IA não configurado</p>
      <p>Configure OPENAI_API_KEY no servidor</p>
    </div>
  );
}
```

---

## 📝 Validações

### Antes de Enviar

```typescript
if (!input.trim()) {
  // Não enviar mensagem vazia
  return;
}

if (input.length > 500) {
  // Limitar tamanho
  alert('Mensagem muito longa (máx 500 caracteres)');
  return;
}
```

### Tratamento de Erros

```typescript
try {
  const { response } = await sendChatMessage(token, input);
  // Sucesso
} catch (error) {
  if (error.message.includes('503')) {
    // Serviço não configurado
    setConfigured(false);
  } else if (error.message.includes('401')) {
    // Token inválido - redirecionar para login
    redirectToLogin();
  } else {
    // Outro erro - exibir mensagem
    showError(error.message);
  }
}
```

---

## 🎨 Melhorias de UX

### 1. Scroll Automático

```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);
```

### 2. Sugestões de Perguntas

```typescript
const suggestions = [
  "Qual é a taxa de aprovação dos pagamentos?",
  "Quantos pagamentos foram feitos via Pix?",
  "Qual método de pagamento é mais usado?",
  "Me dê um resumo dos pagamentos recentes",
];

// Exibir como botões clicáveis
```

### 3. Histórico Local

```typescript
// Salvar no localStorage
useEffect(() => {
  localStorage.setItem('chatHistory', JSON.stringify(messages));
}, [messages]);

// Carregar ao montar
useEffect(() => {
  const saved = localStorage.getItem('chatHistory');
  if (saved) {
    setMessages(JSON.parse(saved));
  }
}, []);
```

---

## 🔄 Fluxo Completo

```
1. Usuário abre chat
   ↓
2. Verificar status (GET /admin/chat/status)
   ↓
3. Se configurado → Mostrar chat
   Se não → Mostrar aviso
   ↓
4. Usuário digita pergunta
   ↓
5. Validar mensagem
   ↓
6. Adicionar mensagem do usuário à lista
   ↓
7. Mostrar loading
   ↓
8. Enviar para API (POST /admin/chat)
   ↓
9. Receber resposta
   ↓
10. Adicionar resposta da IA à lista
    ↓
11. Remover loading
    ↓
12. Scroll para última mensagem
```

---

## ⚡ Exemplo Completo (React)

```typescript
import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatComponent({ token }: { token: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkChatStatus(token).then((status) => {
      setConfigured(status.configured);
    });
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const { response } = await sendChatMessage(token, currentInput);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      alert(error.message || 'Erro ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <div className="p-4 border rounded">
        <p className="text-yellow-600">⚠️ Serviço de IA não configurado</p>
        <p className="text-sm text-gray-600">
          Configure OPENAI_API_KEY no servidor
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] border rounded">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p>{msg.content}</p>
              <span className="text-xs opacity-70">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 p-3 rounded">
              <p>Pensando...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Pergunte sobre os pagamentos..."
          disabled={loading}
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
```

---

## 📌 Checklist de Implementação

- [ ] Criar função `sendChatMessage`
- [ ] Criar função `checkChatStatus`
- [ ] Criar componente de chat
- [ ] Implementar estados (messages, input, loading, configured)
- [ ] Implementar `handleSend`
- [ ] Verificar status ao montar componente
- [ ] Adicionar validações
- [ ] Tratar erros
- [ ] Implementar scroll automático
- [ ] Adicionar loading visual
- [ ] Testar integração

---

## 🎯 Pontos Importantes

1. **Token**: Sempre incluir no header `Authorization`
2. **Validação**: Validar mensagem antes de enviar
3. **Loading**: Mostrar indicador durante requisição
4. **Erros**: Tratar todos os casos (503, 401, 500)
5. **UX**: Scroll automático e feedback visual

---

**Pronto para implementar!** 🚀

