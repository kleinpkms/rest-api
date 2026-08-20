# Revisão do Documento de Visão - EasyFamily
## Relatório Executivo

**Data:** 20 de agosto de 2026  
**Status:** ✅ Documentação sólida com pontos críticos de validação  
**Recomendação:** Proceder com validação de regras de negócio antes de implementação  

---

## 1. AVALIAÇÃO GERAL

### ✅ Pontos Fortes

| Aspecto | Avaliação | Detalhe |
|---------|-----------|---------|
| **Estrutura** | ⭐⭐⭐⭐⭐ | Documento bem organizado, lógico e fácil de navegar |
| **Problema** | ⭐⭐⭐⭐⭐ | Problema real e bem articulado; personas claras |
| **Complexidade** | ⭐⭐⭐⭐ | Ciclos híbridos é uma solução elegante para problema real |
| **Escopo** | ⭐⭐⭐⭐ | Bem delimitado; funcionalidades principais claramente definidas |
| **Modelagem** | ⭐⭐⭐⭐ | Modelo de dados coerente com as regras de negócio |

### ⚠️ Lacunas Críticas

1. **Regras de Rateio** — Clareza insuficiente sobre cálculos
2. **Settlement (Acerto de Contas)** — Processo não detalhado
3. **Integrações** — Nenhuma mencionada; importação de transações?
4. **Moeda** — Sistema é apenas em BRL ou multi-moeda?
5. **Validações de Negócio** — Faltam regras explícitas de operação

---

## 2. VALIDAÇÕES NECESSÁRIAS (Críticas)

### 2.1 Ciclos Financeiros Híbridos

**Questão:** Como o sistema se comporta em transições de ciclo?

```
Cenário: Membro A tem ciclo do dia 5-4. Membro B tem ciclo do dia 15-14.
Despesa compartilhada vence no dia 10.

A) Qual ciclo se aplica? (Global ou do pagador?)
B) Se A paga no dia 8 (dentro do seu ciclo) e B recebe no dia 20 (próximo ciclo),
   como é registrado o crédito?
C) O settlement é calculado por ciclo global ou por período de overlap?
```

**Recomendação:** Criar matriz de decisão com casos extremos.

---

### 2.2 Rateio Proporcional

**Problema:** Documentação diz "baseado na renda ou percentual customizado", mas sem exemplos.

**Exemplo Prático Faltando:**
```
Renda Mensal: Membro A = R$ 5.000 | Membro B = R$ 3.000
Despesa Compartilhada = R$ 1.200

Proporção = 5000/(5000+3000) = 62,5% | 3000/8000 = 37,5%
Cota A = R$ 750 | Cota B = R$ 450

Validar:
- A proporção é recalculada todo ciclo?
- Ou é fixa até alteração manual?
- E se um membro ganhar 13º? Afeta proporção retroativamente?
```

---

### 2.3 Settlement (Acerto de Contas)

**Lacuna Principal:** Documento menciona mas não especifica:

- Como é calculado exatamente?
- Em qual frequência? (Diário, fim de ciclo, manual?)
- Como evitar loops de reembolso?
- Se A deve a B e B deve a C, há consolidação?

**Exemplo Necessário:**
```
Cenário Simplificado (ciclo global 1-30):
- Despesa Moradia (R$ 1.200, compartilhada 50/50): A pagou
  → A gastou R$ 1.200, devia R$ 600 | B devia R$ 600
  
- Despesa Comida (R$ 400, compartilhada 60/40 por renda): B pagou
  → B gastou R$ 400, devia R$ 240 | A devia R$ 160

Settlement do ciclo:
- A: (+1.200 gasto) - (600 deve) = +600 a receber
- B: (+400 gasto) - (240 deve) = +160 a receber
- Crédito A→B: R$ 160 (A deve a B de volta)

Como o sistema representa isso? Uma única transação Settlement?
```

---

### 2.4 Ativos Compartilhados com Rateio

**Questão:** Qual é o comportamento em caso de:

1. **Venda do Ativo:**
   - Imóvel 60/40 é vendido por R$ 300.000
   - Sistema divide automaticamente? (R$ 180k / R$ 120k)
   - Ou é apenas registro informativo?

2. **Valorização/Desvalorização:**
   - Bitcoin comprado por R$ 10.000 (50/50), agora vale R$ 15.000
   - Ganho de R$ 5.000 é reconhecido? Quando?
   - Afeta as metas de patrimônio em tempo real?

3. **Despesas Vinculadas a Ativos:**
   - IPVA do carro 60/40 = R$ 1.500
   - Documento diz "herda a proporção", confirmado? Sem exceções?

---

### 2.5 Metas de Poupança

**Questão:** "Aportes Inteligentes" — Como funciona?

```
Cenário:
- Meta: "Viagem Disney" (Target: R$ 10.000)
- Ciclo mensal termina com A tendo +R$ 500 de sobra, B tendo +R$ 300

A) Sistema deposita automaticamente na meta?
   - Precisa de confirmação do usuário?
   - Há limite de % do saldo para evitar risco?

B) Relatório mostra "A aportou R$ 500, B aportou R$ 300"
   - E se A contribuiu mas depois precisa sacar?
   - É possível sacar de uma meta iniciada?
```

---

### 2.6 Dependentes e Limites

**Questão:** Como funciona exatamente?

```
Dependente (filho/a) tem limite de R$ 500/mês em "Lazer":
- Se lançar R$ 300 em "Videogame", R$ 250 em "Cinema":
  a) Sistema rejeita a segunda? (R$ 300 + R$ 250 = R$ 550 > R$ 500)
  b) Ou apenas alerta?
  c) Admin pode ajustar retroativamente?

- Despesas de dependentes são rateadas?
  - "Escola do filho" é 100% pessoal?
  - Ou a família compartilha certos gastos de dependentes?
```

---

## 3. PROPOSTAS DE AJUSTE

### 3.1 Adicionar Seção: "Fluxo de Settlement Detalhado"

```markdown
### 4.7 Motor de Acerto de Contas (Settlement Engine)

O Settlement resolve automaticamente "quem deve a quem" ao final 
de cada ciclo de competência familiar. Opera em 3 fases:

**Fase 1: Apuração de Débitos/Créditos**
- Cada membro soma suas transações compartilhadas
- Desconta sua responsabilidade proporcional
- Resultado: Saldo individual positivo (crédito) ou negativo (débito)

**Fase 2: Consolidação de Débitos**
- Se A, B, C têm débitos e D, E têm créditos
- Sistema calcula menor quantidade de transferências
- Exemplo: A→D, B→E, C→D (3 transações ao invés de 6)

**Fase 3: Registro de Transações de Settlement**
- Cada transferência é registrada como transação de TRANSFER
- Marca-se como "Settlement - Ciclo X"
- Auditável e reversível (se houver erro)

**Regras:**
- Settlement é calculado no final do ciclo (dia 1º do próximo)
- Usuários recebem notificação 2 dias antes
- Podem revisar antes da finalização
- Após finalizado, pode ser revertido apenas por Admin
- Arredondamento: sempre para cima no débito, para baixo no crédito
```

---

### 3.2 Adicionar Seção: "Ciclos Híbridos - Matriz de Decisão"

```markdown
### 4.1.2 Matriz de Decisão para Ciclos Híbridos

| Situação | Regra |
|----------|-------|
| Transação é lançada fora do ciclo global | Registra-se no ciclo mais recente; sinaliza em relatório |
| Membro recebe renda fora de seu ciclo | Cria ciclo adicional; alerta para revisão manual |
| Despesa vence antes de um membro receber | Sistema alerta; sugere pré-aprovação ou adiamento |
| Ciclos se sobrepõem (ex: A vai de 5-4, B de 15-14) | Ambos inclusos no ciclo global; settlement resolve sobreposição |
```

---

### 3.3 Adicionar Seção: "Integrações Planejadas"

```markdown
### 4.8 Integrações (Roadmap)

**MVP (v1.0):**
- Importação manual de extratos (.csv)
- Integração com Clerk para autenticação

**Roadmap (v1.1+):**
- API Pix (Open Banking) para importação automática de transações
- Sincronização com planilhas (Google Sheets / Excel)
- Webhooks para notificações em Slack/Email

**Fora de Escopo (hoje):**
- Integração com home banking
- Robo-advisor de investimentos
```

---

### 3.4 Aumentar Especificidade da Modelagem de Dados

**Adicionar Tabelas:**

```
TransactionAuditLog
├── id
├── transaction_id
├── changed_by (member_id)
├── change_type [CREATED, UPDATED, DELETED]
├── old_value (JSON)
├── new_value (JSON)
└── timestamp

SettlementCycle
├── id
├── family_id
├── cycle_start_date
├── cycle_end_date
├── status [DRAFT, PENDING_REVIEW, FINALIZED, REVERSED]
├── created_at
└── finalized_by (member_id)

SettlementTransaction
├── id
├── settlement_cycle_id
├── from_member_id
├── to_member_id
├── amount
└── linked_transaction_id (ou null se consolidado)
```

---

## 4. QUESTÕES PENDENTES (Para Validação)

| # | Pergunta | Prioridade | Impacto |
|----|----------|-----------|---------|
| 1 | Sistema é apenas em BRL ou multi-moeda? | 🔴 Alta | Arquitetura de dados, conversão de taxas |
| 2 | Pode haver "transferência entre contas"? (A paga do cartão, depois transfere da corrente de B) | 🔴 Alta | Impacta modelo de transações |
| 3 | Ativos podem ser "parcelados" (ex: entrada de imóvel)? | 🟡 Média | Complexidade de rastreamento |
| 4 | Existe regra de prescrição? (Settlement muito antigo) | 🟡 Média | Limpeza de base de dados |
| 5 | Dependentes podem lançar receitas? (ex: mesada, presente) | 🟡 Média | Fluxo de aprovação |
| 6 | Há limite de membros por família? | 🟢 Baixa | Consideração técnica apenas |
| 7 | Exportação de relatórios para imposto de renda? | 🟢 Baixa | Roadmap pós-MVP |

---

## 5. PLANO DE IMPLEMENTAÇÃO (Recomendação)

### Fase 1: MVP - Core Funcional (8-10 semanas)

**Escopo Reduzido (remover de v1.0):**
- ❌ Ciclos Híbridos complexos → Apenas ciclo global + notificação de descompasso
- ❌ Settlement automático → Settlement manual/revisado
- ❌ Rateio proporcional → Apenas igualitário (50/50)
- ❌ Metas inteligentes → Apenas rastreamento manual
- ❌ Multi-moeda → Apenas BRL

**Incluir em v1.0:**
- ✅ Gestão de membros (ADMIN, CONTRIBUTOR, DEPENDENT)
- ✅ Lançamento de transações (receita, despesa)
- ✅ Categorização (3 níveis)
- ✅ Contas correntes simples
- ✅ Dashboard básico (Receita vs. Despesa)
- ✅ Relatório de settlement manual
- ✅ Auditoria de transações

### Fase 2: Consolidação (4-6 semanas)

- Ciclos híbridos (versão simplificada)
- Rateio proporcional
- Settlement automático com revisão
- Gestão de ativos (read-only)

### Fase 3: Premium Features (6-8 semanas)

- Metas inteligentes
- Ativos compartilhados com transações de compra/venda
- Integrações (Open Banking, etc.)

---

## 6. MATRIZ DE RISCO

| Risco | Severidade | Mitigação |
|-------|-----------|----------|
| Settlement loops infinitos | 🔴 Alta | Algoritmo rigoroso + testes automatizados |
| Perda de dados em transição de ciclo | 🔴 Alta | Transações ACID; logs de auditoria completos |
| Membros descordam de rateio | 🟡 Média | UI clara + histórico de decisões + changelog |
| Performance em grandes famílias (50+ membros, 10k+ transações) | 🟡 Média | Índices MongoDB, paginação, agregações |
| Múltiplos admins sem sincronização | 🟡 Média | Operações idempotentes; versionamento de config |

---

## 7. CHECKLIST DE VALIDAÇÃO ANTES DE CÓDIGO

- [ ] **Validar Cycles**: Matriz de decisão aprovada pelo dono
- [ ] **Validar Settlement**: Exemplos com números reais testados
- [ ] **Validar Rateio**: Documentar fórmulas matemáticas
- [ ] **Validar Escopo**: Confirmar o que entra em v1.0
- [ ] **Validar Integrações**: Decidir roadmap de APIs externas
- [ ] **Validar Segurança**: Regras de autorização por role
- [ ] **Validar LGPD**: Plano de retenção/exclusão de dados

---

## 8. RECOMENDAÇÃO FINAL

✅ **Prosseguir com implementação, MAS:**

1. **Antes de começar:** Reunião de 1-2h para validar as 7 questões críticas da seção 2
2. **Criar documento complementar:** "Regras de Negócio Detalhas" com exemplos numéricos
3. **MVP reduzido:** Focar em core (transações + categorias + dashboard)
4. **Próxima iteração:** Ciclos e settlement

**Arquitetura proposta é sólida.** Apenas a complexidade do settlement e ciclos híbridos precisa ser "testada" com cenários reais antes de codificar.
