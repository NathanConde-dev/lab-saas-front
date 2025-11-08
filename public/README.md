# Pasta Public

Esta pasta contém arquivos estáticos que serão servidos diretamente pelo Next.js.

## Logo

Para adicionar a logo do checkout:

1. Coloque o arquivo da logo na pasta `public` com o nome `logo.png`
2. Ou use outro nome/format e atualize o componente `CheckoutHeader`:

```tsx
<CheckoutHeader logoSrc="/seu-logo.png" logoAlt="Nome da sua empresa" />
```

### Formatos suportados
- PNG (recomendado)
- SVG
- JPG/JPEG
- WebP

### Tamanho recomendado
- Altura: aproximadamente 48px
- Largura: proporcional (geralmente entre 100-200px)

### Exemplo de uso

```tsx
// Usando a logo padrão (logo.png)
<CheckoutHeader />

// Usando uma logo customizada
<CheckoutHeader 
  logoSrc="/minha-logo.png" 
  logoAlt="Minha Empresa" 
/>
```

