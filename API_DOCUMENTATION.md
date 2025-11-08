# Documentação da API - Lab SaaS

## 📋 Índice

- [Autenticação](#autenticação)
- [Checkout e Pagamentos](#checkout-e-pagamentos)
- [Cupons](#cupons)
- [Administração - Pagamentos](#administração---pagamentos)
- [Administração - Usuários](#administração---usuários)
- [Administração - Cupons](#administração---cupons)
- [Códigos de Status HTTP](#códigos-de-status-http)
- [Tratamento de Erros](#tratamento-de-erros)

---

## 🔐 Autenticação

### Base URL
```
http://localhost:3000
```

### Login do Administrador

**Endpoint:** `POST /admin/login`

**Descrição:** Autentica um administrador e retorna um token JWT.

**Autenticação:** Não requerida

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Administrador"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 401:**
```json
{
  "error": "Email ou senha incorretos"
}
```

### Obter Dados do Administrador

**Endpoint:** `GET /admin/me`

**Descrição:** Retorna as informações do administrador autenticado.

**Autenticação:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "name": "Administrador",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### Registrar Novo Administrador

**Endpoint:** `POST /admin/register`

**Descrição:** Cria um novo administrador (apenas para setup inicial).

**Autenticação:** Não requerida

**Request Body:**
```json
{
  "email": "novo@example.com",
  "password": "senha123",
  "name": "Novo Admin"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "email": "novo@example.com",
  "name": "Novo Admin"
}
```

---

## 💳 Checkout e Pagamentos

### Criar Checkout e Processar Pagamento

**Endpoint:** `POST /checkout`

**Descrição:** Cria um novo checkout e processa o pagamento (Pix ou Cartão de Crédito).

**Autenticação:** Não requerida

**Request Body:**
```json
{
  "customer": {
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999",
    "cpf": "12345678900"
  },
  "amount": 154.80,
  "paymentMethod": "PIX",
  "installments": 1,
  "couponCode": "DESCONTO15",
  "creditCard": {
    "paymentToken": "token-do-cartao",
    "billingAddress": {
      "street": "Rua Exemplo",
      "number": "123",
      "neighborhood": "Centro",
      "zipcode": "01234567",
      "city": "São Paulo",
      "state": "SP"
    }
  },
  "pixKey": "sua-chave-pix@email.com"
}
```

**Campos:**
- `customer` (obrigatório): Dados do cliente
  - `name` (obrigatório): Nome completo
  - `email` (obrigatório): Email válido
  - `phone` (obrigatório): Telefone
  - `cpf` (obrigatório): CPF (apenas números)
- `amount` (obrigatório): Valor total do pagamento (número)
- `paymentMethod` (obrigatório): `"CREDIT_CARD"` ou `"PIX"`
- `installments` (opcional): Número de parcelas (1-12, apenas para cartão)
- `couponCode` (opcional): Código do cupom de desconto
- `creditCard` (opcional, obrigatório se paymentMethod for CREDIT_CARD):
  - `paymentToken`: Token do cartão (gerado pelo gateway)
  - `billingAddress`: Endereço de cobrança
- `pixKey` (opcional): Chave Pix para recebimento

**Response 201 (Pix):**
```json
{
  "id": "uuid",
  "status": "PENDING",
  "amount": 154.80,
  "discountAmount": 23.22,
  "finalAmount": 131.58,
  "paymentMethod": "PIX",
  "installments": 1,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "pix": {
    "qrCode": "00020126...",
    "key": "sua-chave-pix@email.com",
    "expiresAt": "2025-01-01T01:00:00.000Z"
  }
}
```

**Response 201 (Cartão de Crédito):**
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "amount": 154.80,
  "discountAmount": 23.22,
  "finalAmount": 131.58,
  "paymentMethod": "CREDIT_CARD",
  "installments": 12,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

**Response 400:**
```json
{
  "error": "Mensagem de erro específica"
}
```

### Validar Cupom de Desconto

**Endpoint:** `POST /checkout/validate-coupon`

**Descrição:** Valida um cupom de desconto antes de criar o checkout.

**Autenticação:** Não requerida

**Request Body:**
```json
{
  "code": "DESCONTO15",
  "amount": 154.80
}
```

**Response 200:**
```json
{
  "valid": true,
  "discountAmount": 23.22,
  "finalAmount": 131.58,
  "coupon": {
    "code": "DESCONTO15",
    "discountType": "PERCENTAGE",
    "discountValue": 15
  }
}
```

**Response 400 (Cupom inválido):**
```json
{
  "valid": false,
  "error": "Cupom não encontrado ou inválido"
}
```

### Consultar Status do Pagamento

**Endpoint:** `GET /checkout/payment/:id`

**Descrição:** Consulta o status atual de um pagamento. Para Pix, verifica automaticamente se foi confirmado.

**Autenticação:** Não requerida

**Parâmetros:**
- `id` (path): UUID do pagamento

**Response 200:**
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "amount": 154.80,
  "discountAmount": 23.22,
  "finalAmount": 131.58,
  "paymentMethod": "PIX",
  "installments": 1,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:05:00.000Z"
}
```

**Status possíveis:**
- `PENDING`: Aguardando pagamento
- `PROCESSING`: Processando
- `APPROVED`: Aprovado
- `REJECTED`: Rejeitado
- `EXPIRED`: Expirado
- `CANCELLED`: Cancelado

**Response 404:**
```json
{
  "error": "Pagamento não encontrado"
}
```

---

## 🎟️ Cupons

### Criar Cupom de Desconto

**Endpoint:** `POST /coupons`

**Descrição:** Cria um novo cupom de desconto.

**Autenticação:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "code": "PROMO2025",
  "description": "Promoção de Ano Novo",
  "discountType": "PERCENTAGE",
  "discountValue": 20,
  "minAmount": 100,
  "maxDiscount": 50,
  "validFrom": "2025-01-01T00:00:00.000Z",
  "validUntil": "2025-12-31T23:59:59.000Z",
  "maxUses": 1000,
  "isActive": true
}
```

**Campos:**
- `code` (obrigatório): Código do cupom (será convertido para maiúsculas)
- `description` (opcional): Descrição do cupom
- `discountType` (obrigatório): `"PERCENTAGE"` ou `"FIXED"`
- `discountValue` (obrigatório): Valor do desconto
- `minAmount` (opcional): Valor mínimo para usar o cupom
- `maxDiscount` (opcional): Desconto máximo (para cupons percentuais)
- `validFrom` (opcional): Data de início (padrão: agora)
- `validUntil` (opcional): Data de fim
- `maxUses` (opcional): Número máximo de usos
- `isActive` (opcional): Se está ativo (padrão: true)

**Response 201:**
```json
{
  "code": "PROMO2025",
  "description": "Promoção de Ano Novo",
  "discountType": "PERCENTAGE",
  "discountValue": 20,
  "minAmount": 100,
  "maxDiscount": 50,
  "validFrom": "2025-01-01T00:00:00.000Z",
  "validUntil": "2025-12-31T23:59:59.000Z",
  "maxUses": 1000,
  "currentUses": 0,
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### Listar Cupons

**Endpoint:** `GET /coupons`

**Descrição:** Lista todos os cupons cadastrados.

**Autenticação:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
[
  {
    "code": "PROMO2025",
    "description": "Promoção de Ano Novo",
    "discountType": "PERCENTAGE",
    "discountValue": 20,
    "minAmount": 100,
    "maxDiscount": 50,
    "validFrom": "2025-01-01T00:00:00.000Z",
    "validUntil": "2025-12-31T23:59:59.000Z",
    "maxUses": 1000,
    "currentUses": 0,
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### Obter Cupom por Código

**Endpoint:** `GET /coupons/:code`

**Descrição:** Obtém informações detalhadas de um cupom específico.

**Autenticação:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Parâmetros:**
- `code` (path): Código do cupom

**Response 200:**
```json
{
  "code": "PROMO2025",
  "description": "Promoção de Ano Novo",
  "discountType": "PERCENTAGE",
  "discountValue": 20,
  "minAmount": 100,
  "maxDiscount": 50,
  "validFrom": "2025-01-01T00:00:00.000Z",
  "validUntil": "2025-12-31T23:59:59.000Z",
  "maxUses": 1000,
  "currentUses": 0,
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Response 404:**
```json
{
  "error": "Cupom não encontrado"
}
```

---

## 👥 Administração - Pagamentos

### Listar Pagamentos

**Endpoint:** `GET /admin/payments`

**Descrição:** Lista todos os pagamentos com filtros opcionais e paginação.

**Autenticação:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (opcional): Filtrar por status (`PENDING`, `PROCESSING`, `APPROVED`, `REJECTED`, `EXPIRED`, `CANCELLED`)
- `paymentMethod` (opcional): Filtrar por método (`CREDIT_CARD`, `PIX`)
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20, máximo: 100)

**Exemplo:**
```
GET /admin/payments?status=APPROVED&paymentMethod=PIX&page=1&limit=20
```

**Response 200:**
```json
{
  "payments": [
    {
      "id": "uuid",
      "userId": "uuid",
      "amount": 154.80,
      "discountAmount": 23.22,
      "finalAmount": 131.58,
      "paymentMethod": "PIX",
      "installments": 1,
      "status": "APPROVED",
      "couponCode": "DESCONTO15",
      "efiTransactionId": "tx_123456",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:05:00.000Z",
      "user": {
        "id": "uuid",
        "name": "João Silva",
        "email": "joao@example.com",
        "cpf": "12345678900"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Obter Detalhes do Pagamento

**Endpoint:** `GET /admin/payments/:id`

**Descrição:** Obtém detalhes completos de um pagamento específico.

**Autenticação:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Parâmetros:**
- `id` (path): UUID do pagamento

**Response 200:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "amount": 154.80,
  "discountAmount": 23.22,
  "finalAmount": 131.58,
  "paymentMethod": "PIX",
  "installments": 1,
  "status": "APPROVED",
  "pixQrCode": "00020126...",
  "pixKey": "sua-chave-pix@email.com",
  "pixExpiresAt": "2025-01-01T01:00:00.000Z",
  "efiTransactionId": "tx_123456",
  "couponCode": "DESCONTO15",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:05:00.000Z",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "11999999999",
    "cpf": "12345678900",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "coupon": {
    "code": "DESCONTO15",
    "description": "Desconto de 15%",
    "discountType": "PERCENTAGE",
    "discountValue": 15
  }
}
```

### Atualizar Status do Pagamento

**Endpoint:** `PATCH /admin/payments/:id/status`

**Descrição:** Atualiza o status de um pagamento.

**Autenticação:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Parâmetros:**
- `id` (path): UUID do pagamento

**Request Body:**
```json
{
  "status": "APPROVED"
}
```

**Status válidos:** `PENDING`, `PROCESSING`, `APPROVED`, `REJECTED`, `EXPIRED`, `CANCELLED`

**Response 200:**
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "amount": 154.80,
  "discountAmount": 23.22,
  "finalAmount": 131.58,
  "paymentMethod": "PIX",
  "installments": 1,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:10:00.000Z",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "cpf": "12345678900"
  }
}
```

### Estatísticas de Pagamentos

**Endpoint:** `GET /admin/payments/stats`

**Descrição:** Retorna estatísticas dos pagamentos.

**Autenticação:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "total": 150,
  "byStatus": {
    "PENDING": 10,
    "PROCESSING": 5,
    "APPROVED": 120,
    "REJECTED": 10,
    "EXPIRED": 3,
    "CANCELLED": 2
  },
  "byMethod": {
    "CREDIT_CARD": 80,
    "PIX": 70
  },
  "totalAmount": 23120.50,
  "approvedAmount": 18500.00
}
```

---

## 👤 Administração - Usuários

### Listar Usuários

**Endpoint:** `GET /admin/users`

**Descrição:** Lista todos os usuários cadastrados com busca e paginação.

**Autenticação:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20, máximo: 100)
- `search` (opcional): Buscar por nome, email ou CPF

**Exemplo:**
```
GET /admin/users?search=João&page=1&limit=20
```

**Response 200:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@example.com",
      "phone": "11999999999",
      "cpf": "12345678900",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "_count": {
        "payments": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Obter Detalhes do Usuário

**Endpoint:** `GET /admin/users/:id`

**Descrição:** Obtém detalhes completos de um usuário específico.

**Autenticação:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Parâmetros:**
- `id` (path): UUID do usuário

**Response 200:**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "11999999999",
  "cpf": "12345678900",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "payments": [
    {
      "id": "uuid",
      "amount": 154.80,
      "status": "APPROVED",
      "paymentMethod": "PIX",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "_count": {
    "payments": 5
  }
}
```

### Atualizar Usuário

**Endpoint:** `PATCH /admin/users/:id`

**Descrição:** Atualiza informações de um usuário.

**Autenticação:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Parâmetros:**
- `id` (path): UUID do usuário

**Request Body:**
```json
{
  "name": "João Silva Santos",
  "email": "joao.novo@example.com",
  "phone": "11988888888",
  "cpf": "12345678900"
}
```

**Campos:** Todos opcionais (apenas os campos fornecidos serão atualizados)

**Response 200:**
```json
{
  "id": "uuid",
  "name": "João Silva Santos",
  "email": "joao.novo@example.com",
  "phone": "11988888888",
  "cpf": "12345678900",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:10:00.000Z"
}
```

**Response 400:**
```json
{
  "error": "Email já cadastrado"
}
```

### Deletar Usuário

**Endpoint:** `DELETE /admin/users/:id`

**Descrição:** Deleta um usuário e todos os seus pagamentos.

**Autenticação:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Parâmetros:**
- `id` (path): UUID do usuário

**Response 200:**
```json
{
  "message": "Usuário deletado com sucesso"
}
```

---

## 🎫 Administração - Cupons

### Atualizar Cupom

**Endpoint:** `PATCH /admin/coupons/:code`

**Descrição:** Atualiza um cupom de desconto existente.

**Autenticação:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Parâmetros:**
- `code` (path): Código do cupom

**Request Body:**
```json
{
  "description": "Nova descrição",
  "discountValue": 25,
  "minAmount": 150,
  "maxDiscount": 60,
  "validFrom": "2025-01-01T00:00:00.000Z",
  "validUntil": "2025-12-31T23:59:59.000Z",
  "maxUses": 2000,
  "isActive": true
}
```

**Campos:** Todos opcionais (apenas os campos fornecidos serão atualizados)

**Response 200:**
```json
{
  "code": "PROMO2025",
  "description": "Nova descrição",
  "discountType": "PERCENTAGE",
  "discountValue": 25,
  "minAmount": 150,
  "maxDiscount": 60,
  "validFrom": "2025-01-01T00:00:00.000Z",
  "validUntil": "2025-12-31T23:59:59.000Z",
  "maxUses": 2000,
  "currentUses": 0,
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:10:00.000Z"
}
```

### Deletar Cupom

**Endpoint:** `DELETE /admin/coupons/:code`

**Descrição:** Deleta um cupom de desconto.

**Autenticação:** Requerida (Bearer Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Parâmetros:**
- `code` (path): Código do cupom

**Response 200:**
```json
{
  "message": "Cupom deletado com sucesso"
}
```

---

## 📊 Códigos de Status HTTP

| Código | Descrição | Quando Usar |
|--------|-----------|-------------|
| 200 | OK | Requisição bem-sucedida |
| 201 | Created | Recurso criado com sucesso |
| 400 | Bad Request | Erro na validação dos dados |
| 401 | Unauthorized | Token ausente ou inválido |
| 404 | Not Found | Recurso não encontrado |
| 500 | Internal Server Error | Erro interno do servidor |

---

## ⚠️ Tratamento de Erros

Todos os erros retornam no seguinte formato:

```json
{
  "error": "Mensagem descritiva do erro"
}
```

### Exemplos de Erros Comuns

**Validação de Dados:**
```json
{
  "error": "Número de parcelas inválido. Deve ser entre 1 e 12."
}
```

**Recurso Não Encontrado:**
```json
{
  "error": "Pagamento não encontrado"
}
```

**Autenticação:**
```json
{
  "error": "Token de autenticação não fornecido"
}
```

**Cupom Inválido:**
```json
{
  "error": "Cupom não encontrado ou inválido"
}
```

---

## 🔑 Autenticação

### Como Obter o Token

1. Faça login em `POST /admin/login` com email e senha
2. Receba o token JWT no response
3. Use o token no header `Authorization` de todas as requisições protegidas

### Formato do Header

```
Authorization: Bearer <seu-token-jwt>
```

### Validade do Token

- Padrão: 7 dias
- Configurável via variável de ambiente `JWT_EXPIRES_IN`

---

## 📝 Notas Importantes

1. **Formato de Datas:** Todas as datas são retornadas no formato ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)

2. **Valores Monetários:** Todos os valores monetários são em números decimais (ex: `154.80`)

3. **CPF:** Deve ser enviado apenas com números (sem pontos ou traços)

4. **Códigos de Cupom:** São automaticamente convertidos para maiúsculas

5. **Paginação:** Padrão de 20 itens por página, máximo de 100

6. **Pix QR Code:** Expira em 60 minutos após a criação

7. **Parcelas:** Apenas para cartão de crédito, entre 1 e 12 parcelas

---

## 🚀 Exemplos de Integração

### Exemplo: Criar Checkout com Pix

```bash
curl -X POST http://localhost:3000/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "João Silva",
      "email": "joao@example.com",
      "phone": "11999999999",
      "cpf": "12345678900"
    },
    "amount": 154.80,
    "paymentMethod": "PIX",
    "couponCode": "DESCONTO15"
  }'
```

### Exemplo: Login e Listar Pagamentos

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }' | jq -r '.token')

# 2. Listar pagamentos
curl -X GET http://localhost:3000/admin/payments \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 Documentação Interativa

Acesse a documentação Swagger interativa em:
```
http://localhost:3000/docs
```

Lá você pode testar todos os endpoints diretamente no navegador.

---

**Última atualização:** Janeiro 2025

