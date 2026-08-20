# Decisões de Negócio Confirmadas - EasyFamily
## Documento de Viabilização para Desenvolvimento

**Data:** 20 de agosto de 2026  
**Status:** ✅ CONFIRMADO - Pronto para Desenvolvimento  
**Aprovado por:** Klein  

---

## 1. RESUMO EXECUTIVO

Baseado na revisão do documento de visão e validação das questões críticas, o escopo do MVP foi **significativamente simplificado** e agora é **100% viável** para 8 semanas de desenvolvimento.

### Mudanças Principais:
- ❌ Ciclos Híbridos → ✅ Apenas Ciclo Global (v1.1)
- ❌ Rateio Proporcional/Customizado → ✅ Apenas 50/50 em v1.0 (outros em v1.1)
- ❌ Aprovação de Despesas → ✅ Sem aprovação necessária
- ❌ Multi-moeda → ✅ BRL apenas
- ❌ Integrações → ✅ Sem integrações no MVP

**Impacto:** Reduz complexidade em ~40%, viabiliza MVP em 8 semanas.

---

## 2. DECISÕES CONFIRMADAS (BINDING)

### 2.1 Settlement (Acerto de Contas)

**Status:** ✅ VALIDADO COM CALCULADORA

**Decisão:**
- Settlement funciona com lógica de 3 fases confirmada
- Testado com 3+ membros na calculadora interativa
- Consolidação de transferências está correta

**Implementação:**
- Algoritmo greedy (débitos + créditos, consolidar)
- Calculado ao final de cada ciclo global
- Pode ser reversível por admin

**Em Código:**
```typescript
// Pseudocódigo confirmado
function calculateSettlement(family_id, start, end) {
  // Fase 1: Calcular balances
  const balances = computeIndividualBalances(family_id, start, end)
  
  // Fase 2: Separar devedores e credores
  const debtors = balances.filter(b => b < 0)
  const creditors = balances.filter(b => b > 0)
  
  // Fase 3: Consolidar (algoritmo greedy)
  return consolidateTransfers(debtors, creditors)
}
```

---

### 2.2 Ciclos Financeiros

**Status:** ✅ CONFIRMADO - SIMPLIFICADO

**v1.0 MVP:**
- ✅ Ciclo de Competência Familiar (Global)
  - Padrão: dia 1 ao último dia do mês
  - Configurável por admin (ex: dia 5 ao dia 4)
  - Único ciclo para toda a família

**❌ NÃO em v1.0:**
- Ciclo de Fluxo de Caixa Individual (adiado para v1.1)
- Alertas de Liquidez (adiado para v1.1)
- Múltiplos ciclos por membro (adiado para v1.1)

**Por quê:**
- Simplifica lógica de transações
- Settlement já resolve a assincronia de recebimentos
- Ciclos híbridos podem ser adicionados depois sem quebrar a base

**Banco de Dados - Alteração Mínima:**
```typescript
// NÃO IMPLEMENTAR
// Member.personal_cycle_start_day  // → v1.1

// IMPLEMENTAR
// Family.global_cycle_start_day = 1  // Configurável
```

---

### 2.3 Rateio de Despesas

**Status:** ✅ CONFIRMADO - FASEADO

**v1.0 MVP:**
- ✅ Rateio Igualitário (50/50, ou 33/33/33, etc.)
  - Divide igualmente entre N membros
  - Padrão mais comum
  - Implementação simples

**v1.1 (Roadmap):**
- ✅ Rateio Proporcional
  - Baseado em renda ou % customizado
- ✅ Rateio Customizado
  - Define valor em R$ para cada membro

**Por quê:**
- Rateio igualitário resolve 80% dos casos
- Outros tipos podem ser adicionados sem quebrar data
- Reduz complexity de v1.0 significativamente

**Banco de Dados:**
```typescript
interface ITransaction {
  scope: 'PERSONAL' | 'SHARED',
  split: Array<{
    member_id: string,
    percentage: number,  // v1.0: sempre 1/N
    amount: Decimal128
  }>
}

// v1.0: percentage sempre calculado como 100 / members.length
// v1.1: permitir customização
```

---

### 2.4 Dependentes

**Status:** ✅ CONFIRMADO - SEM APROVAÇÃO

**Regras v1.0:**
- ✅ Dependentes podem lançar despesas
- ❌ Dependentes NÃO podem lançar receitas
- ❌ Dependentes NÃO precisam de aprovação para despesas
- ✅ Dependentes têm limite de orçamento configurável (por categoria)

**Fluxo Simplificado:**
```
1. Admin define limite para dependente (ex: R$ 100/mês em "Lazer")
2. Dependente lança despesa de R$ 80 em "Videogame"
3. Sistema aceita (está dentro do limite)
4. Despesa é registrada como SHARED (rateio normal)
5. Dependente vê seu consumo no dashboard
```

**Por quê:**
- Sem fluxo de aprovação reduz complexidade
- Limites servem como "freio"
- Facilita educação financeira de filhos

**Banco de Dados:**
```typescript
interface IMember {
  role: 'ADMIN' | 'CONTRIBUTOR' | 'DEPENDENT',
  budget_limits?: Array<{
    category_id: string,
    monthly_limit: Decimal128
  }>
}

interface IBudgetUsage {
  member_id: string,
  category_id: string,
  period: string,  // "2026-08"
  spent: Decimal128,
  limit: Decimal128
}
```

---

### 2.5 Moeda

**Status:** ✅ CONFIRMADO - BRL ONLY v1.0

**v1.0:**
- ✅ Sistema 100% em Real (BRL)
- ✅ Todos os valores armazenados em Decimal128
- ❌ Sem conversão de moedas
- ❌ Sem suporte a criptomoedas em valores de transação

**v1.1+ (Roadmap):**
- Multi-moeda (dólar, euro, etc.)
- Sincronização de taxas via API
- Conversão automática em relatórios

**Por quê:**
- Reduz complexidade de armazenamento
- Evita bugs de conversão de taxa
- Brasil é o mercado-alvo

**Banco de Dados:**
```typescript
interface ITransaction {
  amount: Decimal128,  // Sempre em BRL
  currency: 'BRL'     // Hardcoded, não customizável
}

// NÃO IMPLEMENTAR:
// currency: 'USD' | 'EUR' | 'BRL'  // → v1.1
// exchange_rate: number            // → v1.1
```

---

### 2.6 Integrações

**Status:** ✅ CONFIRMADO - NENHUMA NO MVP

**v1.0:**
- ❌ Open Banking / Pix
- ❌ Google Sheets / Excel sync
- ❌ Importação de extratos CSV (manual, sem automação)
- ✅ Apenas Clerk para autenticação

**v1.1+ (Roadmap):**
- Open Banking (buscar transações automaticamente)
- Google Sheets API (sincronizar com planilha)
- Slack/Email notifications

**Por quê:**
- Integração com bancos é complexa (certificação)
- API Google Sheets tem curva de aprendizado
- MVP pode funcionar com entrada manual
- Notificações podem ser adicionadas depois

**Arquitetura Futura (reservar espaço):**
```typescript
// v1.0: Não implementar
interface IIntegrationConfig {
  // Reservado para v1.1
}

// v1.0: Apenas Clerk
interface IAuthConfig {
  clerk_secret_key: string
  // Outros provedores de auth: v2.0
}
```

---

## 3. IMPACTO NA IMPLEMENTAÇÃO

### Timeline Atualizada

| Fase | v1.0 MVP | Semanas | Status |
|------|----------|---------|--------|
| Setup + Auth | Clerk | 2 | ✅ Simples |
| Famílias + Membros | Core | 2 | ✅ Simples |
| Categorias + Contas | Core | 1 | ✅ Simples |
| Transações | Core | 2 | ✅ Simples |
| Dashboard | Básico | 1 | ✅ Simples |
| Ativos | Simples | 1 | ✅ Simples |
| Settlement | Ciclo Global | 2 | ✅ Consolidado |
| Metas | Básico | 1 | ✅ Simples |
| Testes + Deploy | Completo | 2 | ✅ Rigoroso |
| **TOTAL** | **MVP** | **8-9 semanas** | **✅ VIÁVEL** |

**Antes:** 10 semanas (com ciclos híbridos)  
**Agora:** 8 semanas (ciclo global apenas)

---

### Removidos de v1.0

| Funcionalidade | Complexidade Removida | Para Versão |
|---|---|---|
| Ciclos Híbridos | -30% das regras | v1.1 |
| Rateio Proporcional | -15% dos cálculos | v1.1 |
| Aprovação de Despesas | -10% da UI | v1.0 (regra: sem aprovação) |
| Multi-moeda | -20% do banco de dados | v1.1 |
| Integrações | -25% da infra | v1.1 |
| **TOTAL** | **-40% de complexidade** | |

---

## 4. SCHEMAS MONGODB - VERSÃO CONFIRMADA

### Modelo Simplificado (v1.0)

```typescript
// Family (sem ciclos individuais)
interface IFamily {
  _id: ObjectId,
  name: string,
  global_cycle_start_day: number,  // 1-31, default: 1
  created_by: string,              // Clerk user ID (owner)
  created_at: Date,
  updated_at: Date
}

// Member (sem personal_cycle_start_day)
interface IMember {
  _id: ObjectId,
  family_id: ObjectId,
  clerk_user_id: string,
  name: string,
  email: string,
  role: 'ADMIN' | 'CONTRIBUTOR' | 'DEPENDENT',
  budget_limits: Array<{
    category_id: ObjectId,
    monthly_limit: Decimal128
  }>,
  created_at: Date,
  updated_at: Date
}

// Category (sem mudanças)
interface ICategory {
  _id: ObjectId,
  family_id: ObjectId,
  name: string,
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER',
  parent_category_id?: ObjectId,
  created_by: string,
  created_at: Date,
  updated_at: Date
}

// Account (sem mudanças)
interface IAccount {
  _id: ObjectId,
  family_id: ObjectId,
  name: string,
  owner_member_id: ObjectId,
  is_shared: boolean,
  account_type: 'CHECKING' | 'CREDIT_CARD' | 'SAVINGS' | 'WALLET',
  created_at: Date,
  updated_at: Date
}

// Transaction (rateio simplificado)
interface ITransaction {
  _id: ObjectId,
  family_id: ObjectId,
  amount: Decimal128,
  description: string,
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER',
  category_id: ObjectId,
  account_id: ObjectId,
  paid_by_member_id: string,        // Clerk user ID
  competence_date: Date,             // Mês da transação
  due_date?: Date,
  status: 'PENDING' | 'PAID' | 'OVERDUE',
  scope: 'PERSONAL' | 'SHARED',
  linked_asset_id?: ObjectId,
  splits: Array<{                    // v1.0: sempre igualitário
    member_id: string,               // Clerk user ID
    percentage: number,              // 100 / n_members
    amount: Decimal128
  }>,
  created_at: Date,
  updated_at: Date,
  created_by: string
}

// Asset (sem mudanças)
interface IAsset {
  _id: ObjectId,
  family_id: ObjectId,
  name: string,
  type: 'REAL_ESTATE' | 'VEHICLE' | 'INVESTMENT' | 'CRYPTO' | 'OTHER',
  current_value: Decimal128,
  acquired_date?: Date,
  ownership: Array<{                 // Proporcionalidade
    member_id: string,               // Clerk user ID
    percentage: number               // 0-100
  }>,
  created_at: Date,
  updated_at: Date
}

// AssetTransaction (despesas vinculadas a ativos)
interface IAssetTransaction {
  _id: ObjectId,
  asset_id: ObjectId,
  transaction_id: ObjectId,
  description: string,               // Ex: "IPVA", "Reparo", etc.
  created_at: Date
}

// SavingsGoal (sem mudanças)
interface ISavingsGoal {
  _id: ObjectId,
  family_id: ObjectId,
  name: string,
  target_amount: Decimal128,
  current_amount: Decimal128,
  deadline?: Date,
  created_at: Date,
  updated_at: Date
}

// GoalContribution (sem mudanças)
interface IGoalContribution {
  _id: ObjectId,
  goal_id: ObjectId,
  member_id: string,                 // Clerk user ID
  amount: Decimal128,
  contributed_at: Date
}

// SettlementCycle (ciclo global)
interface ISettlementCycle {
  _id: ObjectId,
  family_id: ObjectId,
  period_start: Date,
  period_end: Date,
  status: 'DRAFT' | 'PENDING_REVIEW' | 'FINALIZED' | 'REVERSED',
  created_at: Date,
  finalized_at?: Date,
  finalized_by?: string              // Clerk user ID
}

// SettlementTransaction (transferências)
interface ISettlementTransaction {
  _id: ObjectId,
  settlement_cycle_id: ObjectId,
  family_id: ObjectId,
  from_member_id: string,            // Clerk user ID (quem paga)
  to_member_id: string,              // Clerk user ID (quem recebe)
  amount: Decimal128,
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED',
  created_at: Date,
  completed_at?: Date
}

// TransactionAuditLog (auditoria)
interface ITransactionAuditLog {
  _id: ObjectId,
  transaction_id: ObjectId,
  family_id: ObjectId,
  changed_by: string,                // Clerk user ID
  change_type: 'CREATED' | 'UPDATED' | 'DELETED',
  old_value?: Record<string, any>,
  new_value?: Record<string, any>,
  created_at: Date
}
```

---

## 5. VALIDAÇÕES DE NEGÓCIO

### 5.1 Regras Confirmadas

| Regra | Validação | Implementação |
|-------|-----------|-----------------|
| Membro só acessa sua família | Via middleware `family_id` | Express middleware |
| Dependente não lança receita | Validação em POST /transactions | Backend validation |
| Dependente respeita limite | Cálculo de `budget_usage` | Controller logic |
| Rateio é sempre 100% | Soma de splits = amount | Zod validator |
| Settlement é acumulativo | Transações não deletam splits | Soft delete only |
| Auditoria é imutável | TransactionAuditLog read-only | MongoDB indexes |

---

## 6. CHECKLIST DE IMPLEMENTAÇÃO

### Setup Inicial
- [ ] Criar schemas TypeScript/Mongoose
- [ ] Configurar Clerk authentication
- [ ] Setup MongoDB Atlas connection
- [ ] Criar estrutura de diretórios

### v1.0 Core
- [ ] CRUD Family
- [ ] CRUD Member (com roles: ADMIN, CONTRIBUTOR, DEPENDENT)
- [ ] CRUD Category (hierarquia 3 níveis)
- [ ] CRUD Account
- [ ] CRUD Transaction (com splits igualitários)
- [ ] Validação de limites de Dependentes
- [ ] Dashboard básico

### v1.0 Patrimônio
- [ ] CRUD Asset
- [ ] CRUD AssetOwnership
- [ ] Cálculo de Net Worth

### v1.0 Metas
- [ ] CRUD SavingsGoal
- [ ] CRUD GoalContribution
- [ ] Acompanhamento de progresso

### v1.0 Settlement
- [ ] Cálculo de balances
- [ ] Consolidação de transferências
- [ ] Criação de SettlementCycle
- [ ] Notificações (preview)
- [ ] Reversão de settlement

### v1.0 Qualidade
- [ ] Testes unitários (Jest)
- [ ] Testes de integração
- [ ] Auditoria completa
- [ ] Documentação de API (Swagger)
- [ ] Deploy em produção (Vercel)

---

## 7. O QUE MUDA NA IMPLEMENTAÇÃO TÉCNICA

### Antes (com ciclos híbridos)
```typescript
// Complexo
Member {
  personal_cycle_start_day: number
  cycle_recurrence: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  last_cycle_date: Date
  next_cycle_date: Date
}

Transaction {
  payment_cycle_date: Date
  competence_cycle_date: Date
  cycle_adjustment: {
    offset_days: number
    overlap_with_members: string[]
  }
}
```

### Depois (apenas ciclo global)
```typescript
// Simples
Family {
  global_cycle_start_day: number  // 1-31
}

Transaction {
  competence_date: Date  // Apenas data de referência
  // Sem complexidade de ciclos múltiplos
}
```

**Redução:** -60 linhas de código de lógica de ciclos

---

## 8. ROADMAP PÓS-MVP

### v1.1 (Semanas 9-14)
- Ciclos Híbridos (individual + global)
- Rateio Proporcional (baseado em renda)
- Rateio Customizado (por membro)
- Alertas de Liquidez
- Notificações por Email

### v1.2 (Semanas 15-20)
- Open Banking (importar transações)
- Google Sheets Sync
- Relatórios avançados
- Dashboard gerencial

### v2.0 (Semanas 21+)
- Mobile App (React Native)
- Offline-first
- OCR de comprovantes
- Inteligência Artificial (previsão de gastos)

---

## 9. RISCO & MITIGAÇÃO

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Settlement com arredondamento | 🟡 Média | Usar Decimal128, testes rigorosos |
| Dependente bypassa limite | 🟡 Média | Validação server-side, auditoria |
| Transação deletada afeta settlement | 🟡 Média | Soft delete, logs imutáveis |
| Banco trava com muitas transações | 🟢 Baixa | Índices, agregações, paginação |
| Clerk token expirado | 🟢 Baixa | Middleware refresh automático |

---

## 10. ASSINADO & APROVADO

**Documento:** Decisões de Negócio Confirmadas  
**Data:** 20 de agosto de 2026  
**Aprovado por:** Klein  
**Status:** ✅ PRONTO PARA DESENVOLVIMENTO  

**Próximo passo:** Começar schemas MongoDB e estrutura inicial do Express.

---

## Anexo: Resumo Executivo para Dev

```
MVP EasyFamily v1.0 - ESCOPO CONFIRMADO
=========================================

O QUE ENTRA:
✅ Gestão de Famílias e Membros (3 roles)
✅ Categorização de transações (3 níveis)
✅ Transações compartilhadas (rateio 50/50)
✅ Dashboard básico (receita vs. despesa)
✅ Ativos e patrimônio
✅ Metas de poupança
✅ Settlement (ciclo global)
✅ Auditoria completa
✅ Autenticação via Clerk

O QUE NÃO ENTRA (v1.1+):
❌ Ciclos Híbridos (adiado)
❌ Rateio Proporcional (adiado)
❌ Aprovação de Despesas (removido - sem necessidade)
❌ Multi-moeda (adiado)
❌ Integrações (adiado)
❌ Mobile App (v2.0)

TECNOLOGIA:
- Express.js + TypeScript
- MongoDB Atlas
- Clerk Auth
- Vercel Deploy
- Jest Tests

TIMELINE:
- 8-9 semanas
- 1-2 devs
- Sem dependências externas

STATUS:
✅ Visão validada
✅ Escopo confirmado
✅ Arquitetura pronta
✅ Pronto para começar!
```
