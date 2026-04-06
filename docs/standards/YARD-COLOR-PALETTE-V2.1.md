# YARD Color Palette v2.1

Sistema de cores da marca YARD para CLI, terminal e componentes de interface. Identidade visual: **Orange + Cream** em superfícies escuras.

> Implementação de referência: `packages/installer/src/utils/yard-colors.js`

---

## 1. Cores de marca (Core Brand)

| Nome       | Hex       | Uso |
|------------|-----------|-----|
| **Primary**   | `#FF6600` | Perguntas principais, headers, CTAs, banner, ações primárias |
| **Secondary** | `#F4F4E8` | Destaques importantes, ênfase, informação chave (YARD Cream) |
| **Tertiary**  | `#CC5200` | Ações secundárias, links, elementos complementares (Orange dim) |

Todas as cores são compatíveis com **WCAG AA** em terminais escuros.

---

## 2. Cores funcionais (Functional)

| Nome     | Hex       | Uso |
|----------|-----------|-----|
| **Success** | `#10B981` | Checkmarks, etapas concluídas, mensagens de sucesso |
| **Warning** | `#F59E0B` | Avisos, confirmações, estados de cautela |
| **Error**   | `#EF4444` | Erros, alertas críticos, falhas de validação |
| **Info**    | `#06B6D4` | Mensagens informativas, dicas, texto de ajuda |

---

## 3. Cores neutras (Neutral)

| Nome   | Hex       | Uso |
|--------|-----------|-----|
| **Muted** | `#94A3B8` | Texto sutil, estados desabilitados, conteúdo secundário |
| **Dim**   | `#64748B` | Texto secundário, conteúdo menos importante |

---

## 4. Gradiente (Gradient)

Identidade: **Orange → Cream**.

| Ponto  | Nome   | Hex       |
|--------|--------|-----------|
| Start  | Orange (primary) | `#FF6600` |
| Middle | Orange dim      | `#CC5200` |
| End    | Cream (secondary) | `#F4F4E8` |

Uso: animações e efeitos especiais em CLI/UI.

---

## 5. Atalhos semânticos (Semantic Shortcuts)

- **highlight** – texto em destaque (primary em bold)
- **brandPrimary** – momentos de marca YARD (primary bold)
- **brandSecondary** – elementos de apoio da marca (Cream)

---

## 6. Indicadores de status (Status)

Helper que combina ícone + cor:

- `success` → ✓ (verde)
- `error` → ✗ (vermelho)
- `warning` → ⚠️ (laranja)
- `info` → ℹ (ciano)
- `loading` → ⏳ (ciano)
- `skipped` → ⊘ (muted)
- `tip` → 💡 (info)
- `celebrate` → 🎉 (brand primary)

---

## 7. Referência cruzada

- **Quick reference:** [YARD-COLOR-PALETTE-QUICK-REFERENCE.md](./YARD-COLOR-PALETTE-QUICK-REFERENCE.md)
- **Código:** `packages/installer/src/utils/yard-colors.js`
