
# Guia Técnico: Módulo de Gerenciamento de Produtos (PizzApp)

Este documento detalha as regras, permissões e funcionalidades da página de administração de produtos para uso em outros projetos ou replicação de lógica.

## 1. Tecnologias Utilizadas
- **Framework:** Next.js 15 (App Router)
- **Banco de Dados:** Firebase Firestore
- **Autenticação:** Firebase Auth (Client SDK)
- **Estilização:** Tailwind CSS + ShadCN UI + Lucide Icons

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

## 3. Funcionalidades de Interface (UI/UX)

### Formulários Administrativos (Modais)
- **Centralização Profissional:** Todos os títulos dos formulários são centralizados e possuem um recuo superior (`pt-10`) para melhor respiro visual.
- **Moldura Premium:** As janelas de diálogo possuem uma borda visível de 2px (`border-2`) e cantos arredondados (`rounded-3xl`).
- **Pré-visualização de Imagem:** Ao inserir uma URL ou carregar um arquivo, uma miniatura aparece instantaneamente abaixo do campo para validação visual.
- **Interatividade Inteligente:** Toda a área da linha de um seletor (Switch) é clicável. O usuário pode clicar no texto ou no fundo do retângulo para alternar a opção, não apenas na pequena chave.

### Lógica de Promoções
- **Seleção de Tamanho:** O administrador pode definir se a promoção vale para o produto todo ou apenas para um tamanho específico.
- **Exibição Dinâmica:** No cardápio do cliente, o preço riscado (De/Por) só aparece se o tamanho que o cliente selecionou coincidir com o tamanho em promoção definido no admin.

### Máscaras e Formatação
- **Moeda:** Inputs monetários aceitam apenas números e formatam em tempo real para `R$ 0,00`, convertendo para centavos (`number`) antes de salvar no banco.

## 4. Regras de Segurança (Firestore Rules)

O acesso é controlado para que apenas administradores autorizados possam modificar o cardápio.

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && (
        request.auth.token.email == 'admin@pizzapp.com' ||
        request.auth.token.email == 'lgngregorio@icloud.com'
      );
    }

    match /produtos/{doc} {
      allow read: if true; // Cardápio público
      allow write: if isAdmin(); // Apenas admin altera
    }
  }
}
```

## 5. Fluxo de Publicação
As alterações utilizam funções `non-blocking` que atualizam o cache local instantaneamente, garantindo que o administrador sinta o aplicativo rápido e responsivo enquanto a sincronização ocorre em segundo plano.
