# Plano de Implementação Técnico - EasyFamily
## Stack: Express.js + MongoDB + Clerk + Vercel

**Versão:** 1.0 (MVP)  
**Timeline:** 8-10 semanas  
**Tech Lead:** Klein  

---

## 1. ARQUITETURA DE ALTO NÍVEL

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend + API)                  │
├─────────────────────────────────────────────────────────────┤
│  React/Next.js App                                          │
│  ├── Pages: Dashboard, Transactions, Assets, Goals, Admin   │
│  ├── Components: Forms, Charts, Tables                      │
│  └── State: React Query + Zustand                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼────┐  ┌──────▼────┐  ┌─────▼─────┐
    │ Clerk  │  │ Express   │  │  MongoDB  │
    │ (Auth) │  │   API     │  │   Atlas   │
    └────────┘  └───────────┘  └───────────┘
                      ▲
                      │
            Middleware (Cors, Auth, Logging)
```

---

## 2. ESTRUTURA DE DIRETÓRIOS (Backend)

```
/apps/backend
├── api/
│   ├── routes/
│   │   ├── families.ts          # GET/POST families
│   │   ├── members.ts           # Gerenciar membros
│   │   ├── transactions.ts      # CRUD de transações
│   │   ├── assets.ts            # Gestão de ativos
│   │   ├── categories.ts        # Hierarquia de categorias
│   │   ├── goals.ts             # Metas de poupança
│   │   └── settlement.ts        # Motor de acerto de contas
│   │
│   ├── controllers/             # Lógica de negócio
│   │   ├── familyController.ts
│   │   ├── transactionController.ts
│   │   ├── settlementController.ts
│   │   └── ...
│   │
│   ├── models/                  # Schemas MongoDB
│   │   ├── Family.ts
│   │   ├── Member.ts
│   │   ├── Transaction.ts
│   │   ├── Asset.ts
│   │   ├── AssetOwnership.ts
│   │   ├── Category.ts
│   │   ├── Account.ts
│   │   ├── SavingsGoal.ts
│   │   ├── GoalContribution.ts
│   │   ├── TransactionAuditLog.ts
│   │   ├── SettlementCycle.ts
│   │   └── SettlementTransaction.ts
│   │
│   ├── services/                # Lógica complexa
│   │   ├── settlementService.ts
│   │   ├── transactionService.ts
│   │   ├── authService.ts
│   │   ├── validationService.ts
│   │   └── reportingService.ts
│   │
│   ├── middleware/
│   │   ├── authMiddleware.ts    # Validar token Clerk
│   │   ├── familyMiddleware.ts  # Validar acesso à família
│   │   ├── errorHandler.ts
│   │   └── logger.ts
│   │
│   ├── utils/
│   │   ├── database.ts          # Conexão MongoDB
│   │   ├── validators.ts        # Schemas Zod/Joi
│   │   ├── errors.ts            # Classes de erro customizadas
│   │   └── constants.ts         # Enums, constantes
│   │
│   └── index.ts                 # Express app setup
│
├── .env.example
├── package.json
└── vercel.json
```

---

## 3. CRONOGRAMA DETALHADO

### **Semana 1-2: Setup & Autenticação (10 dias)**

**Tarefas:**
- [ ] Setup inicial Express + TypeScript + MongoDB
- [ ] Configurar Clerk (OAuth, JWT validation)
- [ ] Criar middleware de autenticação
- [ ] Criar schemas MongoDB base (Family, Member, User)
- [ ] Setup de logging e error handling

**Deliverables:**
- Backend rodando em `/api`
- Autenticação via Clerk funcionando
- Testes de middleware

**Dependências:** Nenhuma

---

### **Semana 2-3: Gestão de Famílias & Membros (10 dias)**

**Tarefas:**
- [ ] CRUD Family: criar, listar, atualizar, deletar
- [ ] CRUD Member: adicionar, remover, alterar role
- [ ] Convites de membro (via email ou link)
- [ ] Validação de permissões (ADMIN vs. CONTRIBUTOR vs. DEPENDENT)
- [ ] Testes unitários

**Endpoints:**
```
POST   /api/families                  # Criar família
GET    /api/families/:id              # Detalhes
PUT    /api/families/:id              # Atualizar config
GET    /api/families/:id/members      # Listar membros
POST   /api/families/:id/members      # Convidar membro
DELETE /api/families/:id/members/:mid # Remover membro
```

**Deliverables:**
- Família e membros persistindo em MongoDB
- Permissões de acesso funcionando

---

### **Semana 3-4: Categorias & Contas (8 dias)**

**Tarefas:**
- [ ] CRUD Category (hierarquia 3 níveis)
- [ ] CRUD Account (Corrente, Cartão, etc.)
- [ ] Associação Account ↔️ Member (quem é proprietário)
- [ ] Validação de categoria por tipo (INCOME, EXPENSE, TRANSFER)
- [ ] Testes

**Endpoints:**
```
GET    /api/families/:id/categories
POST   /api/families/:id/categories
PUT    /api/families/:id/categories/:cid

GET    /api/families/:id/accounts
POST   /api/families/:id/accounts
PUT    /api/families/:id/accounts/:aid
```

**Deliverables:**
- Estrutura de categorias customizável
- Gestão de contas por membro

---

### **Semana 4-5: Lançamento de Transações (12 dias)**

**Tarefas:**
- [ ] CRUD Transaction (receita, despesa)
- [ ] Validação de categoria + account
- [ ] Campo `scope` (PERSONAL vs. SHARED)
- [ ] Para SHARED: adicionar `TransactionSplit`
- [ ] Registro automático em TransactionAuditLog
- [ ] Testes

**Modelo Transaction:**
```typescript
{
  _id: ObjectId,
  family_id: string,
  amount: number,
  description: string,
  type: "INCOME" | "EXPENSE" | "TRANSFER",
  category_id: string,
  account_id: string,
  paid_by_member_id: string,
  competence_date: Date,      // Mês/ano da transação
  due_date: Date,             // Data de vencimento
  status: "PENDING" | "PAID" | "OVERDUE",
  scope: "PERSONAL" | "SHARED",
  linked_asset_id?: string,   // Se vinculado a um ativo
  created_at: Date,
  updated_at: Date,
  created_by: string
}
```

**Endpoints:**
```
POST   /api/families/:id/transactions
GET    /api/families/:id/transactions
GET    /api/families/:id/transactions/:tid
PUT    /api/families/:id/transactions/:tid
DELETE /api/families/:id/transactions/:tid
```

**Deliverables:**
- Transações sendo persistidas
- Splits funcionando para despesas compartilhadas

---

### **Semana 5-6: Dashboard & Relatórios (10 dias)**

**Tarefas:**
- [ ] Endpoint de dashboard (resumo financeiro)
- [ ] Cálculo de receita total vs. despesa total
- [ ] Análise por categoria (gráfico de pizza)
- [ ] Saldo por account
- [ ] Filtros por período (ciclo global)
- [ ] Relatório em JSON para frontend renderizar

**Endpoint:**
```
GET /api/families/:id/dashboard?start_date=...&end_date=...
```

**Response:**
```json
{
  "period": {
    "start": "2026-08-01",
    "end": "2026-08-31"
  },
  "totals": {
    "income": 10000,
    "expense": 7500,
    "net": 2500
  },
  "by_category": [
    {
      "name": "Moradia",
      "amount": 2000,
      "percentage": 26.7
    }
  ],
  "accounts": [
    {
      "name": "Conta Corrente A",
      "balance": 3000
    }
  ]
}
```

**Deliverables:**
- Dashboard com dados reais

---

### **Semana 6-7: Gestão de Ativos (8 dias)**

**Tarefas:**
- [ ] CRUD Asset (imóvel, veículo, cripto, etc.)
- [ ] Tabela AssetOwnership (proporcionalidade)
- [ ] Calcular valor total da família (Net Worth)
- [ ] Endpoint para listar patrimônio
- [ ] Testes

**Endpoints:**
```
POST   /api/families/:id/assets
GET    /api/families/:id/assets
PUT    /api/families/:id/assets/:aid
POST   /api/families/:id/assets/:aid/ownership

GET    /api/families/:id/net-worth    # Patrimônio total
```

**Deliverables:**
- Cadastro de ativos com propriedade compartilhada

---

### **Semana 7-8: Settlement Engine (12 dias)**

**Tarefas:**
- [ ] Algoritmo de settlement (Fase 1-3 conforme Doc. Revisão)
- [ ] Tabela SettlementCycle
- [ ] Tabela SettlementTransaction
- [ ] Endpoint POST para gerar settlement (admin only)
- [ ] Endpoint para listar ciclos
- [ ] Testes rigorosos (incluir casos extremos)
- [ ] Notificações (antes, durante, após settlement)

**Lógica de Settlement:**
```python
def calculate_settlement(family_id, start_date, end_date):
    # 1. Buscar todas as transações SHARED neste período
    shared_txns = fetch_shared_transactions(family_id, start_date, end_date)
    
    # 2. Para cada membro, calcular saldo
    balances = {}
    for member in family.members:
        total_spent = sum([t.amount for t in shared_txns if t.paid_by_member_id == member.id])
        total_responsible = sum([split.amount for split in shared_txns if split.member_id == member.id])
        balances[member.id] = total_spent - total_responsible
    
    # 3. Consolidar débitos/créditos (algoritmo greedy)
    debtors = [m for m, b in balances.items() if b < 0]
    creditors = [m for m, b in balances.items() if b > 0]
    
    settlements = []
    for debtor in debtors:
        remaining_debt = abs(balances[debtor])
        for creditor in creditors:
            if balances[creditor] <= 0:
                continue
            transfer_amount = min(remaining_debt, balances[creditor])
            settlements.append({
                from: debtor,
                to: creditor,
                amount: transfer_amount
            })
            remaining_debt -= transfer_amount
    
    return settlements
```

**Endpoints:**
```
POST   /api/families/:id/settlement/calculate
GET    /api/families/:id/settlement/cycles
POST   /api/families/:id/settlement/cycles/:cycle_id/finalize
POST   /api/families/:id/settlement/cycles/:cycle_id/reverse
```

**Deliverables:**
- Settlement calculado e salvo
- Usuários visualizam débitos/créditos

---

### **Semana 8-9: Metas de Poupança (8 dias)**

**Tarefas:**
- [ ] CRUD SavingsGoal
- [ ] CRUD GoalContribution (aportes)
- [ ] Endpoint para listar metas + progresso
- [ ] Cálculo de quanto cada membro aportou
- [ ] Testes

**Endpoints:**
```
POST   /api/families/:id/goals
GET    /api/families/:id/goals
PUT    /api/families/:id/goals/:gid
POST   /api/families/:id/goals/:gid/contributions

GET    /api/families/:id/goals/:gid/progress
```

**Deliverables:**
- Metas criadas e rastreadas

---

### **Semana 9-10: Testes, Polimento & Deploy (10 dias)**

**Tarefas:**
- [ ] Testes de integração (end-to-end)
- [ ] Testes de performance (settlement com 10k transações)
- [ ] Validação de dados (Zod/Joi)
- [ ] Rate limiting
- [ ] Documentação de API (Swagger)
- [ ] Deploy em produção (Vercel)
- [ ] Monitoramento (logs, erros)

**Deliverables:**
- Backend pronto para produção
- API documentada
- Testes passando

---

## 4. TECNOLOGIAS ESPECÍFICAS

### **Backend (Express.js)**

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^8.0.0",
    "@clerk/express": "^0.x.x",
    "zod": "^3.22.0",
    "dotenv": "^16.0.0",
    "cors": "^2.8.5",
    "winston": "^3.11.0",
    "decimal.js": "^10.4.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "jest": "^29.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "ts-node": "^10.0.0"
  }
}
```

### **MongoDB Schemas (Mongoose)**

Usar TypeScript com tipos genéricos:

```typescript
// Exemplo: Transaction Schema
interface ITransaction {
  family_id: string;
  amount: Decimal128;  // Para precisão monetária
  description: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  category_id: ObjectId;
  account_id: ObjectId;
  paid_by_member_id: string;
  competence_date: Date;
  due_date: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  scope: 'PERSONAL' | 'SHARED';
  linked_asset_id?: ObjectId;
  splits?: Array<{
    member_id: string;
    percentage: number;
    amount: Decimal128;
  }>;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

const transactionSchema = new Schema<ITransaction>({
  family_id: { type: String, required: true, index: true },
  amount: { type: Schema.Types.Decimal128, required: true },
  description: String,
  // ... outros campos
});

// Índices para performance
transactionSchema.index({ family_id: 1, competence_date: -1 });
transactionSchema.index({ paid_by_member_id: 1, scope: 1 });
```

### **Tratamento de Dinheiro**

**Não usar float!** Usar `Decimal128` (MongoDB) ou `decimal.js`:

```typescript
import Decimal from 'decimal.js';

// ✅ Correto
const valor = new Decimal('150.50');
const comTaxa = valor.times(1.1);  // 165.55

// ❌ Errado
const valor = 150.50;
const comTaxa = valor * 1.1;  // 165.55000000000001
```

---

## 5. AUTENTICAÇÃO COM CLERK

### Middleware de Autenticação

```typescript
import { requireAuth } from '@clerk/express';

app.use(requireAuth());  // Protege todas as rotas

// Acessar usuário autenticado
app.get('/api/me', (req, res) => {
  const userId = req.auth.userId;
  const userEmail = req.auth.sessionClaims.email;
  res.json({ userId, userEmail });
});
```

### Sincronização Clerk ↔️ Banco de Dados

```typescript
// Webhook do Clerk (quando usuário se cria)
app.post('/webhooks/clerk', async (req, res) => {
  const { type, data } = req.body;
  
  if (type === 'user.created') {
    // Criar usuário em MongoDB
    const user = await User.create({
      clerk_id: data.id,
      email: data.email_addresses[0].email_address,
      name: data.first_name + ' ' + data.last_name
    });
  }
});
```

---

## 6. VALIDAÇÕES DE NEGÓCIO

### Zod Validators

```typescript
import { z } from 'zod';

const TransactionValidator = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(3).max(500),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  category_id: z.string().regex(/^[0-9a-f]{24}$/),  // ObjectId
  account_id: z.string().regex(/^[0-9a-f]{24}$/),
  scope: z.enum(['PERSONAL', 'SHARED']),
  competence_date: z.date().refine(
    (d) => d >= new Date('2020-01-01'),
    'Data não pode ser no passado (2020+)'
  )
});

// Uso em rota
app.post('/api/transactions', async (req, res) => {
  const validated = TransactionValidator.parse(req.body);
  // ... lógica segura
});
```

---

## 7. TESTES AUTOMATIZADOS

### Jest Setup

```typescript
// __tests__/settlement.test.ts
import { calculateSettlement } from '../services/settlementService';

describe('Settlement Service', () => {
  it('deve calcular settlement corretamente', async () => {
    const family = createMockFamily();
    const transactions = [
      { paid_by: 'A', amount: 100, members_responsible: ['A', 'B'] },
      { paid_by: 'B', amount: 60, members_responsible: ['A', 'B'] }
    ];
    
    const result = calculateSettlement(family, transactions);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      from: 'A',
      to: 'B',
      amount: 20
    });
  });
  
  it('deve lidar com 3+ membros e consolidar', () => {
    // A deve R$50 a B
    // B deve R$50 a C
    // C deve R$50 a A
    // Resultado: A→B R$50, B→C R$50 (sem A→C)
  });
});
```

---

## 8. DEPLOY NA VERCEL

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "MONGODB_URI": "@mongodb_uri",
    "CLERK_SECRET_KEY": "@clerk_secret_key",
    "NODE_ENV": "production"
  }
}
```

### CI/CD (GitHub Actions)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: vercel/action@v4
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 9. MONITORAMENTO & LOGGING

### Winston Logger

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Uso
logger.info('Transação criada', { transaction_id, family_id, amount });
logger.error('Erro no settlement', { error: e.message });
```

---

## 10. PRÓXIMOS PASSOS

### Após MVP:

1. **v1.1 - Ciclos Híbridos**
   - Implementar `personal_cycle_start_day` em Member
   - Lógica de alertas de liquidez
   - Dashboard com múltiplos períodos

2. **v1.2 - Rateio Proporcional**
   - Cálculo baseado em renda
   - Histórico de mudanças de proporção
   - Retroatividade (13º, bônus)

3. **v1.3 - Integrações**
   - Open Banking (Pix)
   - Google Sheets sync
   - Webhooks para notificações

4. **v2.0 - Mobile App**
   - React Native
   - Sincronização offline-first
   - OCR de comprovantes

---

## 11. CHECKLIST FINAL

**Antes de iniciar:**
- [ ] Repositório GitHub clonado localmente
- [ ] MongoDB Atlas conectado e testado
- [ ] Clerk app criado e configurado
- [ ] Vercel project criado
- [ ] Variáveis de ambiente (.env) configuradas
- [ ] Node 18+ instalado
- [ ] Jest configurado
- [ ] ESLint + Prettier configurados

**Semanas 1-2:**
- [ ] `git init` && primeiro commit
- [ ] Express rodando em localhost:3000
- [ ] Clerk autenticando
- [ ] MongoDB conectando

**Ready to code?** ✅
