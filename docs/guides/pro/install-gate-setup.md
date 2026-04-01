# Yard Pro — Guia de Instalação e Licenciamento

Guia completo para instalar, ativar e gerenciar o Yard Pro.

**Story:** PRO-6 — License Key & Feature Gating System

---

## Visao Geral

O Yard Pro é distribuído via npm público. O pacote e livre para instalar, mas as features premium requerem uma **licenca ativa** para funcionar.

```
Comprar Licenca → Instalar → Ativar → Usar Features Pro
```

### Pacotes npm

| Pacote | Tipo | Proposito |
|--------|------|-----------|
| `yard-pro` | CLI (1.8 KB) | Comandos de instalação e gerenciamento |
| `@ernesto-langa/yard-pro` | Core (10 MB) | Features premium (squads, memory, metrics, integrations) |

---

## Instalacao Rapida

```bash
# Instalar Yard Pro (instala @ernesto-langa/yard-pro automaticamente)
npx yard-pro install

# Ativar sua licenca
npx yard-pro activate --key PRO-XXXX-XXXX-XXXX-XXXX

# Verificar ativacao
npx yard-pro status
```

---

## Passo a Passo

### Prerequisitos

- Node.js >= 18
- `yard-core` >= 4.0.0 instalado no projeto

### Passo 1: Instalar YARD Pro

```bash
npx yard-pro install
```

Isso executa `npm install @ernesto-langa/yard-pro` no seu projeto.

**Alternativa** (instalacao manual):

```bash
npm install @ernesto-langa/yard-pro
```

### Passo 2: Ativar Licenca

Apos a compra, voce recebera uma chave no formato `PRO-XXXX-XXXX-XXXX-XXXX`.

```bash
npx yard-pro activate --key PRO-XXXX-XXXX-XXXX-XXXX
```

Esse comando:
1. Valida a chave contra o License Server (`https://yard-license-server.vercel.app`)
2. Registra sua maquina (machine ID unico)
3. Salva um cache local criptografado para uso offline

### Passo 3: Verificar

```bash
# Status da licenca
npx yard-pro status

# Listar features disponiveis
npx yard-pro features
```

---

## Comandos Disponiveis

| Comando | Descricao |
|---------|-----------|
| `npx yard-pro install` | Instala `@ernesto-langa/yard-pro` no projeto |
| `npx yard-pro activate --key KEY` | Ativa uma chave de licenca |
| `npx yard-pro status` | Mostra status da licenca atual |
| `npx yard-pro features` | Lista todas as features pro e disponibilidade |
| `npx yard-pro validate` | Forca revalidacao online da licenca |
| `npx yard-pro deactivate` | Desativa a licenca nesta maquina |
| `npx yard-pro help` | Mostra todos os comandos |

---

## Operacao Offline

Apos a instalacao e ativacao, o YARD Pro funciona offline:

- **30 dias** sem necessidade de revalidacao
- **7 dias de grace period** apos expirar o cache
- Verificacao de features 100% local no dia a dia

A internet so e necessaria para:
1. Ativacao inicial (`npx yard-pro activate`)
2. Revalidacao periodica (automatica a cada 30 dias)
3. Desativacao (`npx yard-pro deactivate`)

---

## CI/CD

Para pipelines, instale e ative usando secrets de ambiente:

**GitHub Actions:**
```yaml
- name: Install YARD Pro
  run: npx yard-pro install

- name: Activate License
  run: npx yard-pro activate --key ${{ secrets.YARD_PRO_LICENSE_KEY }}
```

**GitLab CI:**
```yaml
before_script:
  - npx yard-pro install
  - npx yard-pro activate --key ${YARD_PRO_LICENSE_KEY}
```

---

## Troubleshooting

### Chave de licenca invalida

```
License activation failed: Invalid key format
```

- Verifique o formato: `PRO-XXXX-XXXX-XXXX-XXXX` (4 blocos de 4 caracteres hex)
- Sem espacos extras
- Abra uma issue em https://github.com/ernesto-langa/yard-core/issues se a chave foi fornecida a voce

### Maximo de seats excedido

```
License activation failed: Maximum seats exceeded
```

- Desative a licenca na outra maquina: `npx yard-pro deactivate`
- Ou contate support para aumentar o limite de seats

### Erro de rede na ativacao

```
License activation failed: ECONNREFUSED
```

- Verifique sua conexao com a internet
- O License Server pode estar temporariamente indisponivel
- Tente novamente em alguns minutos

---

## Arquitetura do Sistema

```
┌─────────────────┐     ┌─────────────────────────────────┐     ┌──────────┐
│  Cliente (CLI)   │────>│  License Server (Vercel)        │────>│ Supabase │
│  npx yard-pro    │<────│  yard-license-server.vercel.app │<────│ Database │
└─────────────────┘     └─────────────────────────────────┘     └──────────┘
                                                                      │
                                                                      │
                        ┌─────────────────────────────────┐           │
                        │  Admin Dashboard (Vercel)       │───────────┘
                        │  yard-license-dashboard         │
                        │  Cria/revoga/gerencia licencas  │
                        └─────────────────────────────────┘
```

| Componente | URL | Proposito |
|-----------|-----|-----------|
| License Server | `https://yard-license-server.vercel.app` | API de ativacao/validacao |
| Admin Dashboard | `https://yard-license-dashboard.vercel.app` | Gestao de licencas (admin) |
| Database | Supabase PostgreSQL | Armazena licencas e ativacoes |

---

## Suporte

- **Documentacao:** https://synkra.ai/pro/docs
- **Comprar:** https://synkra.ai/pro
- **Suporte:** https://github.com/ernesto-langa/yard-core/issues
- **Issues:** https://github.com/ernesto-langa/yard-core/issues

---

*YARD Pro Installation Guide v3.0*
*Story PRO-6 — License Key & Feature Gating System*
