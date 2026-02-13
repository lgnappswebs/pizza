
# Guia Técnico: Módulo de Gerenciamento de Produtos (PizzApp)

Este documento detalha as regras, permissões e funcionalidades da página de administração de produtos para uso em outros projetos.

## 1. Tecnologias Utilizadas
- **Framework:** Next.js 15 (App Router)
- **Banco de Dados:** Firebase Firestore
- **Autenticação:** Firebase Auth
- **Estilização:** Tailwind CSS + ShadCN UI
- **Ícones:** Lucide React

## 2. Estrutura de Dados (Firestore)
Coleção principal: `produtos`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | Nome do item (ex: Pizza de Calabresa) |
| `description` | string | Ingredientes ou detalhes do produto |
| `price` | number | Preço fixo (caso não tenha múltiplos tamanhos) |
| `categoryId` | string | ID da categoria vinculada (coleção `categorias`) |
| `imageUrl` | string | URL da imagem ou string Base64 |
| `isAvailable` | boolean | Controla se o item aparece no cardápio |
| `isPromotion` | boolean | Ativa o selo de oferta e lógica de preço riscado |
| `hasMultipleSizes`| boolean | Ativa campos de preços P, M e G |
| `priceSmall` | number | Preço para tamanho Pequena (Broto) |
| `priceMedium` | number | Preço para tamanho Média |
| `priceLarge` | number | Preço para tamanho Grande |
| `promotionSize` | string | Define qual tamanho está em oferta (`all`, `small`, `medium`, `large`) |

## 3. Funcionalidades de Interface (UX)

### Formulários de Edição (Modais)
- **Centralização:** Títulos centralizados com `pt-10` para melhor respiro visual.
- **Moldura:** Todos os modais possuem `border-2` e `rounded-3xl` para um visual "Premium".
- **Pré-visualização de Imagem:** Assim que um link é colado ou um arquivo é enviado, uma miniatura aparece abaixo do campo para validação imediata.
- **Switches de Ativação:** Toda a área da linha (retângulo) é clicável. Usamos um `onClick` no `div` pai para alternar o estado do `Switch` interno.

### Lógica de Preços
- **Máscara Monetária:** O input aceita apenas números, converte para centavos internamente e exibe formatado como `R$ 0,00` em tempo real.
- **Destaque Visual:** No cardápio, os preços de venda são exibidos com `font-black` e tamanhos ampliados. Se houver promoção no tamanho selecionado, o preço original (+25% simulado) aparece riscado.

## 4. Regras de Segurança (Firestore Rules)

O acesso é controlado para que apenas administradores autorizados possam modificar o cardápio.

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    // Função para validar administradores
    function isAdmin() {
      return request.auth != null && (
        request.auth.token.email == 'lgngregorio@icloud.com' || 
        request.auth.token.email == 'admin@pizzapp.com'
      );
    }

    match /produtos/{doc} {
      allow read: if true; // Leitura pública para os clientes
      allow write: if isAdmin(); // Escrita bloqueada para não-admins
    }
  }
}
```

## 5. Fluxo de Publicação
As alterações feitas no Admin utilizam funções `non-blocking` (`updateDocumentNonBlocking` e `addDocumentNonBlocking`). Isso significa que a interface do administrador é atualizada instantaneamente no cache local enquanto o Firebase sincroniza os dados em segundo plano, garantindo uma navegação rápida e sem travamentos.
