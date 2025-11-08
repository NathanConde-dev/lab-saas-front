# Lab SaaS - Frontend

Sistema de checkout e pagamentos desenvolvido com Next.js, Radix UI e TailwindCSS.

## 🚀 Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **TailwindCSS** - Estilização
- **Radix UI** - Componentes acessíveis
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

## 📦 Instalação

1. Instale as dependências:

```bash
npm install
```

2. Configure as variáveis de ambiente:

Crie um arquivo `.env.local` na raiz do projeto:

```env
# URL da API Backend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Porta do servidor Next.js (padrão: 3000 se não especificado)
PORT=3001
```

3. Execute o servidor de desenvolvimento:

```bash
npm run dev
```

O aplicativo estará disponível na porta configurada no `.env.local` (padrão: 3000).

**Nota:** O Next.js lê automaticamente a variável `PORT` do arquivo `.env.local`. Se não especificar, usará a porta padrão 3000. Você também pode especificar a porta diretamente no comando: `npm run dev -- -p 3001`

## 📁 Estrutura do Projeto

```
front/
├── app/                    # Páginas e rotas (App Router)
│   ├── checkout/          # Páginas de checkout
│   │   ├── page.tsx       # Página inicial de checkout
│   │   ├── pix/           # Checkout Pix
│   │   ├── cartao/        # Checkout Cartão
│   │   └── success/       # Página de sucesso
│   ├── admin/             # Painel administrativo
│   │   ├── login/         # Login do admin
│   │   ├── page.tsx       # Dashboard
│   │   ├── payments/      # Gerenciamento de pagamentos
│   │   ├── users/         # Gerenciamento de usuários
│   │   └── coupons/       # Gerenciamento de cupons
│   └── layout.tsx         # Layout principal
├── components/            # Componentes React
│   ├── ui/               # Componentes base (Radix UI)
│   └── checkout/         # Componentes específicos do checkout
├── lib/                  # Utilitários e serviços
│   ├── api.ts           # Cliente API
│   ├── auth.ts          # Gerenciamento de autenticação
│   └── utils.ts         # Funções utilitárias
└── API_DOCUMENTATION.md  # Documentação da API
```

## 🎯 Funcionalidades

### Checkout

- ✅ Formulário de informações pessoais
- ✅ Seleção de método de pagamento (Cartão ou Pix)
- ✅ Checkout com cartão de crédito (com parcelas)
- ✅ Checkout com Pix (QR Code e código copia-e-cola)
- ✅ Validação de cupons de desconto
- ✅ Resumo do pedido
- ✅ Página de sucesso

### Painel Administrativo

- ✅ Login de administrador
- ✅ Dashboard com estatísticas
- ✅ Gerenciamento de pagamentos
- ✅ Gerenciamento de usuários
- ✅ Gerenciamento de cupons

## 🔐 Autenticação

O painel administrativo utiliza autenticação JWT. O token é armazenado no localStorage após o login.

## 📝 Notas

- O projeto está configurado para se conectar com a API em `http://localhost:3000`
- Para produção, atualize a variável `NEXT_PUBLIC_API_URL` no arquivo `.env.local`
- O sistema de pagamento com cartão de crédito requer integração com um gateway de pagamento real (atualmente está usando um token simulado)

## 🛠️ Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter

## 📄 Licença

Todos os direitos reservados © 2025

